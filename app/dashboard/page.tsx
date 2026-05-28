// app/dashboard/page.tsx

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { getBookingsWithServices } from "./services/actions";
import type { BookingWithService } from "@/types";

export const metadata: Metadata = { title: "Pipeline" };

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect("/login");

  // Fetch profile for accent color (passed to Kanban for drag overlay styling)
  const { data: profile } = await supabase
    .from("profiles")
    .select("accent_color")
    .eq("id", user.id)
    .single();

  const result = await getBookingsWithServices();

  const bookings: BookingWithService[] = result.success ? result.data : [];

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "1.625rem",
            color: "var(--color-text-primary)",
            marginBottom: "6px",
          }}
        >
          Lead pipeline
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          Drag cards between columns to update lead status. Changes are saved automatically.
        </p>
      </div>

      <KanbanBoard
        initialBookings={bookings}
        accentColor={profile?.accent_color ?? "#6366f1"}
      />
    </div>
  );
}