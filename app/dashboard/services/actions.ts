// app/dashboard/services/actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, BookingStatus, BookingWithService } from "@/types";

/**
 * Update the status of a booking (Kanban column drag-and-drop).
 * Authenticated — tenant_id is derived from the session, never from the client.
 */
export async function updateBookingStatus(
  bookingId: string,
  newStatus: BookingStatus
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Authentication required." };
  }

  const validStatuses: BookingStatus[] = ["new", "contacted", "booked", "cancelled"];
  if (!validStatuses.includes(newStatus)) {
    return { success: false, error: "Invalid status value." };
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: newStatus })
    .eq("id", bookingId)
    .eq("tenant_id", user.id); // RLS + explicit tenant check

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

/**
 * Fetch all bookings for the current tenant, joined with service name/price.
 * Returns only the columns needed for the Kanban board.
 */
export async function getBookingsWithServices(): Promise<
  ActionResult<BookingWithService[]>
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Authentication required." };
  }

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      tenant_id,
      service_id,
      customer_name,
      customer_email,
      customer_phone,
      start_at,
      end_at,
      status,
      notes,
      gcal_event_id,
      confirmation_sent_at,
      created_at,
      updated_at,
      service:services (
        id,
        name,
        duration,
        price
      )
    `)
    .eq("tenant_id", user.id)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  // Supabase returns joined relations as arrays; flatten to single object
  const bookings: BookingWithService[] = (data ?? []).map((row) => {
    const serviceRaw = Array.isArray(row.service)
      ? row.service[0]
      : row.service;

    return {
      ...row,
      service: serviceRaw ?? {
        id: row.service_id,
        name: "Unknown service",
        duration: 0,
        price: 0,
      },
    } as BookingWithService;
  });

  return { success: true, data: bookings };
}

/**
 * Delete a booking permanently.
 * Used from the booking card context menu (Step 3 — delete action).
 */
export async function deleteBooking(
  bookingId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Authentication required." };
  }

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId)
    .eq("tenant_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}