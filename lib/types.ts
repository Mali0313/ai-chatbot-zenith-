export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  imageUrl?: string;
  isImage?: boolean;
  error?: boolean;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface SuggestionItem {
  title: string;
  subtitle: string;
  prompt: string;
  isImage?: boolean;
}
