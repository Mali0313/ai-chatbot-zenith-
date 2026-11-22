import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ChatSession, ChatMessage, ChatAttachment } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Returns true if Supabase URL and Anon/Service Key are configured.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      supabaseUrl.startsWith("http") &&
      (supabaseAnonKey || supabaseServiceKey)
  );
}

// Client-side or standard anon client
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey)
  : null;

// Server-side privileged client (if service role key provided)
export function getServerSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  const key = supabaseServiceKey || supabaseAnonKey;
  return createClient(supabaseUrl, key, {
    auth: { persistSession: false },
  });
}

export const STORAGE_BUCKET = "chat-uploads";

/**
 * Upload a file directly to Supabase Storage bucket 'chat-uploads'
 */
export async function uploadToSupabaseStorage(
  file: File | Blob,
  fileName: string,
  sessionId: string = "general",
  contentType?: string
): Promise<{ url: string; storagePath: string } | null> {
  const client = supabase;
  if (!client) return null;

  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${sessionId}/${Date.now()}-${sanitized}`;

  const { error } = await client.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      contentType: contentType || "application/octet-stream",
      upsert: true,
    });

  if (error) {
    console.error("Supabase Storage upload error:", error);
    throw error;
  }

  const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
  return {
    url: data.publicUrl,
    storagePath,
  };
}

/**
 * Save or update a session in Supabase database
 */
export async function saveSessionToSupabase(session: ChatSession): Promise<boolean> {
  const client = supabase;
  if (!client) return false;

  try {
    const { error } = await client.from("chat_sessions").upsert(
      {
        id: session.id,
        title: session.title,
        created_at: session.createdAt,
        updated_at: session.updatedAt || new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      console.warn("Error saving session to Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Failed saving session to Supabase:", err);
    return false;
  }
}

/**
 * Save a message with its attachment URLs in Supabase database
 */
export async function saveMessageToSupabase(
  sessionId: string,
  message: ChatMessage
): Promise<boolean> {
  const client = supabase;
  if (!client) return false;

  try {
    const { error } = await client.from("chat_messages").upsert(
      {
        id: message.id,
        session_id: sessionId,
        role: message.role,
        content: message.content,
        attachments: (message.attachments || []).map((a: ChatAttachment) => ({
          id: a.id,
          name: a.name,
          size: a.size,
          type: a.type,
          mimeType: a.mimeType,
          url: a.url || "",
          storagePath: a.storagePath || "",
        })),
        image_url: message.imageUrl || null,
        is_image: Boolean(message.isImage),
        created_at: message.createdAt,
      },
      { onConflict: "id" }
    );

    if (error) {
      console.warn("Error saving message to Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Failed saving message to Supabase:", err);
    return false;
  }
}

/**
 * Fetch all sessions and messages from Supabase database
 */
export async function fetchSessionsFromSupabase(): Promise<ChatSession[] | null> {
  const client = supabase;
  if (!client) return null;

  try {
    const { data: sessionRows, error: sessionErr } = await client
      .from("chat_sessions")
      .select("*")
      .order("updated_at", { ascending: false });

    if (sessionErr || !sessionRows) {
      console.warn("Error fetching sessions from Supabase:", sessionErr?.message);
      return null;
    }

    if (sessionRows.length === 0) {
      return [];
    }

    const { data: messageRows, error: msgErr } = await client
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (msgErr) {
      console.warn("Error fetching messages from Supabase:", msgErr.message);
      return null;
    }

    // Map messages by session_id
    const messagesBySession: Record<string, ChatMessage[]> = {};
    for (const row of messageRows || []) {
      const sId = row.session_id;
      if (!messagesBySession[sId]) {
        messagesBySession[sId] = [];
      }
      messagesBySession[sId].push({
        id: row.id,
        role: row.role,
        content: row.content || "",
        createdAt: row.created_at,
        imageUrl: row.image_url || undefined,
        isImage: row.is_image || false,
        attachments: Array.isArray(row.attachments) ? row.attachments : [],
      });
    }

    return sessionRows.map((s) => ({
      id: s.id,
      title: s.title,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      messages: messagesBySession[s.id] || [],
    }));
  } catch (err) {
    console.warn("Failed to fetch from Supabase:", err);
    return null;
  }
}

/**
 * Delete a session and all its messages from Supabase
 */
export async function deleteSessionFromSupabase(sessionId: string): Promise<boolean> {
  const client = supabase;
  if (!client) return false;

  try {
    const { error } = await client
      .from("chat_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) {
      console.warn("Error deleting session from Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Failed deleting session from Supabase:", err);
    return false;
  }
}
