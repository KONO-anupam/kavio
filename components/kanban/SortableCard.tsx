// components/kanban/SortableCard.tsx

"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BookingCard } from "./BookingCard";
import type { BookingWithService } from "@/types";

interface SortableCardProps {
  booking: BookingWithService;
  onDelete: (id: string) => void;
}

/**
 * Wraps BookingCard with dnd-kit's useSortable hook.
 * Separating drag logic from presentation keeps BookingCard
 * usable in non-draggable contexts (e.g., mobile list view).
 */
export function SortableCard({ booking, onDelete }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: booking.id,
    data: {
      type: "card",
      booking,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    // When dragging, the original card becomes a transparent placeholder
    opacity: isDragging ? 0.35 : 1,
    position: "relative",
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BookingCard
        booking={booking}
        isDragging={false}
        onDelete={onDelete}
      />
    </div>
  );
}