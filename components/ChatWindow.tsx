"use client";

import React, { useRef, useEffect } from "react";
import { PanelLeft, Sparkles, Moon, Sun, Plus, Settings } from "lucide-react";
import { BOT_NAME, SUGGESTION_CARDS } from "@/lib/constants";
import { ChatMessage, SuggestionItem } from "@/lib/types";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onRetryMessage?: () => void;
  onRegenerateMessage?: () => void;
  onStopGenerating?: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onNewChat: () => void;
  isLoading?: boolean;
  isGenerating?: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenSettings?: () => void;
  activeChatTitle?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
  onRetryMessage,
  onRegenerateMessage,
  onStopGenerating,
  onToggleSidebar,
  isSidebarOpen,
  onNewChat,
  isLoading = false,
  isGenerating = false,
  isDarkMode,
  onToggleTheme,
  onOpenSettings,
  activeChatTitle,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest message smoothly
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isGenerating]);

  // Find index of the last assistant message
  const lastAssistantIndex = messages.map((m) => m.role).lastIndexOf("assistant");

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#0a0a0a] text-black dark:text-white transition-colors duration-150">
      {/* Top Header Bar */}
      <header className="h-12 border-b border-[#e5e5e5] dark:border-[#262626] flex items-center justify-between px-3 sm:px-4 shrink-0 select-none bg-white dark:bg-[#0a0a0a]">
        <div className="flex items-center gap-2.5 min-w-0">
          {!isSidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-md text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              title="Open sidebar"
            >
              <PanelLeft size={16} />
            </button>
          )}

          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-sm tracking-tight">{BOT_NAME}</span>
            {activeChatTitle && (
              <>
                <span className="text-neutral-400 dark:text-neutral-600 text-xs">/</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[160px] sm:max-w-xs font-normal">
                  {activeChatTitle}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* New Chat quick button */}
          <button
            onClick={onNewChat}
            className="p-1.5 rounded-md text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer"
            title="New Chat"
          >
            <Plus size={16} />
          </button>

          {/* Light/Dark mode header toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-md text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Settings modal trigger */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-md text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Main Scrollable Messages Container */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4">
        {messages.length === 0 ? (
          /* Empty State: Centered Greeting & 4 Suggestion Cards */
          <div className="flex flex-col items-center justify-center min-h-[65vh] sm:min-h-[70vh] max-w-2xl mx-auto px-4 text-center my-auto animate-in fade-in duration-200">
            {/* Centered Circular Avatar */}
            <div className="w-12 h-12 rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-mono text-xl font-bold mb-4 shadow-xs select-none">
              {BOT_NAME.charAt(0)}
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black dark:text-white mb-2">
              What can I help with today?
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mb-8 max-w-md">
              Choose a prompt below or start typing in the bottom input bar.
            </p>

            {/* 4 Suggestion Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full max-w-xl text-left">
              {SUGGESTION_CARDS.map((card: SuggestionItem, index: number) => (
                <button
                  key={index}
                  onClick={() => onSendMessage(card.prompt)}
                  disabled={isGenerating}
                  className="p-3.5 rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] hover:bg-neutral-50 dark:hover:bg-[#141414] hover:border-black dark:hover:border-white transition-all text-xs flex flex-col gap-1 group shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2 font-medium text-black dark:text-white">
                    <Sparkles size={13} className="shrink-0 text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                    <span>{card.title}</span>
                  </div>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                    {card.subtitle}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message List */
          <div className="max-w-3xl mx-auto w-full space-y-2">
            {messages.map((message, idx) => (
              <MessageBubble
                key={message.id}
                message={message}
                onRetry={onRetryMessage}
                onRegenerate={onRegenerateMessage}
                isLast={idx === lastAssistantIndex}
                isGenerating={isGenerating}
              />
            ))}

            {/* Loading Skeleton Indicator (Waiting for first stream token) */}
            {isLoading && (
              <div className="flex items-start gap-3 sm:gap-4 py-3 px-3 sm:px-4 animate-in fade-in duration-200">
                <div className="shrink-0 w-7 h-7 rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-mono text-xs font-semibold select-none shadow-xs mt-0.5">
                  {BOT_NAME.charAt(0)}
                </div>
                <div className="flex-1 space-y-2 pt-1 max-w-md">
                  <div className="h-3 bg-neutral-200 dark:bg-[#1f1f1f] rounded-full w-5/6 animate-pulse" />
                  <div className="h-3 bg-neutral-200 dark:bg-[#1f1f1f] rounded-full w-3/5 animate-pulse [animation-delay:0.15s]" />
                  <div className="h-3 bg-neutral-200 dark:bg-[#1f1f1f] rounded-full w-2/5 animate-pulse [animation-delay:0.3s]" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Bottom Input Bar */}
      <ChatInput
        onSendMessage={onSendMessage}
        disabled={isLoading || isGenerating}
        isGenerating={isGenerating}
        onStopGenerating={onStopGenerating}
      />
    </main>
  );
};

export default ChatWindow;
