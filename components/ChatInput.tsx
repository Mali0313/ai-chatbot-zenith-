"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowUp,
  Square,
  Plus,
  Image as ImageIcon,
  Film,
  FileText,
  X,
  AlertCircle,
} from "lucide-react";
import { BOT_NAME } from "@/lib/constants";
import { ChatAttachment, AttachmentType } from "@/lib/types";
import { cn, formatBytes, generateId } from "@/lib/utils";

// Limits
const MAX_FILES_PER_MESSAGE = 5;
const SIZE_LIMITS_BYTES: Record<AttachmentType, number> = {
  image: 10 * 1024 * 1024, // 10MB
  video: 50 * 1024 * 1024, // 50MB
  document: 20 * 1024 * 1024, // 20MB
};
const SIZE_LIMITS_MB: Record<AttachmentType, number> = {
  image: 10,
  video: 50,
  document: 20,
};

// Allowed Extensions
const ALLOWED_EXTENSIONS: Record<AttachmentType, string[]> = {
  image: ["jpg", "jpeg", "png", "webp", "gif"],
  video: ["mp4", "mov", "webm"],
  document: ["pdf", "doc", "docx", "txt", "xlsx", "pptx", "csv"],
};

// Accept attributes for inputs
const ACCEPT_ATTRIBUTES: Record<AttachmentType, string> = {
  image: "image/jpeg,image/png,image/webp,image/gif",
  video: "video/mp4,video/quicktime,video/webm",
  document:
    ".pdf,.doc,.docx,.txt,.xlsx,.pptx,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain",
};

