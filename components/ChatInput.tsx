"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Square } from "lucide-react";
import { BOT_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  isGenerating?: boolean;
  onStopGenerating?: () => void;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  isGenerating = false,
  onStopGenerating,
  placeholder = `Message ${BOT_NAME}...`,
}) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea up to 200px
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || disabled || isGenerating) return;

    onSendMessage(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-3 sm:pb-4 pt-1">
      {/* Floating Stop Generating Button */}
      {isGenerating && onStopGenerating && (
        <div className="flex justify-center mb-2 animate-in fade-in duration-200">
          <button
            type="button"
            onClick={onStopGenerating}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-[#171717] shadow-sm transition-all cursor-pointer select-none"
            title="Stop generating response"
          >
            <Square size={11} className="fill-current" />
            <span>Stop generating</span>
          </button>
        </div>
      )}

      {/* Input Form Box */}
      <form
        onSubmit={handleSubmit}
        className={cn(
          "relative flex items-end gap-2 rounded-2xl border px-3 py-2 transition-all shadow-xs",
          "border-[#e5e5e5] dark:border-[#262626]",
          "bg-white dark:bg-[#0a0a0a]",
          isGenerating
            ? "opacity-80 cursor-not-allowed"
            : "focus-within:border-black dark:focus-within:border-white focus-within:ring-1 focus-within:ring-black dark:focus-within:ring-white"
        )}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isGenerating ? `${BOT_NAME} is responding...` : placeholder}
          disabled={disabled || isGenerating}
          rows={1}
          className="w-full resize-none bg-transparent py-1.5 px-1 text-sm sm:text-base outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600 text-black dark:text-white max-h-48 overflow-y-auto leading-relaxed disabled:cursor-not-allowed"
        />

        {isGenerating ? (
          <button
            type="button"
            onClick={onStopGenerating}
            className="shrink-0 mb-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-all cursor-pointer shadow-xs"
            title="Stop generating"
            aria-label="Stop generating"
          >
            <Square size={13} className="fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className={cn(
              "shrink-0 mb-0.5 flex h-8 w-8 items-center justify-center rounded-full transition-all",
              input.trim() && !disabled
                ? "bg-black text-white hover:opacity-90 dark:bg-white dark:text-black cursor-pointer shadow-xs"
                : "bg-neutral-100 text-neutral-400 dark:bg-[#1a1a1a] dark:text-neutral-600 cursor-not-allowed"
            )}
            title="Send message (Enter)"
            aria-label="Send message"
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        )}
      </form>

      <div className="mt-2 text-center text-[11px] text-neutral-400 dark:text-neutral-500 select-none">
        {BOT_NAME} can make mistakes. Verify important info.
      </div>
    </div>
  );
};

export default ChatInput;
