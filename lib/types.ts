export type MessageRole = "user" | "assistant" | "system";

export type AttachmentType = "image" | "video" | "document";

export interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  type: AttachmentType;
  mimeType: string;
  dataUrl: string; // base64 Data URL
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  imageUrl?: string;
  isImage?: boolean;
  attachments?: ChatAttachment[];
  error?: boolean;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SuggestionItem {
  title: string;
  subtitle: string;
  prompt: string;
  isImage?: boolean;
}
