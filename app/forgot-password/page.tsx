"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import NovaLogo from "@/components/NovaLogo";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!isSupabaseConfigured() || !supabase) {
      setError("Supabase authentication is not configured yet.");
      return;
    }

    setLoading(true);
    try {
      const redirectOrigin =
        typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${redirectOrigin}/reset-password`,
        }
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-white dark:bg-[#0a0a0a] text-black dark:text-white select-none">
      <Link
        href="/login"
        className="fixed top-5 left-5 inline-flex items-center gap-2 text-xs font-medium text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Login</span>
      </Link>

      <div className="w-full max-w-sm rounded-2xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#121212] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <NovaLogo variant="full" size={32} className="mb-3" />
          <h1 className="text-xl font-bold tracking-tight">Reset password</h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Enter your email and we&apos;ll send you a recovery link
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-600 dark:text-red-400 leading-relaxed break-words">
            {error}
          </div>
        )}

        {success ? (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed text-center space-y-2">
            <CheckCircle2 size={24} className="mx-auto text-emerald-500" />
            <p className="font-semibold">Reset link sent!</p>
            <p className="text-neutral-600 dark:text-neutral-300">
              Check your inbox at <span className="font-medium underline">{email}</span> for instructions to reset your password.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block py-2 px-4 rounded-xl text-xs font-medium bg-black text-white dark:bg-white dark:text-black"
              >
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-neutral-50 dark:bg-[#171717] text-black dark:text-white placeholder:text-neutral-400 outline-none focus:border-black dark:focus:border-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <span>{loading ? "Sending link..." : "Send Reset Link"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
