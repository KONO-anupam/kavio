"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { signInWithPassword, signInWithMagicLink, signUp } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type AuthMode = "signin" | "signup" | "magic";

const TAB_LABELS: Record<AuthMode, string> = {
  signin: "Sign in",
  signup: "Create account",
  magic:  "Email link",
};

const TABS: AuthMode[] = ["signin", "signup", "magic"];

// Slide direction based on tab order
function getDirection(from: AuthMode, to: AuthMode): number {
  return TABS.indexOf(to) > TABS.indexOf(from) ? 1 : -1;
}

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [prevMode, setPrevMode] = useState<AuthMode>("signin");
  const [magicSent, setMagicSent] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function switchMode(next: AuthMode) {
    setPrevMode(mode);
    setMode(next);
    setMagicSent(false);
    setSignupDone(false);
  }

  const slideDir = getDirection(prevMode, mode);

  function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signInWithPassword(formData);
      if (!result.success) toast.error(result.error);
      // success → server redirects, no client action needed
    });
  }

  function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signUp(formData);
      if (!result.success) {
        toast.error(result.error);
      } else {
        setSignupDone(true);
      }
    });
  }

  function handleMagicLink(e: React.FormEvent<HTMLFormElement>) {
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
    <div
      className="min-h-dvh flex items-center justify-center px-4"
      style={{ background: "var(--color-base)" }}
    >
      {/* Background grid */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-base-50) 1px, transparent 1px), linear-gradient(90deg, var(--color-base-50) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          opacity: 0.025,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="mb-10 text-center">
          <div
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-5"
            style={{
              background: "var(--accent-dim)",
              border: "1px solid var(--accent-border)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2"  y="2"  width="6" height="6" rx="1.5" fill="var(--accent)" />
              <rect x="10" y="2"  width="6" height="6" rx="1.5" fill="var(--accent)" opacity="0.5" />
              <rect x="2"  y="10" width="6" height="6" rx="1.5" fill="var(--accent)" opacity="0.5" />
              <rect x="10" y="10" width="6" height="6" rx="1.5" fill="var(--accent)" />
            </svg>
          </div>
          <h1
            className="text-2xl mb-1"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Kavio
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Scheduling and lead management for your business
          </p>
        </div>

        {/* Card */}
        <div className="surface-elevated rounded-xl p-6">

          {/* Tab strip */}
          <div
            className="flex rounded-lg p-0.5 mb-6"
            style={{
              background: "var(--color-surface-1)",
              border: "1px solid var(--color-border)",
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => switchMode(tab)}
                className="flex-1 py-1.5 rounded-md text-sm font-medium transition-all duration-200"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.8125rem",
                  background:
                    mode === tab ? "var(--color-surface-3)" : "transparent",
                  color:
                    mode === tab
                      ? "var(--color-text-primary)"
                      : "var(--color-text-muted)",
                  border:
                    mode === tab
                      ? "1px solid var(--color-border-hover)"
                      : "1px solid transparent",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          {/* Form panels */}
          <AnimatePresence mode="wait" initial={false}>

            {/* ── Sign in ── */}
            {mode === "signin" && (
              <motion.form
                key="signin"
                initial={{ opacity: 0, x: slideDir * 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDir * -16 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                onSubmit={handleSignIn}
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
                <p
                  style={{
                    textAlign: "center",
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  No account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    style={{
                      color: "var(--accent)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "inherit",
                      fontFamily: "inherit",
                    }}
                  >
                    Create one
                  </button>
                </p>
              </motion.form>
            )}

            {/* ── Create account ── */}
            {mode === "signup" && !signupDone && (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: slideDir * 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDir * -16 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                onSubmit={handleSignUp}
                className="space-y-4"
              >
                <Input
                  label="Business name"
                  name="business_name"
                  type="text"
                  autoComplete="organization"
                  placeholder="Acme Studio"
                  required
                />
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
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  required
                />
                <Button
                  type="submit"
                  variant="accent"
                  fullWidth
                  loading={isPending}
                >
                  Create account
                </Button>
                <p
                  style={{
                    textAlign: "center",
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    style={{
                      color: "var(--accent)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "inherit",
                      fontFamily: "inherit",
                    }}
                  >
                    Sign in
                  </button>
                </p>
              </motion.form>
            )}

            {/* ── Account created confirmation ── */}
            {mode === "signup" && signupDone && (
              <motion.div
                key="signup-done"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="py-4 text-center space-y-3"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.08, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full mx-auto"
                  style={{
                    background: "color-mix(in oklch, var(--color-booked) 15%, transparent)",
                    border: "1px solid color-mix(in oklch, var(--color-booked) 30%, transparent)",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M2.5 8.5L6.5 12.5L13.5 4.5"
                      stroke="var(--color-booked)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>
                <p
                  style={{
                    color: "var(--color-text-primary)",
                    fontSize: "0.9375rem",
                    fontWeight: 500,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Account created
                </p>
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: "0.8125rem",
                    lineHeight: 1.6,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  A verification link is on its way to your inbox.
                  Click it to activate your account, then sign in.
                </p>
                <button
                  onClick={() => switchMode("signin")}
                  style={{
                    color: "var(--accent)",
                    fontSize: "0.8125rem",
                    fontFamily: "var(--font-sans)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Back to sign in
                </button>
              </motion.div>
            )}

            {/* ── Email link ── */}
            {mode === "magic" && !magicSent && (
              <motion.form
                key="magic"
                initial={{ opacity: 0, x: slideDir * 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDir * -16 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                onSubmit={handleMagicLink}
                className="space-y-4"
              >
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                    fontFamily: "var(--font-sans)",
                    lineHeight: 1.5,
                  }}
                >
                  Enter your email and we&apos;ll send a passwordless sign-in link.
                  Works for both new and existing accounts.
                </p>
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
                key="magic-sent"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="py-4 text-center space-y-3"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.08, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full mx-auto"
                  style={{
                    background: "color-mix(in oklch, var(--color-booked) 15%, transparent)",
                    border: "1px solid color-mix(in oklch, var(--color-booked) 30%, transparent)",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M1.5 4.5L8 9L14.5 4.5M1.5 4.5H14.5V12.5H1.5V4.5Z"
                      stroke="var(--color-booked)"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>
                <p
                  style={{
                    color: "var(--color-text-primary)",
                    fontSize: "0.9375rem",
                    fontWeight: 500,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Transmission sent
                </p>
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: "0.8125rem",
                    lineHeight: 1.6,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  An access link is on its way to your inbox.
                  It expires in 60 minutes.
                </p>
                <button
                  onClick={() => setMagicSent(false)}
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: "0.8125rem",
                    fontFamily: "var(--font-sans)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                  className="hover:underline"
                >
                  Use a different address
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <p
          className="text-center mt-5 text-xs"
          style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-sans)" }}
        >
          By creating an account you agree to our terms of service.
        </p>
      </motion.div>
    </div>
  );
}