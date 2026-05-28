// components/ui/Button.tsx

"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";

type ButtonVariant = "accent" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  accent: {
    background: "var(--accent)",
    color: "#fff",
    border: "1px solid transparent",
  },
  ghost: {
    background: "transparent",
    color: "var(--color-text-secondary)",
    border: "1px solid transparent",
  },
  outline: {
    background: "var(--color-surface-1)",
    color: "var(--color-text-primary)",
    border: "1px solid var(--color-border)",
  },
  danger: {
    background: "color-mix(in oklch, #ef4444 15%, transparent)",
    color: "#f87171",
    border: "1px solid color-mix(in oklch, #ef4444 25%, transparent)",
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { height: "30px", padding: "0 10px", fontSize: "0.8125rem", borderRadius: "var(--radius-sm)" },
  md: { height: "36px", padding: "0 14px", fontSize: "0.875rem", borderRadius: "var(--radius-md)" },
  lg: { height: "42px", padding: "0 18px", fontSize: "0.9375rem", borderRadius: "var(--radius-md)" },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "outline",
      size = "md",
      loading = false,
      fullWidth = false,
      icon,
      iconPosition = "left",
      children,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled ?? loading;

    return (
      <motion.button
        ref={ref}
        whileHover={isDisabled ? {} : { opacity: 0.85 }}
        whileTap={isDisabled ? {} : { scale: 0.98 }}
        transition={{ duration: 0.15 }}
        disabled={isDisabled}
        style={{
          ...variantStyles[variant],
          ...sizeStyles[size],
          fontFamily: "var(--font-sans)",
          fontWeight: 500,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          cursor: isDisabled ? "not-allowed" : "pointer",
          opacity: isDisabled ? 0.5 : 1,
          transition: "opacity 0.15s, background 0.15s",
          width: fullWidth ? "100%" : undefined,
          flexShrink: 0,
          userSelect: "none",
          ...style,
        }}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {loading ? (
          <>
            <Spinner />
            <span>Processing</span>
          </>
        ) : (
          <>
            {icon && iconPosition === "left" && icon}
            {children}
            {icon && iconPosition === "right" && icon}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      style={{ animation: "spin 0.7s linear infinite" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}