// components/kanban/BookingCard.tsx

"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { deleteBooking } from "@/app/dashboard/services/actions";
import type { BookingWithService, BookingStatus } from "@/types";

interface BookingCardProps {
  booking: BookingWithService;
  isDragging?: boolean;
  onDelete: (id: string) => void;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(price);
}

const statusDotColor: Record<BookingStatus, string> = {
  new:       "var(--color-new)",
  contacted: "var(--color-contacted)",
  booked:    "var(--color-booked)",
  cancelled: "var(--color-cancelled)",
};

export function BookingCard({
  booking,
  isDragging = false,
  onDelete,
}: BookingCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setMenuOpen(false);
    startTransition(async () => {
      const result = await deleteBooking(booking.id);
      if (result.success) {
        onDelete(booking.id);
        toast.success("Record removed");
      } else {
        toast.error(result.error);
      }
    });
  }

  const initials = booking.customer_name
    .split(" ")
    .map((n) => n[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      style={{
        background: isDragging ? "var(--color-base-700)" : "var(--color-surface-2)",
        border: `1px solid ${isDragging ? "var(--accent-border)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-lg)",
        padding: "12px",
        cursor: isDragging ? "grabbing" : "grab",
        position: "relative",
        opacity: isPending ? 0.5 : 1,
        transition: "background 0.15s, border-color 0.15s, opacity 0.15s",
        boxShadow: isDragging
          ? "0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px var(--accent-border)"
          : "none",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "10px" }}>
        {/* Avatar */}
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "var(--accent-dim)",
            border: "1px solid var(--accent-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "0.6875rem",
            fontWeight: 600,
            color: "var(--accent)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--color-text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {booking.customer_name}
          </p>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {booking.customer_email}
          </p>
        </div>

        {/* Context menu trigger */}
        <div style={{ position: "relative" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            style={{
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--radius-sm)",
              background: "transparent",
              border: "none",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="3" r="1" fill="currentColor" />
              <circle cx="7" cy="7" r="1" fill="currentColor" />
              <circle cx="7" cy="11" r="1" fill="currentColor" />
            </svg>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                {/* Click-away overlay */}
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 10 }}
                  onClick={() => setMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12 }}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "28px",
                    background: "var(--color-base-800)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "4px",
                    zIndex: 20,
                    minWidth: "140px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  }}
                >
                  <button
                    onClick={handleDelete}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "var(--radius-sm)",
                      background: "transparent",
                      border: "none",
                      color: "#f87171",
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.8125rem",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M2 3.5H11M4.5 3.5V2.5A.5.5 0 0 1 5 2H8A.5.5 0 0 1 8.5 2.5V3.5M5.5 6V9.5M7.5 6V9.5M3 3.5L3.5 10.5A.5.5 0 0 0 4 11H9A.5.5 0 0 0 9.5 10.5L10 3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Delete record
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Service chip */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "3px 7px",
          borderRadius: "var(--radius-sm)",
          background: "var(--color-surface-1)",
          border: "1px solid var(--color-border)",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: statusDotColor[booking.status],
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.75rem",
            color: "var(--color-text-secondary)",
            fontWeight: 500,
          }}
        >
          {booking.service.name}
        </span>
      </div>

      {/* Metadata row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ color: "var(--color-text-muted)", flexShrink: 0 }}>
            <rect x="1" y="2" width="9" height="8" rx="1" stroke="currentColor" strokeWidth="1.1" />
            <path d="M1 5H10M3.5 1V3M7.5 1V3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          <span
            style={{
              fontSize: "0.6875rem",
              color: "var(--color-text-muted)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {formatDate(booking.start_at)}
          </span>
        </div>

        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
            fontFamily: "var(--font-sans)",
            flexShrink: 0,
          }}
        >
          {formatPrice(booking.service.price)}
        </span>
      </div>

      {/* Phone (optional) */}
      {booking.customer_phone && (
        <div
          style={{
            marginTop: "6px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ color: "var(--color-text-muted)" }}>
            <path d="M1.5 2C1.5 1.72 1.72 1.5 2 1.5H3.5L4.5 4L3.25 4.75C3.86 6 5 7.14 6.25 7.75L7 6.5L9.5 7.5V9C9.5 9.28 9.28 9.5 9 9.5C4.86 9.5 1.5 6.14 1.5 2Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
          </svg>
          <span
            style={{
              fontSize: "0.6875rem",
              color: "var(--color-text-muted)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {booking.customer_phone}
          </span>
        </div>
      )}
    </div>
  );
}