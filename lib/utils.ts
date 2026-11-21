import { ChatSession } from "./types";

/**
 * Utility function to combine CSS class names cleanly.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format timestamp into readable time string.
 */
export function formatTime(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Generate a random UUID-like string.
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

/**
 * Auto-generate a clean chat title from the first user message.
 */
export function generateTitleFromMessage(message: string): string {
  const trimmed = message.trim().replace(/^["']|["']$/g, "");
  if (!trimmed) return "New Conversation";

  // Take the first line
  const firstLine = trimmed.split("\n")[0].trim();
  if (firstLine.length <= 36) {
    return firstLine;
  }
  return firstLine.slice(0, 36).trim() + "...";
}

export interface GroupedSessions {
  today: ChatSession[];
  yesterday: ChatSession[];
  older: ChatSession[];
}

/**
 * Group sessions by Today, Yesterday, and Older.
 * Uses a stable fallback timestamp when in SSR/prerender to prevent build-time hydration mismatches.
 */
export function groupSessionsByDate(
  sessions: ChatSession[],
  referenceDate?: Date
): GroupedSessions {
  const ref =
    referenceDate ||
    (typeof window !== "undefined"
      ? new Date()
      : new Date("2026-11-21T00:00:00.000Z"));

  const startOfToday = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

  const grouped: GroupedSessions = {
    today: [],
    yesterday: [],
    older: [],
  };

  for (const session of sessions) {
    const rawTime = session.updatedAt || session.createdAt;
    const sessionTime = new Date(rawTime).getTime();

    if (isNaN(sessionTime)) {
      grouped.older.push(session);
    } else if (sessionTime >= startOfToday) {
      grouped.today.push(session);
    } else if (sessionTime >= startOfYesterday) {
      grouped.yesterday.push(session);
    } else {
      grouped.older.push(session);
    }
  }

  return grouped;
}
