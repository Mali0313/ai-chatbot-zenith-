"use client";

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import SettingsModal from "@/components/SettingsModal";
import { INITIAL_DUMMY_SESSIONS } from "@/lib/constants";
import { ChatMessage, ChatSession } from "@/lib/types";
import { generateId, generateTitleFromMessage } from "@/lib/utils";

const STORAGE_KEY = "zenith_saved_sessions";
const ACTIVE_SESSION_KEY = "zenith_active_session_id";

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Consistent initial state for both server and client initial render
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [sessions, setSessions] = useState<ChatSession[]>(INITIAL_DUMMY_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string | null>("session-1");

  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadedRef = useRef(false);

  // Synchronize with localStorage on client mount (deferred via microtask to avoid hydration and effect warnings)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: ChatSession[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          queueMicrotask(() => {
            setSessions(parsed);
          });
        }
      }

      const savedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (savedActiveId) {
        queueMicrotask(() => {
          setActiveSessionId(savedActiveId);
        });
      }

      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        queueMicrotask(() => {
          setIsDarkMode(savedTheme !== "light");
        });
      }
    } catch (e) {
      console.warn("Failed to load initial data from localStorage:", e);
    } finally {
      isLoadedRef.current = true;
    }
  }, []);

  // Sync document class with theme
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Persist sessions to localStorage once loaded
  useEffect(() => {
    if (!isLoadedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (err) {
      console.error("Failed to save sessions to localStorage:", err);
    }
  }, [sessions]);

  // Persist activeSessionId to localStorage once loaded
  useEffect(() => {
    if (!isLoadedRef.current) return;
    try {
      if (activeSessionId) {
        localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
      } else {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
      }
    } catch (err) {
      console.error("Failed to save activeSessionId to localStorage:", err);
    }
  }, [activeSessionId]);

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  };

  // Find active session
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const currentMessages = activeSession ? activeSession.messages : [];

  // Start a new empty chat
  const handleNewChat = () => {
    if (isGenerating) {
      handleStopGenerating();
    }
    setActiveSessionId(null);
  };

  // Select an existing past chat session (loads it)
  const handleSelectSession = (id: string) => {
    if (isGenerating) {
      handleStopGenerating();
    }
    setActiveSessionId(id);
  };

  // Rename session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, title: newTitle, updatedAt: new Date().toISOString() }
          : s
      )
    );
  };

  // Delete session
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGenerating && activeSessionId === id) {
      handleStopGenerating();
    }

    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (activeSessionId === id) {
        setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
  };

  // Clear all chat sessions completely
  const handleClearAllChats = () => {
    if (isGenerating) {
      handleStopGenerating();
    }
    setSessions([]);
    setActiveSessionId(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    } catch (e) {
      console.error("Error clearing localStorage:", e);
    }
  };

  // Stop active generation
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsGenerating(false);

    if (activeSessionId) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.isStreaming ? { ...m, isStreaming: false } : m
                ),
              }
            : s
        )
      );
    }
  };

  // Retry sending the last message if an error occurred
  const handleRetryMessage = () => {
    if (!activeSession || currentMessages.length === 0 || isGenerating) return;

    const reversed = [...currentMessages].reverse();
    const lastUserMsg = reversed.find((m) => m.role === "user");

    if (!lastUserMsg) return;

    const cleanedMessages = currentMessages.filter((m) => !m.error);

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId ? { ...s, messages: cleanedMessages } : s
      )
    );

    handleSendMessage(lastUserMsg.content, true);
  };

  // Regenerate the last AI response
  const handleRegenerateMessage = () => {
    if (!activeSession || currentMessages.length === 0 || isGenerating) return;

    const lastAssistantIdx = currentMessages.map((m) => m.role).lastIndexOf("assistant");
    if (lastAssistantIdx === -1) return;

    const messagesBefore = currentMessages.slice(0, lastAssistantIdx);
    const lastUserMsg = [...messagesBefore].reverse().find((m) => m.role === "user");

    if (!lastUserMsg) return;

    const updatedMessages = currentMessages.filter((_, idx) => idx !== lastAssistantIdx);

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId ? { ...s, messages: updatedMessages } : s
      )
    );

    handleSendMessage(lastUserMsg.content, true);
  };

  // Send a message and stream live from /api/chat with full conversation history
  const handleSendMessage = async (content: string, isRetry: boolean = false) => {
    if (isGenerating) return;

    let targetSessionId = activeSessionId;
    let historyForApi: { role: string; content: string }[] = [];

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const nowIso = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content,
      createdAt: nowIso,
    };

    if (!targetSessionId) {
      const generatedTitle = generateTitleFromMessage(content);
      targetSessionId = "session-" + Date.now();

      const newSession: ChatSession = {
        id: targetSessionId,
        title: generatedTitle,
        createdAt: nowIso,
        updatedAt: nowIso,
        messages: [userMessage],
      };

      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(targetSessionId);
      historyForApi = [{ role: "user", content }];
    } else {
      const existing = sessions.find((s) => s.id === targetSessionId);
      const existingValidMessages = (existing?.messages || []).filter((m) => !m.error);

      if (isRetry) {
        historyForApi = existingValidMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));
      } else {
        historyForApi = [
          ...existingValidMessages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content },
        ];

        setSessions((prev) =>
          prev.map((s) =>
            s.id === targetSessionId
              ? {
                  ...s,
                  messages: [...s.messages, userMessage],
                  updatedAt: nowIso,
                }
              : s
          )
        );
      }
    }

    // Create assistant placeholder for streaming
    const assistantMessageId = generateId();
    const assistantPlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      createdAt: nowIso,
      isStreaming: true,
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === targetSessionId
          ? { ...s, messages: [...s.messages, assistantPlaceholder], updatedAt: nowIso }
          : s
      )
    );

    setIsLoading(true);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: historyForApi,
        }),
      });

      // Handle non-200 responses
      if (!response.ok) {
        let errorMsg = "An error occurred while connecting to the AI provider.";
        try {
          const errorJson = await response.json();
          if (errorJson.error) {
            errorMsg = errorJson.error;
          }
        } catch {
          errorMsg = `Server error (${response.status}: ${response.statusText})`;
        }

        setSessions((prev) =>
          prev.map((s) =>
            s.id === targetSessionId
              ? {
                  ...s,
                  updatedAt: new Date().toISOString(),
                  messages: s.messages.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          content: errorMsg,
                          error: true,
                          isStreaming: false,
                        }
                      : m
                  ),
                }
              : s
          )
        );
        setIsLoading(false);
        setIsGenerating(false);
        return;
      }

      if (!response.body) {
        throw new Error("No response body received from server stream.");
      }

      // Stream the response tokens in real-time
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulated = "";
      let firstChunkReceived = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (!firstChunkReceived) {
          firstChunkReceived = true;
          setIsLoading(false);
        }

        const textChunk = decoder.decode(value, { stream: true });
        accumulated += textChunk;

        setSessions((prev) =>
          prev.map((s) =>
            s.id === targetSessionId
              ? {
                  ...s,
                  updatedAt: new Date().toISOString(),
                  messages: s.messages.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: accumulated, isStreaming: true }
                      : m
                  ),
                }
              : s
          )
        );
      }

      // Finalize completed streaming message
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                updatedAt: new Date().toISOString(),
                messages: s.messages.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, isStreaming: false }
                    : m
                ),
              }
            : s
        )
      );
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";

      if (isAbort) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === targetSessionId
              ? {
                  ...s,
                  updatedAt: new Date().toISOString(),
                  messages: s.messages.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          content: m.content || "[Generation stopped by user]",
                          isStreaming: false,
                        }
                      : m
                  ),
                }
              : s
          )
        );
      } else {
        console.error("Chat streaming error occurred.");
        const friendlyError =
          "Network error: Unable to connect to /api/chat. Please ensure the server is running and check your connection.";

        setSessions((prev) =>
          prev.map((s) =>
            s.id === targetSessionId
              ? {
                  ...s,
                  updatedAt: new Date().toISOString(),
                  messages: s.messages.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          content: friendlyError,
                          error: true,
                          isStreaming: false,
                        }
                      : m
                  ),
                }
              : s
          )
        );
      }
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#0a0a0a]">
      {/* Left Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Chat Area */}
      <ChatWindow
        messages={currentMessages}
        onSendMessage={handleSendMessage}
        onRetryMessage={handleRetryMessage}
        onRegenerateMessage={handleRegenerateMessage}
        onStopGenerating={handleStopGenerating}
        onToggleSidebar={() => setIsSidebarOpen(true)}
        isSidebarOpen={isSidebarOpen}
        onNewChat={handleNewChat}
        isLoading={isLoading}
        isGenerating={isGenerating}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeChatTitle={activeSession?.title}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onClearAllChats={handleClearAllChats}
      />
    </div>
  );
}
