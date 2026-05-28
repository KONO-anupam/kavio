// components/ui/Input.tsx

"use client";

import { forwardRef, useState } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string | undefined;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, icon, id, style, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "var(--color-text-secondary)",
              userSelect: "none",
            }}
          >
            {label}
          </label>
        )}
        <div style={{ position: "relative" }}>
          {icon && (
            <div
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-muted)",
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
              }}
            >
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            style={{
              width: "100%",
              height: "36px",
              paddingLeft: icon ? "32px" : "12px",
              paddingRight: "12px",
              background: "var(--color-base-800)",
              border: `1px solid ${
                error
                  ? "#f87171"
                  : focused
                  ? "var(--accent)"
                  : "var(--color-border)"
              }`,
              borderRadius: "var(--radius-md)",
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-sans)",
              fontSize: "0.9375rem",
              outline: "none",
              transition: "border-color 0.15s",
              ...style,
            }}
            {...props}
          />
        </div>
        {error && (
          <p
            style={{
              fontSize: "0.8125rem",
              color: "#f87171",
              fontFamily: "var(--font-sans)",
            }}
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-text-muted)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";