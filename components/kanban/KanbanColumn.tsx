// components/kanban/KanbanColumn.tsx

"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { SortableCard } from "./SortableCard";
import type { BookingWithService, BookingStatus } from "@/types";

interface KanbanColumnProps {
  status: BookingStatus;
  label: string;
  bookings: BookingWithService[];
  accentColor: string;
  onDelete: (id: string) => void;
}

const columnConfig: Record<
  BookingStatus,
  { color: string; bgVar: string; borderVar: string }
> = {
  new: {
    color: "var(--color-new)",
    bgVar: "color-mix(in oklch, var(--color-new) 8%, transparent)",
    borderVar: "color-mix(in oklch, var(--color-new) 20%, transparent)",
  },
  contacted: {
    color: "var(--color-contacted)",
    bgVar: "color-mix(in oklch, var(--color-contacted) 8%, transparent)",
    borderVar: "color-mix(in oklch, var(--color-contacted) 20%, transparent)",
  },
  booked: {
    color: "var(--color-booked)",
    bgVar: "color-mix(in oklch, var(--color-booked) 8%, transparent)",
    borderVar: "color-mix(in oklch, var(--color-booked) 20%, transparent)",
  },
  cancelled: {
    color: "var(--color-cancelled)",
    bgVar: "color-mix(in oklch, var(--color-cancelled) 8%, transparent)",
    borderVar: "color-mix(in oklch, var(--color-cancelled) 20%, transparent)",
  },
};

export function KanbanColumn({
  status,
  label,
  bookings,
  accentColor,
  onDelete,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: "column", status },
  });

  const config = columnConfig[status];
  const ids = bookings.map((b) => b.id);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minWidth: "280px",
        flex: "1 1 280px",
        maxWidth: "360px",
      }}
    >
      {/* Column header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 12px",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
          background: config.bgVar,
          border: `1px solid ${config.borderVar}`,
          borderBottom: "none",
          marginBottom: 0,
        }}
      >
        <div
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: config.color,
            boxShadow: `0 0 6px ${config.color}`,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: config.color,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-sans)",
            fontSize: "0.75rem",
            fontWeight: 500,
            color: config.color,
            background: config.bgVar,
            border: `1px solid ${config.borderVar}`,
            borderRadius: "10px",
            padding: "1px 7px",
            opacity: 0.8,
          }}
        >
          {bookings.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          minHeight: "400px",
          padding: "8px",
          borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
          background: isOver
            ? "color-mix(in oklch, var(--accent) 5%, var(--color-surface-1))"
            : "var(--color-surface-1)",
          border: `1px solid ${isOver ? "var(--accent-border)" : config.borderVar}`,
          transition: "background 0.15s, border-color 0.15s",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <AnimatePresence initial={false}>
            {bookings.map((booking) => (
              <motion.div
                key={booking.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                <SortableCard booking={booking} onDelete={onDelete} />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>

        {/* Empty state */}
        {bookings.length === 0 && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "32px 16px",
              opacity: isOver ? 0.8 : 0.4,
              transition: "opacity 0.15s",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: config.color }}>
              <rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="1.25" strokeDasharray="3 2" />
              <path d="M8 6V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.25" />
            </svg>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                textAlign: "center",
              }}
            >
              No appointments on record
            </p>
          </div>
        )}
      </div>
    </div>
  );
}