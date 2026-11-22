import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION =
  "You are a helpful, friendly personal assistant. Give clear, concise answers and useful suggestions.";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_MESSAGES_COUNT = 50;
const MAX_OUTPUT_TOKENS = 2048; // Capped max tokens per response

// Models prioritized by speed and current availability
const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
];

// In-memory sliding window rate limiter: 20 requests per minute per IP
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetSeconds: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Auto clean stale records if map gets large
  if (rateLimitMap.size > 5000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (val.resetTime <= now) rateLimitMap.delete(key);
    }
  }

  if (!record || record.resetTime <= now) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_WINDOW - 1,
      resetSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
    };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      remaining: 0,
      resetSeconds: Math.max(1, Math.ceil((record.resetTime - now) / 1000)),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - record.count,
    resetSeconds: Math.max(1, Math.ceil((record.resetTime - now) / 1000)),
  };
}

interface MessagePayload {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    // 1. IP extraction and Rate Limiting (20 req / min)
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ip = (forwarded ? forwarded.split(",")[0].trim() : realIp) || "127.0.0.1";

    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit reached: Maximum ${MAX_REQUESTS_PER_WINDOW} requests per minute allowed. Please wait ${rateCheck.resetSeconds}s before sending another message.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.resetSeconds),
            "X-RateLimit-Limit": String(MAX_REQUESTS_PER_WINDOW),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // 2. Read and parse body safely
    let body: { messages?: MessagePayload[] };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    const { messages } = body;

    // 3. Validate input structure
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: 'messages' must be a non-empty array." },
        { status: 400 }
      );
    }

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array cannot be empty." },
        { status: 400 }
      );
    }

    if (messages.length > MAX_MESSAGES_COUNT) {
      return NextResponse.json(
        {
          error: `Too many messages in history. Maximum allowed is ${MAX_MESSAGES_COUNT}.`,
        },
        { status: 400 }
      );
    }

    // 4. Validate individual message items and limit message length
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];

      if (!msg || typeof msg !== "object") {
        return NextResponse.json(
          { error: `Message at index ${i} is not a valid object.` },
          { status: 400 }
        );
      }

      if (typeof msg.content !== "string") {
        return NextResponse.json(
          { error: `Message at index ${i} has invalid content. Must be a string.` },
          { status: 400 }
        );
      }

      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        return NextResponse.json(
          {
            error: `Message content exceeds the maximum limit of ${MAX_MESSAGE_LENGTH} characters.`,
          },
          { status: 400 }
        );
      }
    }

    // 5. Securely read API Key from server environment (strictly kept on server)
    const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      return NextResponse.json(
        {
          error:
            "AI_API_KEY is not configured on the server. Please add your Gemini API key to .env.local to chat.",
        },
        { status: 401 }
      );
    }

    // 6. Convert messages to Gemini format (user & model turns)
    const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];

    for (const m of messages) {
      if (m.role === "system") continue;
      const role = m.role === "assistant" ? "model" : "user";
      const text = m.content.trim();
      if (!text) continue;

      // Gemini requires first content turn to be 'user'
      if (contents.length === 0 && role !== "user") {
        continue;
      }

      // Merge consecutive messages with the same role
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += `\n\n${text}`;
      } else {
        contents.push({ role, parts: [{ text }] });
      }
    }

    if (contents.length === 0) {
      return NextResponse.json(
        { error: "No valid user message found to process." },
        { status: 400 }
      );
    }

    // 7. Initialize Google Gen AI client with server API key
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    // Request stream with automatic model fallback for resilience
    let responseStream = null;
    let lastError: unknown = null;

    for (const model of CANDIDATE_MODELS) {
      try {
        responseStream = await ai.models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
          },
        });
        if (responseStream) {
          break;
        }
      } catch (err: unknown) {
        lastError = err;
        console.warn(`Model ${model} was unavailable, trying next candidate...`);
      }
    }

    if (!responseStream) {
      throw lastError || new Error("Failed to initialize stream from AI provider.");
    }

    // 8. Stream the response back to client using Web Streams API
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (streamErr: unknown) {
          console.error("Stream error occurred during response generation.");

          let errorSnippet = "\n\n[Error: Stream interrupted.]";
          const errObj = streamErr as { status?: number; message?: string } | null;
          const msg = errObj?.message || "";

          if (errObj?.status === 429 || msg.includes("RESOURCE_EXHAUSTED")) {
            errorSnippet =
              "\n\n[Error: Rate limit reached. Please wait a moment before sending another message.]";
          } else if (msg.includes("API_KEY_INVALID")) {
            errorSnippet = "\n\n[Error: Invalid API key configured.]";
          }

          controller.enqueue(encoder.encode(errorSnippet));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
        "X-RateLimit-Limit": String(MAX_REQUESTS_PER_WINDOW),
        "X-RateLimit-Remaining": String(rateCheck.remaining),
      },
    });
  } catch (error: unknown) {
    console.error("Route error occurred in /api/chat.");

    const errObj = error as { status?: number; statusCode?: number; message?: string } | null;
    const status = errObj?.status || errObj?.statusCode || 500;
    const message = errObj?.message || "";

    if (
      status === 429 ||
      message.includes("RESOURCE_EXHAUSTED") ||
      message.toLowerCase().includes("rate limit")
    ) {
      return NextResponse.json(
        {
          error:
            "Rate limit exceeded. The AI service is currently busy. Please wait a moment and try again.",
        },
        { status: 429 }
      );
    }

    if (
      (status === 400 || status === 401) &&
      (message.includes("API_KEY_INVALID") ||
        message.includes("API key not valid") ||
        message.includes("unregistered callers"))
    ) {
      return NextResponse.json(
        {
          error:
            "The configured AI_API_KEY is invalid. Please verify your Gemini API key in .env.local.",
        },
        { status: 401 }
      );
    }

    if (
      message.includes("ENOTFOUND") ||
      message.includes("fetch failed") ||
      message.includes("ETIMEDOUT") ||
      message.includes("ECONNREFUSED")
    ) {
      return NextResponse.json(
        {
          error:
            "Network error: Unable to connect to the Gemini API servers. Please check your network connection.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while processing your request with the AI service.",
      },
      {
        status:
          typeof status === "number" && status >= 400 && status < 600
            ? status
            : 500,
      }
    );
  }
}
