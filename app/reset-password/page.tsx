"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import NovaLogo from "@/components/NovaLogo";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!isSupabaseConfigured() || !supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-white dark:bg-[#0a0a0a] text-black dark:text-white select-none">
      <div className="w-full max-w-sm rounded-2xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#121212] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <NovaLogo variant="full" size={32} className="mb-3" />
          <h1 className="text-xl font-bold tracking-tight">Set new password</h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Choose a strong password with at least 8 characters
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
            <p className="font-semibold">Password updated successfully!</p>
            <p className="text-neutral-600 dark:text-neutral-300">
              Redirecting you to Nova...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                New password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 pr-10 text-sm rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-neutral-50 dark:bg-[#171717] text-black dark:text-white placeholder:text-neutral-400 outline-none focus:border-black dark:focus:border-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Confirm new password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-neutral-50 dark:bg-[#171717] text-black dark:text-white placeholder:text-neutral-400 outline-none focus:border-black dark:focus:border-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <span>{loading ? "Updating..." : "Update Password"}</span>
            </button>
          </form>
        )}

        <div className="mt-5 text-center">
          <Link
            href="/login"
            className="text-xs text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
