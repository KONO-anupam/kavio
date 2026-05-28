// components/kanban/KanbanBoard.tsx

"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { KanbanColumn } from "./KanbanColumn";
import { BookingCard } from "./BookingCard";
import { updateBookingStatus } from "@/app/dashboard/services/actions";
import type { BookingWithService, BookingStatus } from "@/types";

// The three pipeline columns shown on the board.
// "cancelled" is excluded — cancelled bookings are filtered out in the query.
const PIPELINE_COLUMNS: { status: BookingStatus; label: string }[] = [
  { status: "new",       label: "New"       },
  { status: "contacted", label: "Contacted" },
  { status: "booked",    label: "Booked"    },
];

interface KanbanBoardProps {
  initialBookings: BookingWithService[];
  accentColor: string;
}

type ColumnMap = Record<BookingStatus, BookingWithService[]>;

function groupByStatus(bookings: BookingWithService[]): ColumnMap {
  const map: ColumnMap = {
    new:       [],
    contacted: [],
    booked:    [],
    cancelled: [],
  };
  for (const b of bookings) {
    map[b.status].push(b);
  }
  return map;
}

export function KanbanBoard({ initialBookings, accentColor }: KanbanBoardProps) {
  const [columns, setColumns] = useState<ColumnMap>(() =>
    groupByStatus(initialBookings)
  );
  const [activeBooking, setActiveBooking] = useState<BookingWithService | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require a 6px movement before activating drag.
      // Prevents accidental drags when clicking the context menu.
      activationConstraint: { distance: 6 },
    })
  );

  // Find which column a booking currently lives in
  const findColumn = useCallback(
    (bookingId: string): BookingStatus | null => {
      for (const status of Object.keys(columns) as BookingStatus[]) {
        if (columns[status].some((b) => b.id === bookingId)) {
          return status;
        }
      }
      return null;
    },
    [columns]
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const booking = active.data.current?.booking as BookingWithService | undefined;
    if (booking) {
      setActiveBooking(booking);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceColumn = findColumn(activeId);
    if (!sourceColumn) return;

    // Determine target column: either a column droppable or another card's column
    const targetColumn: BookingStatus | null =
      over.data.current?.type === "column"
        ? (over.data.current.status as BookingStatus)
        : findColumn(overId);

    if (!targetColumn || sourceColumn === targetColumn) return;

    // Optimistically move the card to the target column in UI state
    setColumns((prev) => {
      const sourceItems = prev[sourceColumn].filter((b) => b.id !== activeId);
      const movingItem = prev[sourceColumn].find((b) => b.id === activeId);
      if (!movingItem) return prev;

      const updatedItem: BookingWithService = { ...movingItem, status: targetColumn };
      const targetItems = [...prev[targetColumn], updatedItem];

      return {
        ...prev,
        [sourceColumn]: sourceItems,
        [targetColumn]: targetItems,
      };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveBooking(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const currentColumn = findColumn(activeId);
    if (!currentColumn) return;

    // Reorder within same column
    if (activeId !== overId && findColumn(overId) === currentColumn) {
      setColumns((prev) => {
        const items = prev[currentColumn];
        const oldIndex = items.findIndex((b) => b.id === activeId);
        const newIndex = items.findIndex((b) => b.id === overId);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return { ...prev, [currentColumn]: arrayMove(items, oldIndex, newIndex) };
      });
      return;
    }

    // Cross-column drop — the optimistic update already happened in handleDragOver.
    // Now persist to Supabase.
    const originalStatus = active.data.current?.booking?.status as BookingStatus | undefined;
    if (originalStatus && originalStatus !== currentColumn) {
      updateBookingStatus(activeId, currentColumn).then((result) => {
        if (!result.success) {
          // Revert optimistic update on failure
          toast.error("Status update failed — reverting.");
          setColumns((prev) => {
            const revertItems = prev[currentColumn].filter((b) => b.id !== activeId);
            const revertedItem = prev[currentColumn].find((b) => b.id === activeId);
            if (!revertedItem) return prev;
            const restored: BookingWithService = { ...revertedItem, status: originalStatus };
            return {
              ...prev,
              [currentColumn]: revertItems,
              [originalStatus]: [...prev[originalStatus], restored],
            };
          });
        }
      });
    }
  }

  function handleDelete(id: string) {
    setColumns((prev) => {
      const next = { ...prev } as ColumnMap;
      for (const status of Object.keys(next) as BookingStatus[]) {
        next[status] = next[status].filter((b) => b.id !== id);
      }
      return next;
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "flex-start",
          overflowX: "auto",
          paddingBottom: "24px",
          minHeight: "600px",
        }}
      >
        {PIPELINE_COLUMNS.map(({ status, label }) => (
          <KanbanColumn
            key={status}
            status={status}
            label={label}
            bookings={columns[status]}
            accentColor={accentColor}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Drag overlay — rendered in a portal above everything */}
      <DragOverlay dropAnimation={{
        duration: 200,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
        {activeBooking ? (
          <div style={{ width: "280px" }}>
            <BookingCard
              booking={activeBooking}
              isDragging={true}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}