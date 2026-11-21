import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zenith — Intelligent Minimalist AI",
  description:
    "A clean, black-and-white conversational AI assistant powered by Google Gemini. Minimal, responsive, and distraction-free.",
  keywords: ["AI Chatbot", "ChatGPT", "Gemini", "Next.js", "Minimalist", "Monochrome"],
  authors: [{ name: "Zenith" }],
  applicationName: "Zenith AI",
  creator: "Zenith Team",
  openGraph: {
    title: "Zenith — Intelligent Minimalist AI",
    description: "A clean, black-and-white conversational AI assistant powered by Google Gemini.",
    siteName: "Zenith AI",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Zenith — Intelligent Minimalist AI",
    description: "A clean, black-and-white conversational AI assistant powered by Google Gemini.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full dark`} suppressHydrationWarning>
      <body className="h-full w-full bg-white text-black dark:bg-[#0a0a0a] dark:text-white font-sans antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
