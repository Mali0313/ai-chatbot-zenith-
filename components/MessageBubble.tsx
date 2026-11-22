"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Check,
  Copy,
  AlertCircle,
  RotateCcw,
  Download,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { BOT_NAME } from "@/lib/constants";
import { ChatMessage, ChatAttachment } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import CodeBlock from "./CodeBlock";

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: () => void;
  onRegenerate?: () => void;
  onRegenerateImage?: (prompt: string) => void;
  isLast?: boolean;
  isGenerating?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onRetry,
  onRegenerate,
  onRegenerateImage,
  isLast = false,
  isGenerating = false,
}) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!message.imageUrl) return;
    const a = document.createElement("a");
    a.href = message.imageUrl;
    a.download = `zenith-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // User Message: right-aligned, white bubble with black text on dark mode
  if (isUser) {
    const hasAttachments = message.attachments && message.attachments.length > 0;

    return (
      <div className="flex w-full justify-end py-2 px-3 sm:px-4">
        <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tr-xs px-4 py-2.5 text-sm sm:text-base leading-relaxed bg-black text-white dark:bg-white dark:text-black shadow-xs font-normal whitespace-pre-wrap break-words flex flex-col gap-2">
          {message.isImage && (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono opacity-80 block">
              <ImageIcon size={12} />
              <span>Image request</span>
            </span>
          )}

          {/* User Attached Files Rendering */}
          {hasAttachments && (
            <div className="flex flex-col gap-2">
              {/* Image Attachments */}
              {message.attachments!.some((a) => a.type === "image") && (
                <div className="grid grid-cols-2 gap-2">
                  {message.attachments!
                    .filter((a) => a.type === "image")
                    .map((img: ChatAttachment) => (
                      <div
                        key={img.id}
                        className="relative rounded-xl overflow-hidden border border-white/20 dark:border-black/20 bg-neutral-900 dark:bg-neutral-100 aspect-video group/att cursor-pointer"
                        onClick={() => {
                          const link = img.url || img.dataUrl;
                          if (link) window.open(link, "_blank");
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url || img.dataUrl}
                          alt={img.name}
                          className="w-full h-full object-cover group-hover/att:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                </div>
              )}

              {/* Video Attachments */}
              {message.attachments!.some((a) => a.type === "video") && (
                <div className="flex flex-col gap-2">
                  {message.attachments!
                    .filter((a) => a.type === "video")
                    .map((vid: ChatAttachment) => (
                      <div
                        key={vid.id}
                        className="rounded-xl overflow-hidden border border-white/20 dark:border-black/20 bg-neutral-950 dark:bg-neutral-50 p-1"
                      >
                        <video
                          src={vid.url || vid.dataUrl}
                          controls
                          className="w-full max-h-56 rounded-lg object-contain bg-black"
                        />
                        <div className="px-2 py-1 text-[11px] opacity-80 flex items-center justify-between font-mono">
                          <span className="truncate max-w-[200px]">{vid.name}</span>
                          <span>{formatBytes(vid.size)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Document Attachments */}
              {message.attachments!.some((a) => a.type === "document") && (
                <div className="flex flex-col gap-1.5">
                  {message.attachments!
                    .filter((a) => a.type === "document")
                    .map((doc: ChatAttachment) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-white/20 dark:border-black/20 bg-white/10 dark:bg-black/10"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText size={16} className="shrink-0 opacity-80" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{doc.name}</p>
                            <span className="text-[10px] opacity-70 font-mono">
                              {formatBytes(doc.size)}
                            </span>
                          </div>
                        </div>
                        <a
                          href={doc.url || doc.dataUrl}
                          download={doc.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded hover:bg-white/20 dark:hover:bg-black/20 transition-colors shrink-0"
                          title={`Download ${doc.name}`}
                        >
                          <Download size={13} />
                        </a>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* User Message Text */}
          {message.content && <div>{message.content}</div>}
        </div>
      </div>
    );
  }

  // Error State for Assistant Message with Retry Button
  if (message.error) {
    return (
      <div className="flex w-full justify-start items-start gap-3 sm:gap-4 py-3 px-3 sm:px-4">
        <div className="shrink-0 w-7 h-7 rounded-full border border-red-500/40 bg-red-500/10 text-red-500 flex items-center justify-center font-mono text-xs font-semibold select-none">
          <AlertCircle size={15} />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2.5 text-sm sm:text-base leading-relaxed">
          <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/5 text-neutral-800 dark:text-neutral-200 text-xs sm:text-sm whitespace-pre-wrap break-words">
            <span className="font-semibold block mb-1 text-red-600 dark:text-red-400">
              {message.isImage ? "Image generation failed:" : "Request encountered an error:"}
            </span>
            {message.content}
          </div>

          {onRetry && isLast && (
            <div>
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] transition-all shadow-xs cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Retry {message.isImage ? "image" : "message"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // AI Message with Generated Image
  if (message.isImage && message.imageUrl) {
    return (
      <div className="group flex w-full justify-start items-start gap-3 sm:gap-4 py-3 px-3 sm:px-4">
        {/* Small circular avatar icon */}
        <div className="shrink-0 w-7 h-7 rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-mono text-xs font-semibold select-none shadow-xs mt-0.5">
          {BOT_NAME.charAt(0)}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2.5">
          {/* Prompt caption */}
          {message.content && (
            <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 font-medium leading-relaxed">
              {message.content}
            </div>
          )}

          {/* Generated Image with rounded corners & grey border */}
          <div className="relative group/img max-w-lg w-full rounded-2xl overflow-hidden border border-[#e5e5e5] dark:border-[#262626] bg-neutral-100 dark:bg-[#141414] shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.imageUrl}
              alt={message.content || "Generated image"}
              className="w-full h-auto object-cover rounded-2xl"
              loading="lazy"
            />
          </div>

          {/* Action Toolbar: Download, Regenerate, Copy Prompt */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-xs text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] transition-all shadow-xs cursor-pointer font-medium"
              title="Download full image"
            >
              <Download size={13} />
              <span>Download</span>
            </button>

            {onRegenerateImage && !isGenerating && (
              <button
                type="button"
                onClick={() => onRegenerateImage(message.content)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-xs text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] transition-all shadow-xs cursor-pointer font-medium"
                title="Regenerate this image"
              >
                <RotateCcw size={13} />
                <span>Regenerate</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              title="Copy prompt"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // AI Message: rendered with react-markdown & remark-gfm
  return (
    <div className="group flex w-full justify-start items-start gap-3 sm:gap-4 py-3 px-3 sm:px-4">
      {/* Small circular avatar icon */}
      <div className="shrink-0 w-7 h-7 rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-mono text-xs font-semibold select-none shadow-xs mt-0.5">
        {BOT_NAME.charAt(0)}
      </div>

      {/* Message Body: No bubble, plain text with markdown formatting */}
      <div className="flex-1 min-w-0 flex flex-col text-sm sm:text-base leading-relaxed text-black dark:text-white">
        <div className="markdown-body max-w-none break-words">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({
                className,
                children,
                ...props
              }: React.ComponentPropsWithoutRef<"code">) {
                const match = /language-(\w+)/.exec(className || "");
                const codeString = String(children).replace(/\n$/, "");
                const isMultiLine = codeString.includes("\n");

                if (!match && !isMultiLine) {
                  return (
                    <code
                      className="px-1.5 py-0.5 rounded text-xs font-mono bg-neutral-100 dark:bg-[#181818] border border-[#e5e5e5] dark:border-[#262626] text-black dark:text-white font-medium"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }

                return (
                  <CodeBlock
                    language={match ? match[1] : "text"}
                    value={codeString}
                  />
                );
              },
              h1({ children }) {
                return (
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-black dark:text-white mt-4 mb-2 first:mt-0">
                    {children}
                  </h1>
                );
              },
              h2({ children }) {
                return (
                  <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-black dark:text-white mt-3.5 mb-2 first:mt-0">
                    {children}
                  </h2>
                );
              },
              h3({ children }) {
                return (
                  <h3 className="text-base sm:text-lg font-semibold tracking-tight text-black dark:text-white mt-3 mb-1.5 first:mt-0">
                    {children}
                  </h3>
                );
              },
              h4({ children }) {
                return (
                  <h4 className="text-sm sm:text-base font-semibold text-black dark:text-white mt-2 mb-1 first:mt-0">
                    {children}
                  </h4>
                );
              },
              p({ children }) {
                return <p className="mb-3 leading-relaxed last:mb-0">{children}</p>;
              },
              ul({ children }) {
                return (
                  <ul className="list-disc pl-5 mb-3 space-y-1.5 marker:text-neutral-400 dark:marker:text-neutral-500">
                    {children}
                  </ul>
                );
              },
              ol({ children }) {
                return (
                  <ol className="list-decimal pl-5 mb-3 space-y-1.5 marker:text-neutral-400 dark:marker:text-neutral-500">
                    {children}
                  </ol>
                );
              },
              li({ children }) {
                return <li className="leading-relaxed">{children}</li>;
              },
              blockquote({ children }) {
                return (
                  <blockquote className="border-l-2 border-[#262626] dark:border-[#e5e5e5] pl-4 py-0.5 my-3 italic text-neutral-600 dark:text-neutral-400">
                    {children}
                  </blockquote>
                );
              },
              table({ children }) {
                return (
                  <div className="overflow-x-auto my-3 border border-[#e5e5e5] dark:border-[#262626] rounded-xl shadow-xs">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                      {children}
                    </table>
                  </div>
                );
              },
              thead({ children }) {
                return (
                  <thead className="bg-neutral-50 dark:bg-[#121212] border-b border-[#e5e5e5] dark:border-[#262626]">
                    {children}
                  </thead>
                );
              },
              tbody({ children }) {
                return (
                  <tbody className="divide-y divide-[#e5e5e5] dark:divide-[#262626]">
                    {children}
                  </tbody>
                );
              },
              tr({ children }) {
                return (
                  <tr className="hover:bg-neutral-50/60 dark:hover:bg-[#141414]/60 transition-colors">
                    {children}
                  </tr>
                );
              },
              th({ children }) {
                return (
                  <th className="px-3.5 py-2.5 text-xs font-semibold text-black dark:text-white uppercase tracking-wider">
                    {children}
                  </th>
                );
              },
              td({ children }) {
                return (
                  <td className="px-3.5 py-2 text-neutral-800 dark:text-neutral-200">
                    {children}
                  </td>
                );
              },
              a({ href, children }) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 decoration-neutral-400 dark:decoration-neutral-600 hover:decoration-black dark:hover:decoration-white font-medium transition-colors"
                  >
                    {children}
                  </a>
                );
              },
              strong({ children }) {
                return (
                  <strong className="font-semibold text-black dark:text-white">
                    {children}
                  </strong>
                );
              },
              em({ children }) {
                return <em className="italic">{children}</em>;
              },
              hr() {
                return <hr className="border-[#e5e5e5] dark:border-[#262626] my-4" />;
              },
            }}
          >
            {message.content}
          </ReactMarkdown>

          {/* Typing effect streaming cursor */}
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-1 bg-black dark:bg-white animate-pulse align-middle" />
          )}
        </div>

        {/* Action Toolbar on AI message (Copy and Regenerate) */}
        {!message.isStreaming && message.content && (
          <div className="flex items-center gap-2 mt-2 pt-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              title="Copy response to clipboard"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span className="text-[11px] font-mono">{copied ? "Copied" : "Copy"}</span>
            </button>

            {isLast && onRegenerate && !isGenerating && (
              <button
                type="button"
                onClick={onRegenerate}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                title="Regenerate response"
              >
                <RotateCcw size={13} />
                <span className="text-[11px] font-mono">Regenerate</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
