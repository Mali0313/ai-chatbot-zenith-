import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nova — Intelligent Minimalist AI",
  description:
    "A clean, black-and-white conversational AI assistant powered by Google Gemini and Supabase. Minimal, responsive, and distraction-free.",
  keywords: ["Nova", "AI Chatbot", "ChatGPT", "Gemini", "Next.js", "Minimalist", "Monochrome"],
  authors: [{ name: "Nova" }],
  applicationName: "Nova AI",
  creator: "Nova Team",
  openGraph: {
    title: "Nova — Intelligent Minimalist AI",
    description: "A clean, modern conversational AI assistant powered by Google Gemini and Supabase.",
    siteName: "Nova AI",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Nova — Intelligent Minimalist AI",
    description: "A clean, modern conversational AI assistant powered by Google Gemini and Supabase.",
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
