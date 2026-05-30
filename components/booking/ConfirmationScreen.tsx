// components/booking/ConfirmationScreen.tsx

"use client";

import { motion } from "framer-motion";
import { formatSlotTime, formatSlotDate } from "@/lib/availability";
import type { Service, TimeSlot } from "@/types";

interface ConfirmationScreenProps {
  service: Service;
  slot: TimeSlot;
  timezone: string;
  customerName: string;
  customerEmail: string;
  bookingId: string;
  businessName: string;
}

export function ConfirmationScreen({
  service,
  slot,
  timezone,
  customerEmail,
  bookingId,
  businessName,
}: ConfirmationScreenProps) {
  const formattedDate = formatSlotDate(slot.start, timezone);
  const startTime = formatSlotTime(slot.start, timezone);
  const endTime = formatSlotTime(slot.end, timezone);
  const bookingRef = bookingId.slice(0, 8).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", textAlign: "center", padding: "8px 0" }}
    >
      {/* Check icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "color-mix(in oklch, var(--color-booked) 15%, transparent)",
          border: "1px solid color-mix(in oklch, var(--color-booked) 30%, transparent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M4 11.5L9 16.5L18 7" stroke="var(--color-booked)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>

      <div>
        <h2
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "1.5rem",
            color: "var(--color-text-primary)",
            marginBottom: "8px",
          }}
        >
          Appointment confirmed
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)", lineHeight: 1.6 }}>
          A confirmation has been sent to <strong style={{ color: "var(--color-text-primary)" }}>{customerEmail}</strong>
        </p>
      </div>

      {/* Booking card */}
      <div
        style={{
          width: "100%",
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "20px",
          textAlign: "left",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }} cellPadding={0} cellSpacing={0}>
          <tbody>
            {[
              { label: "Service", value: service.name },
              { label: "Date", value: formattedDate },
              { label: "Time", value: `${startTime} – ${endTime}` },
              { label: "With", value: businessName },
              {
                label: "Reference",
                value: bookingRef,
                mono: true,
              },
            ].map(({ label, value, mono }, i, arr) => (
              <tr key={label}>
                <td
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: "0.8125rem",
                    fontFamily: "var(--font-sans)",
                    paddingBottom: i < arr.length - 1 ? "12px" : 0,
                    width: "35%",
                    verticalAlign: "top",
                  }}
                >
                  {label}
                </td>
                <td
                  style={{
                    color: "var(--color-text-primary)",
                    fontSize: "0.875rem",
                    fontFamily: mono ? "monospace" : "var(--font-sans)",
                    fontWeight: 500,
                    paddingBottom: i < arr.length - 1 ? "12px" : 0,
                    letterSpacing: mono ? "0.05em" : 0,
                  }}
                >
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p
        style={{
          fontSize: "0.8125rem",
          color: "var(--color-text-muted)",
          fontFamily: "var(--font-sans)",
          lineHeight: 1.6,
          maxWidth: "320px",
        }}
      >
        You&apos;ll receive a calendar invite at your email address. Contact {businessName} directly if you need to reschedule.
      </p>
    </motion.div>
  );
}