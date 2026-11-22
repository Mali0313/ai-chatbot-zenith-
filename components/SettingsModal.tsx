"use client";

import React, { useState, useEffect } from "react";
import { X, Moon, Sun, Trash2, Cpu, ShieldCheck } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onClearAllChats: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onToggleTheme,
  onClearAllChats,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClear = () => {
    onClearAllChats();
    setConfirmDelete(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Click outside backdrop */}
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="w-full max-w-md rounded-2xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-black dark:text-white shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e5e5e5] dark:border-[#262626]">
          <h2 className="text-sm font-semibold tracking-tight">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 space-y-5 text-xs">
          {/* Theme Setting */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-medium text-black dark:text-white text-xs block">
                Theme Appearance
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Choose between dark and light monochrome mode
              </span>
            </div>
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#e5e5e5] dark:border-[#262626] hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer"
            >
              {isDarkMode ? <Moon size={13} /> : <Sun size={13} />}
              <span className="capitalize font-mono text-[11px]">
                {isDarkMode ? "Dark" : "Light"}
              </span>
            </button>
          </div>

          <hr className="border-[#e5e5e5] dark:border-[#262626]" />

          {/* Data Controls / Clear All Chats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-medium text-black dark:text-white text-xs block">
                  Conversations & Storage
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Delete all chat sessions and clear browser storage
                </span>
              </div>
            </div>

            {confirmDelete ? (
              <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/5 space-y-2.5">
                <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                  Are you sure? All saved conversations will be permanently deleted.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClear}
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors cursor-pointer text-xs"
                  >
                    Yes, delete all
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 rounded-lg border border-[#e5e5e5] dark:border-[#262626] hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer text-xs font-medium"
              >
                <Trash2 size={13} />
                <span>Clear all conversations</span>
              </button>
            )}
          </div>

          <hr className="border-[#e5e5e5] dark:border-[#262626]" />

          {/* Model & System Info (Read-only) */}
          <div className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-3 space-y-2 bg-neutral-50/50 dark:bg-[#121212]/50">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Cpu size={12} />
                <span>Model Engine</span>
              </span>
              <span className="font-mono text-black dark:text-white font-medium">
                Gemini 3.5 Flash
              </span>
            </div>
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={12} />
                <span>Security & Rate Limit</span>
              </span>
              <span className="font-mono text-black dark:text-white font-medium">
                20 req/min • 2,048 tokens max
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#e5e5e5] dark:border-[#262626] bg-neutral-50 dark:bg-[#111111] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black font-medium hover:opacity-90 transition-opacity text-xs cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
