import { NextRequest, NextResponse } from "next/server";

// In-memory sliding window rate limiter: 10 image requests per minute per IP
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function checkImageRateLimit(ip: string): { allowed: boolean; resetSeconds: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Auto clean stale records if map gets large
  if (rateLimitMap.size > 2000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (val.resetTime <= now) rateLimitMap.delete(key);
    }
  }

  if (!record || record.resetTime <= now) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, resetSeconds: 60 };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      resetSeconds: Math.max(1, Math.ceil((record.resetTime - now) / 1000)),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    resetSeconds: Math.max(1, Math.ceil((record.resetTime - now) / 1000)),
  };
}

export async function POST(req: NextRequest) {
  try {
    // 1. IP extraction and Rate Limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ip = (forwarded ? forwarded.split(",")[0].trim() : realIp) || "127.0.0.1";

    const rateCheck = checkImageRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit reached: You can generate up to ${MAX_REQUESTS_PER_WINDOW} images per minute. Please try again in ${rateCheck.resetSeconds}s.`,
        },
        { status: 429 }
      );
    }

    // 2. Validate input prompt
    let body: { prompt?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    const prompt = body?.prompt?.trim();
    if (!prompt) {
      return NextResponse.json(
        { error: "Please provide a prompt describing the image you want to create." },
        { status: 400 }
      );
    }

    if (prompt.length > 1000) {
      return NextResponse.json(
        { error: "Image prompt is too long. Maximum allowed length is 1,000 characters." },
        { status: 400 }
      );
    }

    // 3. Optional server key from environment
    const apiKey = process.env.POLLINATIONS_API_KEY;
    const keyParam = apiKey ? `&key=${encodeURIComponent(apiKey)}` : "";

    // 4. Generate with high-speed models on Pollinations
    const seed = Math.floor(Math.random() * 10000000);
    const encodedPrompt = encodeURIComponent(prompt);

    const candidateUrls = [
      `https://image.pollinations.ai/prompt/${encodedPrompt}?model=turbo&seed=${seed}&nologo=true&width=1024&height=1024${keyParam}`,
      `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&seed=${seed}&nologo=true&width=1024&height=1024${keyParam}`,
      `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&nologo=true${keyParam}`,
    ];

    let imageBuffer: ArrayBuffer | null = null;
    let mimeType = "image/jpeg";
    let successfulUrl = candidateUrls[0];
    let lastErrorStatus = 500;

    for (const url of candidateUrls) {
      try {
        const response = await fetch(url, {
          headers: {
            Accept: "image/jpeg,image/png,image/*",
          },
        });

        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.startsWith("image/")) {
            imageBuffer = await response.arrayBuffer();
            mimeType = contentType.split(";")[0];
            successfulUrl = url;
            break;
          }
        } else {
          lastErrorStatus = response.status;
          console.warn(`Image URL returned HTTP ${response.status}`);
        }
      } catch (fetchErr) {
        console.warn("Failed fetching image candidate:", fetchErr);
      }
    }

    if (!imageBuffer) {
      if (lastErrorStatus === 429 || lastErrorStatus === 402) {
        return NextResponse.json(
          { error: "Image generation rate limit reached. Please wait a moment and try again." },
          { status: 429 }
        );
      }
      return NextResponse.json(
        {
          error:
            "Unable to generate image. The prompt may have triggered safety filters or the image service is temporarily busy. Try adjusting your prompt.",
        },
        { status: 503 }
      );
    }

    // Convert to base64 Data URL so it is self-contained and persists in localStorage
    const base64 = Buffer.from(imageBuffer).toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({
      imageUrl: dataUrl,
      directUrl: successfulUrl,
      prompt,
    });
  } catch (error: unknown) {
    console.error("Error in /api/image route:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while generating the image." },
      { status: 500 }
    );
  }
}
