// components/ui/Button.tsx

"use client";

import React, { forwardRef } from "react";
import {
  motion,
  type HTMLMotionProps,
  type MotionStyle,
} from "framer-motion";

type ButtonVariant = "accent" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "style"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  style?: MotionStyle;
}

const variantStyles: Record<ButtonVariant, MotionStyle> = {
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
    border:
      "1px solid color-mix(in oklch, #ef4444 25%, transparent)",
  },
};

const sizeStyles: Record<ButtonSize, MotionStyle> = {
  sm: {
    height: "30px",
    padding: "0 10px",
    fontSize: "0.8125rem",
    borderRadius: "var(--radius-sm)",
  },

  md: {
    height: "36px",
    padding: "0 14px",
    fontSize: "0.875rem",
    borderRadius: "var(--radius-md)",
  },

  lg: {
    height: "42px",
    padding: "0 18px",
    fontSize: "0.9375rem",
    borderRadius: "var(--radius-md)",
  },
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
      className,
      whileHover,
      whileTap,
      transition,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const baseStyle: MotionStyle = {
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

      width: fullWidth ? "100%" : "auto",

      flexShrink: 0,
      userSelect: "none",
    };

    const mergedStyle: MotionStyle = {
      ...baseStyle,
      ...(style ?? {}),
    };

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        className={className}
        style={mergedStyle}
        {...(isDisabled
          ? {}
          : {
              whileHover: whileHover ?? { opacity: 0.85 },
              whileTap: whileTap ?? { scale: 0.98 },
            })}
        transition={transition ?? { duration: 0.15 }}
        {...rest}
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
      style={{
        animation: "spin 0.7s linear infinite",
      }}
    >
      <style>
        {`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>

      <circle
        cx="7"
        cy="7"
        r="5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />

      <path
        d="M7 1.5A5.5 5.5 0 0 1 12.5 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}