interface ChatInputProps {
  onSendMessage: (content: string, attachments?: ChatAttachment[]) => void;
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
  placeholder,
}) => {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hidden file inputs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Show auto-dismissing toast
  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

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

  // Click outside and Escape listeners for the popup menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  // Handle file selection from inputs
  const handleFilesSelected = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: AttachmentType
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);

    // 1. Total files limit check
    if (attachments.length + fileList.length > MAX_FILES_PER_MESSAGE) {
      showToast(`Sirf maximum ${MAX_FILES_PER_MESSAGE} files ek message me add kar sakte hain.`);
      e.target.value = "";
      return;
    }

    const allowedExts = ALLOWED_EXTENSIONS[type];
    const sizeLimitBytes = SIZE_LIMITS_BYTES[type];
    const sizeLimitMb = SIZE_LIMITS_MB[type];

    for (const file of fileList) {
      // 2. Format validation
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const isAllowed = allowedExts.includes(ext);

      if (!isAllowed) {
        showToast(`Unsupported format: "${file.name}". Sirf ${allowedExts.join(", ")} allow hain.`);
        e.target.value = "";
        return;
      }

      // 3. Size limit check
      if (file.size > sizeLimitBytes) {
        showToast(`File bohat badi hai: "${file.name}" (Max limit ${sizeLimitMb}MB)`);
        e.target.value = "";
        return;
      }
    }

    // Process valid files into base64 Data URLs
    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const dataUrl = loadEvt.target?.result as string;
        if (!dataUrl) return;

        const newAttachment: ChatAttachment = {
          id: generateId(),
          name: file.name,
          size: file.size,
          type,
          mimeType: file.type || "application/octet-stream",
          dataUrl,
        };

        setAttachments((prev) => {
          if (prev.length >= MAX_FILES_PER_MESSAGE) return prev;
          return [...prev, newAttachment];
        });
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
    setIsMenuOpen(false);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const hasText = input.trim().length > 0;
    const hasAttachments = attachments.length > 0;

    if ((!hasText && !hasAttachments) || disabled || isGenerating) return;

    onSendMessage(input.trim(), attachments);
    setInput("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const dynamicPlaceholder =
    placeholder ||
    (attachments.length > 0
      ? "Add a message about your file(s)..."
      : `Message ${BOT_NAME}...`);

  const canSubmit =
    (input.trim().length > 0 || attachments.length > 0) &&
    !disabled &&
    !isGenerating;

  return (
    <div className="relative w-full max-w-3xl mx-auto px-3 sm:px-4 pb-3 sm:pb-4 pt-1">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black shadow-lg border border-neutral-800 dark:border-neutral-200 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-150 select-none max-w-[90vw] sm:max-w-md">
          <AlertCircle size={15} className="text-red-400 dark:text-red-600 shrink-0" />
          <span className="truncate flex-1">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            <X size={12} />
          </button>
        </div>
      )}

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

      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTRIBUTES.image}
        className="hidden"
        onChange={(e) => handleFilesSelected(e, "image")}
      />
      <input
        ref={videoInputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTRIBUTES.video}
        className="hidden"
        onChange={(e) => handleFilesSelected(e, "video")}
      />
      <input
        ref={docInputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTRIBUTES.document}
        className="hidden"
        onChange={(e) => handleFilesSelected(e, "document")}
      />

      {/* Input Form Box */}
      <form
        onSubmit={handleSubmit}
        className={cn(
          "relative flex flex-col rounded-2xl border transition-all shadow-xs",
          "border-[#e5e5e5] dark:border-[#262626]",
          "bg-white dark:bg-[#0a0a0a]",
          isGenerating
            ? "opacity-80 cursor-not-allowed"
            : "focus-within:border-black dark:focus-within:border-white focus-within:ring-1 focus-within:ring-black dark:focus-within:ring-white"
        )}
      >
        {/* Attachment Previews Tray (Above textarea inside form) */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-2.5 px-3 pt-2.5 pb-1 overflow-x-auto scrollbar-thin">
            {attachments.map((file) => (
              <div key={file.id} className="relative shrink-0 group">
                {file.type === "image" ? (
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#e5e5e5] dark:border-[#262626] bg-neutral-100 dark:bg-[#141414] shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={file.dataUrl}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : file.type === "video" ? (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 h-14 rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-neutral-50 dark:bg-[#141414] shadow-xs max-w-[180px]">
                    <div className="w-8 h-8 rounded-md bg-neutral-200 dark:bg-[#222] flex items-center justify-center shrink-0">
                      <Film size={16} className="text-neutral-600 dark:text-neutral-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate text-black dark:text-white">
                        {file.name}
                      </p>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {formatBytes(file.size)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 h-14 rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-neutral-50 dark:bg-[#141414] shadow-xs max-w-[180px]">
                    <div className="w-8 h-8 rounded-md bg-neutral-200 dark:bg-[#222] flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-neutral-600 dark:text-neutral-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate text-black dark:text-white">
                        {file.name}
                      </p>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {formatBytes(file.size)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Remove Preview Button */}
                <button
                  type="button"
                  onClick={() => removeAttachment(file.id)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer shadow-xs"
                  title="Remove file"
                >
                  <X size={10} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Controls Row */}
        <div className="flex items-end gap-2 px-3 py-2">
          {/* Plus Button Container with Popup Menu */}
          <div ref={menuContainerRef} className="relative shrink-0 mb-0.5">
            {/* Round 36x36px Plus Button */}
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              disabled={isGenerating || disabled}
              className={cn(
                "group w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center transition-all cursor-pointer border select-none",
                "bg-neutral-100 dark:bg-[#1a1a1a]",
                "border-[#e5e5e5] dark:border-[#262626]",
                "text-neutral-600 dark:text-neutral-300",
                "hover:bg-neutral-200 dark:hover:bg-[#262626] hover:text-black dark:hover:text-white",
                isMenuOpen && "bg-neutral-200 dark:bg-[#262626] text-black dark:text-white"
              )}
              title="Add attachment"
              aria-label="Add attachment"
            >
              <Plus
                size={18}
                className={cn(
                  "transition-transform duration-200 ease-in-out group-hover:rotate-45",
                  isMenuOpen && "rotate-45"
                )}
              />
            </button>

            {/* Popup Menu */}
            {isMenuOpen && (
              <div
                className={cn(
                  "absolute bottom-full left-0 mb-2.5 z-50 w-48 rounded-[12px] p-1.5 shadow-lg select-none",
                  "bg-white dark:bg-[#121212]",
                  "border border-[#e5e5e5] dark:border-[#262626]",
                  "animate-in fade-in slide-in-from-bottom-2 duration-150"
                )}
              >
                {/* 1. Image Option */}
                <button
                  type="button"
                  onClick={() => {
                    imageInputRef.current?.click();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1f1f1f] transition-colors cursor-pointer w-full text-left"
                >
                  <ImageIcon size={15} className="shrink-0 text-neutral-500" />
                  <div className="flex flex-col">
                    <span>Image</span>
                    <span className="text-[10px] text-neutral-400 font-normal">
                      JPG, PNG, WEBP, GIF
                    </span>
                  </div>
                </button>

                {/* 2. Video Option */}
                <button
                  type="button"
                  onClick={() => {
                    videoInputRef.current?.click();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1f1f1f] transition-colors cursor-pointer w-full text-left"
                >
                  <Film size={15} className="shrink-0 text-neutral-500" />
                  <div className="flex flex-col">
                    <span>Video</span>
                    <span className="text-[10px] text-neutral-400 font-normal">
                      MP4, MOV, WEBM
                    </span>
                  </div>
                </button>

                {/* 3. Document Option */}
                <button
                  type="button"
                  onClick={() => {
                    docInputRef.current?.click();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1f1f1f] transition-colors cursor-pointer w-full text-left"
                >
                  <FileText size={15} className="shrink-0 text-neutral-500" />
                  <div className="flex flex-col">
                    <span>Document</span>
                    <span className="text-[10px] text-neutral-400 font-normal">
                      PDF, DOC, TXT, CSV...
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Text Area Input */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isGenerating ? `${BOT_NAME} is working...` : dynamicPlaceholder}
            disabled={disabled || isGenerating}
            rows={1}
            className="w-full resize-none bg-transparent py-1.5 px-1 text-sm sm:text-base outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600 text-black dark:text-white max-h-48 overflow-y-auto leading-relaxed disabled:cursor-not-allowed"
          />

          {/* Submit / Stop Button */}
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
              disabled={!canSubmit}
              className={cn(
                "shrink-0 mb-0.5 flex h-8 w-8 items-center justify-center rounded-full transition-all",
                canSubmit
                  ? "bg-black text-white hover:opacity-90 dark:bg-white dark:text-black cursor-pointer shadow-xs"
                  : "bg-neutral-100 text-neutral-400 dark:bg-[#1a1a1a] dark:text-neutral-600 cursor-not-allowed"
              )}
              title="Send message (Enter)"
              aria-label="Submit"
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </form>

      <div className="mt-2 text-center text-[11px] text-neutral-400 dark:text-neutral-500 select-none">
        {BOT_NAME} can make mistakes. Verify important info.
      </div>
    </div>
  );
};

export default ChatInput;
