import { ChatSession, SuggestionItem } from "./types";

export const BOT_NAME = "Zenith";

export const SUGGESTION_CARDS: SuggestionItem[] = [
  {
    title: "Help me plan my day",
    subtitle: "Organize tasks and prioritize high-impact goals",
    prompt: "Help me plan my day. I have 3 major projects, two meetings, and want to make sure I finish my key priority.",
  },
  {
    title: "Brainstorm project ideas",
    subtitle: "Explore innovative web apps and developer tools",
    prompt: "Brainstorm 4 creative developer tooling or AI interface ideas with clean UI/UX.",
  },
  {
    title: "Explain a complex concept",
    subtitle: "Break down distributed consensus simply",
    prompt: "Explain how distributed consensus works in distributed databases, in simple clear language.",
  },
  {
    title: "Write clean TypeScript",
    subtitle: "Type-safe utilities and robust error handling",
    prompt: "Write a type-safe TypeScript retry utility with exponential backoff and cancellation support.",
  },
];

// Static initial seeds avoiding new Date() at module top level for Next.js prerender
const todayIso = "2026-11-21T06:00:00.000Z";
const yesterdayIso = "2026-11-20T12:00:00.000Z";
const olderIso = "2026-11-18T10:00:00.000Z";

export const INITIAL_DUMMY_SESSIONS: ChatSession[] = [
  {
    id: "session-1",
    title: "Next.js Architecture Advice",
    createdAt: todayIso,
    updatedAt: todayIso,
    messages: [
      {
        id: "msg-1-1",
        role: "user",
        content: "What are the core advantages of using Next.js App Router for building a ChatGPT-style interface?",
        createdAt: todayIso,
      },
      {
        id: "msg-1-2",
        role: "assistant",
        content: `The Next.js App Router offers several architecture benefits for building conversational AI apps:

1. **Streaming UI**: Native support for HTTP chunked transfer streaming via Route Handlers, making real-time token rendering seamless.
2. **Server Actions & Route Handlers**: Secure server boundary for your AI API keys (\`AI_API_KEY\`) without exposing credentials to the client bundle.
3. **Component Separation**: Server Components for static shell layouts and client boundaries for interactive chat feeds.
4. **Fast Compilation**: Next.js with Turbopack handles instant module replacement during UI refinement.`,
        createdAt: todayIso,
      },
    ],
  },
  {
    id: "session-2",
    title: "TypeScript Utility Helpers",
    createdAt: yesterdayIso,
    updatedAt: yesterdayIso,
    messages: [
      {
        id: "msg-2-1",
        role: "user",
        content: "Write a clean debounce function in TypeScript.",
        createdAt: yesterdayIso,
      },
      {
        id: "msg-2-2",
        role: "assistant",
        content: `Here is a lightweight, typed debounce implementation:

\`\`\`ts
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}
\`\`\`

This ensures proper typing for the callback arguments and handles timer cleanup.`,
        createdAt: yesterdayIso,
      },
    ],
  },
  {
    id: "session-3",
    title: "Daily Focus & Planning",
    createdAt: olderIso,
    updatedAt: olderIso,
    messages: [
      {
        id: "msg-3-1",
        role: "user",
        content: "Help me plan my day for maximum productivity.",
        createdAt: olderIso,
      },
      {
        id: "msg-3-2",
        role: "assistant",
        content: `Here is a structured framework for your day:

1. **Deep Work Block**: Dedicate your first 90-minute block to your most critical deliverable before checking email or chat.
2. **Review & Tasks**: Tackle supporting tasks and review sessions during mid-morning.
3. **Communication**: Group meetings, replies, and routine updates in the afternoon.`,
        createdAt: olderIso,
      },
    ],
  },
];
