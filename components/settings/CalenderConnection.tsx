// components/settings/CalenderConnection.tsx
"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { disconnectGoogleCalendar } from "@/app/dashboard/settings/actions";

interface CalendarConnectionProps {
  isConnected: boolean;
}

export function CalendarConnection({ isConnected }: CalendarConnectionProps) {
  const [isPending, startTransition] = useTransition();

  function handleDisconnect() {
    startTransition(async () => {
      const result = await disconnectGoogleCalendar();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Google Calendar disconnected");
    });
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        padding: "14px 16px",
        background: "var(--color-surface-1)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)",
      }}
    >
      {/* Google icon + status */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Google Calendar icon (simplified SVG) */}
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="4" width="14" height="12" rx="1.5" stroke="var(--color-text-secondary)" strokeWidth="1.25" />
            <path d="M2 7H16" stroke="var(--color-text-secondary)" strokeWidth="1.25" />
            <path d="M6 2V5M12 2V5" stroke="var(--color-text-secondary)" strokeWidth="1.25" strokeLinecap="round" />
            <rect x="5.5" y="9.5" width="3" height="3" rx="0.5" fill="var(--color-text-muted)" />
          </svg>
        </div>

        <div>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--color-text-primary)",
              marginBottom: "2px",
            }}
          >
            Google Calendar
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: isConnected ? "var(--color-booked)" : "var(--color-text-muted)",
                flexShrink: 0,
              }}
            />
            <p
              style={{
                fontSize: "0.8125rem",
                color: isConnected ? "var(--color-booked)" : "var(--color-text-muted)",
              }}
            >
              {isConnected ? "Connected" : "Not connected"}
            </p>
          </div>
        </div>
      </div>

      {/* Action button */}
      {isConnected ? (
        <Button
          variant="danger"
          size="sm"
          onClick={handleDisconnect}
          loading={isPending}
        >
          Disconnect
        </Button>
      ) : (
        <a href="/api/auth/google" style={{ textDecoration: "none" }}>
          <Button variant="outline" size="sm">
            Connect
          </Button>
        </a>
      )}
    </div>
  );
}