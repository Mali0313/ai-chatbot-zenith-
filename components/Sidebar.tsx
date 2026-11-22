"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Plus,
  Moon,
  Sun,
  PanelLeftClose,
  Trash2,
  Pencil,
  Check,
  X,
  Settings,
  LogOut,
  LogIn,
} from "lucide-react";
import NovaLogo from "./NovaLogo";
import { ChatSession } from "@/lib/types";
import { cn, groupSessionsByDate } from "@/lib/utils";
import { useIsMounted } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-context";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onRenameSession,
  onDeleteSession,
  isDarkMode,
  onToggleTheme,
  onOpenSettings,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const isMounted = useIsMounted();
  const { user, signOut } = useAuth();

  // Compute grouped sessions only on client after hydration to avoid SSR mismatch
  const grouped = useMemo(() => {
    if (!isMounted) {
      return { today: [], yesterday: [], older: [] };
    }
    return groupSessionsByDate(sessions);
  }, [sessions, isMounted]);

  const startRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (id: string, e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.stopPropagation();
    const finalTitle = editTitle.trim();
    if (finalTitle) {
      onRenameSession(id, finalTitle);
    }
    setEditingId(null);
    setEditTitle("");
  };

  const handleCancelRename = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(null);
    setEditTitle("");
  };

  const handleKeyDown = (id: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveRename(id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelRename();
    }
  };

  const renderSessionItem = (session: ChatSession) => {
    const isActive = session.id === activeSessionId;
    const isEditing = editingId === session.id;

    if (isEditing) {
      return (
        <div
          key={session.id}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-neutral-50 dark:bg-[#141414]"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => handleKeyDown(session.id, e)}
            autoFocus
            className="w-full bg-transparent text-xs text-black dark:text-white outline-none font-medium px-1"
          />
          <button
            type="button"
            onClick={(e) => handleSaveRename(session.id, e)}
            className="p-1 rounded text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-[#262626] transition-colors cursor-pointer"
            title="Save title (Enter)"
          >
            <Check size={13} />
          </button>
          <button
            type="button"
            onClick={handleCancelRename}
            className="p-1 rounded text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-[#262626] transition-colors cursor-pointer"
            title="Cancel (Esc)"
          >
            <X size={13} />
          </button>
        </div>
      );
    }

    return (
      <div
        key={session.id}
        onClick={() => onSelectSession(session.id)}
        className={cn(
          "group relative flex items-center justify-between w-full px-2.5 py-2 text-xs rounded-lg cursor-pointer transition-colors",
          isActive
            ? "bg-neutral-100 dark:bg-[#171717] text-black dark:text-white font-medium border border-[#e5e5e5] dark:border-[#262626]"
            : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-[#121212] hover:text-black dark:hover:text-white"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1.5">
          <MessageSquare size={13} className="shrink-0 opacity-70" />
          <span className="truncate">{session.title}</span>
        </div>

        {/* Action icons (Rename & Delete) */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => startRename(session, e)}
            className="p-1 rounded text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-[#262626] transition-colors cursor-pointer"
            title="Rename chat"
          >
            <Pencil size={11} />
          </button>
          <button
            type="button"
            onClick={(e) => onDeleteSession(session.id, e)}
            className="p-1 rounded text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-[#262626] transition-colors cursor-pointer"
            title="Delete chat"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar */}
      <aside
        suppressHydrationWarning
        className={cn(
          "fixed md:static inset-y-0 left-0 z-40 flex flex-col h-full w-64 md:w-64 transition-all duration-200 ease-in-out select-none",
          "bg-white dark:bg-[#0a0a0a]",
          "border-r border-[#e5e5e5] dark:border-[#262626]",
          isOpen
            ? "translate-x-0"
            : "-translate-x-full md:-translate-x-full md:w-0 md:opacity-0 md:border-r-0"
        )}
      >
        {/* Sidebar Header & New Chat */}
        <div className="p-3 flex flex-col gap-2.5 border-b border-[#e5e5e5] dark:border-[#262626]">
          <div className="flex items-center justify-between px-1">
            <NovaLogo variant="full" size={20} />
            <button
              onClick={onToggle}
              className="p-1.5 rounded-md text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              title="Close sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-transparent hover:bg-neutral-100 dark:hover:bg-[#171717] text-black dark:text-white transition-all shadow-xs cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Plus size={15} />
              New chat
            </span>
            <kbd className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">⌘N</kbd>
          </button>
        </div>

        {/* Grouped Past Chats List: Today / Yesterday / Older */}
        {!isMounted ? (
          /* Initial matching SSR skeleton to guarantee zero hydration discrepancy */
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 select-none">
              Past Chats
            </div>
            <div className="space-y-1.5 px-1">
              <div className="h-8 bg-neutral-100 dark:bg-[#141414] rounded-lg animate-pulse" />
              <div className="h-8 bg-neutral-100 dark:bg-[#141414] rounded-lg animate-pulse [animation-delay:0.1s]" />
              <div className="h-8 bg-neutral-100 dark:bg-[#141414] rounded-lg animate-pulse [animation-delay:0.2s]" />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {sessions.length === 0 ? (
              <div className="px-3 py-6 text-xs text-neutral-400 text-center italic">
                No conversations yet. Start a new chat!
              </div>
            ) : (
              <>
                {/* Today Group */}
                {grouped.today.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 select-none">
                      Today
                    </div>
                    {grouped.today.map(renderSessionItem)}
                  </div>
                )}

                {/* Yesterday Group */}
                {grouped.yesterday.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 select-none">
                      Yesterday
                    </div>
                    {grouped.yesterday.map(renderSessionItem)}
                  </div>
                )}

                {/* Older Group */}
                {grouped.older.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 select-none">
                      Older
                    </div>
                    {grouped.older.map(renderSessionItem)}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Sidebar Footer with Theme, Settings & User Profile */}
        <div className="p-3 border-t border-[#e5e5e5] dark:border-[#262626] flex flex-col gap-1.5 text-xs">
          {/* Light/Dark Mode Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#171717] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
              <span>{isDarkMode ? "Light mode" : "Dark mode"}</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider font-mono text-neutral-400">
              {isDarkMode ? "Light" : "Dark"}
            </span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#171717] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Settings size={14} />
              <span>Settings</span>
            </span>
          </button>

          {/* User Profile / Auth Area */}
          <div className="pt-2 border-t border-[#e5e5e5] dark:border-[#262626]">
            {user ? (
              <div className="flex items-center justify-between px-1.5 py-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full border border-[#e5e5e5] dark:border-[#262626] flex items-center justify-center text-[10px] font-mono bg-neutral-100 dark:bg-[#1a1a1a] text-black dark:text-white font-semibold shrink-0">
                    {(user.user_metadata?.full_name || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <span className="text-xs text-neutral-800 dark:text-neutral-200 font-medium truncate max-w-[125px]">
                      {user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
                    </span>
                    <span className="text-[10px] text-neutral-400 truncate max-w-[125px]">
                      {user.email}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="p-1.5 rounded-md text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-[#1f1f1f] transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-1.5 py-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full border border-[#e5e5e5] dark:border-[#262626] flex items-center justify-center text-[10px] font-mono bg-neutral-100 dark:bg-[#1a1a1a] text-black dark:text-white font-semibold">
                    G
                  </div>
                  <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">Guest Mode</span>
                </div>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
                >
                  <LogIn size={11} />
                  <span>Sign in</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
