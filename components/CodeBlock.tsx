"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

interface CodeBlockProps {
  language: string;
  value: string;
}

// Strict monochrome dark theme for Prism syntax highlighting
const monochromeDark: { [key: string]: React.CSSProperties } = {
  'code[class*="language-"]': {
    color: "#f5f5f5",
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: "0.825rem",
    lineHeight: "1.6",
    direction: "ltr",
    textAlign: "left",
    whiteSpace: "pre",
    wordSpacing: "normal",
    wordBreak: "normal",
    tabSize: 2,
    hyphens: "none",
  },
  'pre[class*="language-"]': {
    color: "#f5f5f5",
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: "0.825rem",
    lineHeight: "1.6",
    direction: "ltr",
    textAlign: "left",
    whiteSpace: "pre",
    wordSpacing: "normal",
    wordBreak: "normal",
    tabSize: 2,
    hyphens: "none",
    margin: 0,
    padding: "0.875rem 1rem",
    overflow: "auto",
    background: "#0a0a0a",
  },
  comment: { color: "#666666", fontStyle: "italic" },
  prolog: { color: "#666666" },
  doctype: { color: "#666666" },
  cdata: { color: "#666666" },
  punctuation: { color: "#888888" },
  property: { color: "#ffffff", fontWeight: "600" },
  tag: { color: "#e5e5e5", fontWeight: "600" },
  boolean: { color: "#ffffff", fontWeight: "600" },
  number: { color: "#d4d4d4" },
  constant: { color: "#ffffff" },
  symbol: { color: "#d4d4d4" },
  deleted: { color: "#737373" },
  selector: { color: "#e5e5e5" },
  "attr-name": { color: "#d4d4d4" },
  string: { color: "#d1d1d1" },
  char: { color: "#d1d1d1" },
  builtin: { color: "#ffffff", fontWeight: "600" },
  inserted: { color: "#ffffff" },
  operator: { color: "#a3a3a3" },
  entity: { color: "#ffffff" },
  url: { color: "#d4d4d4", textDecoration: "underline" },
  variable: { color: "#ffffff" },
  atrule: { color: "#d4d4d4" },
  "attr-value": { color: "#cccccc" },
  function: { color: "#ffffff", fontWeight: "600" },
  "class-name": { color: "#ffffff", fontWeight: "600" },
  keyword: { color: "#ffffff", fontWeight: "700" },
  regex: { color: "#b3b3b3" },
  important: { fontWeight: "bold", color: "#ffffff" },
  bold: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
};

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3.5 rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden bg-white dark:bg-[#0a0a0a] shadow-xs">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-[#e5e5e5] dark:border-[#262626] bg-neutral-50 dark:bg-[#121212] select-none">
        <span className="font-mono text-[11px] font-medium text-neutral-600 dark:text-neutral-400 lowercase">
          {language || "code"}
        </span>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-[#1f1f1f] transition-colors cursor-pointer"
          title="Copy code to clipboard"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Code Body with Monochrome Syntax Highlighting */}
      <div className="text-xs sm:text-sm font-mono overflow-x-auto">
        <SyntaxHighlighter
          language={language || "text"}
          style={monochromeDark}
          customStyle={{
            margin: 0,
            padding: "0.875rem 1rem",
            background: "transparent",
            fontSize: "0.825rem",
          }}
          wrapLongLines={false}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeBlock;
