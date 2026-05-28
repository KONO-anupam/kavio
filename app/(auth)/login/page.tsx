// app/(auth)/login/page.tsx

"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { Metadata } from "next";
import { signInWithPassword, signInWithMagicLink } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Note: metadata export doesn't work in "use client" components.
// Move to a parent layout if needed. Kept here for reference.
// export const metadata: Metadata = { title: "Sign In" };

type AuthMode = "password" | "magic";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("password");
  const [magicSent, setMagicSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signInWithPassword(formData);
      if (!result.success) {
        toast.error(result.error);
      }
      // On success, server redirects — no client handling needed
    });
  }

  function handleMagicSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signInWithMagicLink(formData);
      if (!result.success) {
        toast.error(result.error);
      } else {
        setMagicSent(true);
      }
    });
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4"
      style={{ background: "var(--color-base)" }}
    >
      {/* Background grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-base-50) 1px, transparent 1px), linear-gradient(90deg, var(--color-base-50) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo / wordmark */}
        <div className="mb-10 text-center">
          <div
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-5"
            style={{
              background: "var(--accent-dim)",
              border: "1px solid var(--accent-border)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="6" height="6" rx="1.5" fill="var(--accent)" />
              <rect x="10" y="2" width="6" height="6" rx="1.5" fill="var(--accent)" opacity="0.5" />
              <rect x="2" y="10" width="6" height="6" rx="1.5" fill="var(--accent)" opacity="0.5" />
              <rect x="10" y="10" width="6" height="6" rx="1.5" fill="var(--accent)" />
            </svg>
          </div>
          <h1
            className="text-2xl mb-1"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            BookingOS
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Operational control for your business
          </p>
        </div>

        {/* Card */}
        <div className="surface-elevated rounded-xl p-6">
          {/* Mode toggle */}
          <div
            className="flex rounded-lg p-0.5 mb-6"
            style={{ background: "var(--color-surface-1)", border: "1px solid var(--color-border)" }}
          >
            {(["password", "magic"] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setMagicSent(false); }}
                className="flex-1 py-1.5 rounded-md text-sm font-medium transition-all duration-200"
                style={{
                  fontFamily: "var(--font-sans)",
                  background: mode === m ? "var(--color-surface-3)" : "transparent",
                  color: mode === m ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  border: mode === m ? "1px solid var(--color-border-hover)" : "1px solid transparent",
                }}
              >
                {m === "password" ? "Password" : "Email link"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ── Password form ── */}
            {mode === "password" && (
              <motion.form
                key="password"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handlePasswordSubmit}
                className="space-y-4"
              >
                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@business.com"
                  required
                />
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  required
                />
                <Button
                  type="submit"
                  variant="accent"
                  fullWidth
                  loading={isPending}
                >
                  Access dashboard
                </Button>
              </motion.form>
            )}

            {/* ── Magic link form ── */}
            {mode === "magic" && !magicSent && (
              <motion.form
                key="magic"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleMagicSubmit}
                className="space-y-4"
              >
                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@business.com"
                  required
                />
                <Button
                  type="submit"
                  variant="accent"
                  fullWidth
                  loading={isPending}
                >
                  Send access link
                </Button>
              </motion.form>
            )}

            {/* ── Magic link sent ── */}
            {mode === "magic" && magicSent && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="py-4 text-center space-y-3"
              >
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full mx-auto"
                  style={{
                    background: "color-mix(in oklch, var(--color-booked) 15%, transparent)",
                    border: "1px solid color-mix(in oklch, var(--color-booked) 30%, transparent)",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2.5 8.5L6.5 12.5L13.5 4.5" stroke="var(--color-booked)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p style={{ color: "var(--color-text-primary)", fontSize: "0.9375rem", fontWeight: 500 }}>
                  Transmission sent
                </p>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", lineHeight: 1.5 }}>
                  An access link is on its way to your inbox. It expires in 60 minutes.
                </p>
                <button
                  onClick={() => setMagicSent(false)}
                  style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}
                  className="hover:underline"
                >
                  Use a different address
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p
          className="text-center mt-5 text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          New account created automatically on first sign-in.
        </p>
      </motion.div>
    </div>
  );
}