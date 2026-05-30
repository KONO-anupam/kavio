// components/booking/SlotPicker.tsx

"use client";

import { useState, useEffect, useTransition } from "react";
import { motion } from "framer-motion";
import { getAvailableSlots } from "@/app/book/[slug]/actions";
import { formatSlotTime } from "@/lib/availability";
import type { BusinessHours, TimeSlot } from "@/types";

interface SlotPickerProps {
  tenantId: string;
  durationMinutes: number;
  businessHours: BusinessHours;
  timezone: string;
  bookableDates: string[];
  onSelect: (slot: TimeSlot) => void;
  selected: TimeSlot | null;
}


export function SlotPicker({
  tenantId,
  durationMinutes,
  businessHours,
  timezone,
  bookableDates,
  onSelect,
  selected,
}: SlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState<string>(bookableDates[0] ?? "");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!selectedDate) return;
    startTransition(async () => {
      const result = await getAvailableSlots({
        tenantId,
        date: selectedDate,
        durationMinutes,
        businessHours,
        timezone,
      });
      if (result.success) {
        setSlots(result.data);
      }
    });
  }, [selectedDate, tenantId, durationMinutes, timezone]);

  // Show next 14 bookable dates in the date strip
  const visibleDates = bookableDates.slice(0, 14);
  const availableSlots = slots.filter((s) => s.available);

  function formatDateLabel(dateStr: string): { day: string; num: string; month: string } {
    const [y, m, d] = dateStr.split("-").map(Number) as [number, number, number];
    const date = new Date(y, m - 1, d);
    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      num: date.toLocaleDateString("en-US", { day: "numeric" }),
      month: date.toLocaleDateString("en-US", { month: "short" }),
    };
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Date strip */}
      <div>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "10px", fontFamily: "var(--font-sans)" }}>
          Select a date
        </p>
        <div
          style={{
            display: "flex",
            gap: "6px",
            overflowX: "auto",
            paddingBottom: "4px",
          }}
        >
          {visibleDates.map((dateStr) => {
            const { day, num, month } = formatDateLabel(dateStr);
            const isSelected = selectedDate === dateStr;
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2px",
                  padding: "8px 10px",
                  minWidth: "52px",
                  flexShrink: 0,
                  borderRadius: "var(--radius-md)",
                  background: isSelected ? "var(--accent)" : "var(--color-surface-1)",
                  border: `1px solid ${isSelected ? "var(--accent)" : "var(--color-border)"}`,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <span style={{
                  fontSize: "0.6875rem",
                  color: isSelected ? "rgba(255,255,255,0.7)" : "var(--color-text-muted)",
                  fontFamily: "var(--font-sans)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}>
                  {day}
                </span>
                <span style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: isSelected ? "#fff" : "var(--color-text-primary)",
                  fontFamily: "var(--font-sans)",
                  lineHeight: 1,
                }}>
                  {num}
                </span>
                <span style={{
                  fontSize: "0.6875rem",
                  color: isSelected ? "rgba(255,255,255,0.7)" : "var(--color-text-muted)",
                  fontFamily: "var(--font-sans)",
                }}>
                  {month}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slot grid */}
      <div>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "10px", fontFamily: "var(--font-sans)" }}>
          Available times
          {!isPending && availableSlots.length > 0 && (
            <span style={{ marginLeft: "6px", color: "var(--color-text-muted)" }}>
              — {availableSlots.length} slot{availableSlots.length !== 1 ? "s" : ""}
            </span>
          )}
        </p>

        {isPending ? (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: "72px",
                  height: "36px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-surface-1)",
                  border: "1px solid var(--color-border)",
                  animation: "pulse 1.5s ease-in-out infinite",
                  opacity: 1 - i * 0.08,
                }}
              />
            ))}
            <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }`}</style>
          </div>
        ) : availableSlots.length === 0 ? (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              background: "var(--color-surface-1)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", fontFamily: "var(--font-sans)" }}>
              No availability on this date
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}
          >
            {availableSlots.map((slot) => {
              const isSelected = selected?.start === slot.start;
              return (
                <button
                  key={slot.start}
                  onClick={() => onSelect(slot)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: "var(--radius-md)",
                    background: isSelected ? "var(--accent)" : "var(--color-surface-1)",
                    border: `1px solid ${isSelected ? "var(--accent)" : "var(--color-border)"}`,
                    color: isSelected ? "#fff" : "var(--color-text-primary)",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.875rem",
                    fontWeight: isSelected ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatSlotTime(slot.start, timezone)}
                </button>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}