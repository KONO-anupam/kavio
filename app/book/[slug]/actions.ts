// app/book/[slug]/actions.ts

"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { getBusyTimes, createCalendarEvent, isCalendarConnected } from "@/lib/google/calendar";
import { computeAvailableSlots, getBookableDates } from "@/lib/availability";
import { sendBookingConfirmation, sendLeadNotification } from "@/lib/resend/emails";
import type {
  ActionResult,
  BookingInsert,
  BusinessHours,
  TimeSlot,
  Service,
} from "@/types";

// ── Public profile fetch ──────────────────────────────────────────────────

export interface PublicProfile {
  id: string;
  business_name: string;
  slug: string;
  accent_color: string;
  logo_url: string | null;
  business_hours: BusinessHours;
  timezone: string;
}

export async function getPublicProfile(
  slug: string
): Promise<ActionResult<PublicProfile>> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, business_name, slug, accent_color, logo_url, business_hours, timezone")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return { success: false, error: "No business found at this address." };
  }

  return {
    success: true,
    data: data as unknown as PublicProfile,
  };
}

// ── Active services for a tenant ──────────────────────────────────────────

export async function getActiveServices(
  tenantId: string
): Promise<ActionResult<Service[]>> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data ?? [] };
}

// ── Available slots for a date ────────────────────────────────────────────

export interface GetSlotsParams {
  tenantId: string;
  date: string;           // YYYY-MM-DD
  durationMinutes: number;
  businessHours: BusinessHours;
  timezone: string;
}

export async function getAvailableSlots(
  params: GetSlotsParams
): Promise<ActionResult<TimeSlot[]>> {
  const { tenantId, date, durationMinutes, businessHours, timezone } = params;

  const supabase = createServiceRoleClient();

  // Build UTC range for the day
  const [yearStr, monthStr, dayStr] = date.split("-") as [string, string, string];
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  const dayStart = new Date(Date.UTC(year, month, day, 0, 0, 0));
  const dayEnd = new Date(Date.UTC(year, month, day, 23, 59, 59));

  // Fetch existing bookings for this tenant on this date
  const { data: existingBookings, error: bookingError } = await supabase
    .from("bookings")
    .select("start_at, end_at")
    .eq("tenant_id", tenantId)
    .in("status", ["new", "contacted", "booked"])
    .gte("start_at", dayStart.toISOString())
    .lte("start_at", dayEnd.toISOString());

  if (bookingError) {
    return { success: false, error: bookingError.message };
  }

  const existingBlocks = (existingBookings ?? []).map((b) => ({
    start: b.start_at,
    end: b.end_at,
  }));

  // Fetch Google Calendar busy times if connected
  let gcalBusyBlocks: Array<{ start: string; end: string }> = [];
  const calendarConnected = await isCalendarConnected(tenantId);

  if (calendarConnected) {
    try {
      gcalBusyBlocks = await getBusyTimes(tenantId, dayStart, dayEnd);
    } catch (err) {
      console.warn("[getAvailableSlots] GCal fetch failed:", err);
    }
  }

  const slots = computeAvailableSlots({
    date,
    durationMinutes,
    businessHours,
    timezone,
    gcalBusyBlocks,
    existingBookings: existingBlocks,
    slotInterval: 15,
  });

  return { success: true, data: slots };
}

// ── Booking submission ────────────────────────────────────────────────────

export interface SubmitBookingInput {
  tenantId: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startAt: string;
  endAt: string;
  timezone: string;
  businessName: string;
  notes?: string | undefined;
}

export interface SubmitBookingResult {
  bookingId: string;
  startAt: string;
  endAt: string;
}

export async function submitBooking(
  input: SubmitBookingInput
): Promise<ActionResult<SubmitBookingResult>> {
  const supabase = createServiceRoleClient();

  // ── 1. Slot conflict check ──────────────────────────────────────────────
  // Re-verify the slot is still free at submission time.
  // The portal may have been open for a while with stale slot data.
  const { count: conflictCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", input.tenantId)
    .in("status", ["new", "contacted", "booked"])
    .lt("start_at", input.endAt)
    .gt("end_at", input.startAt);

  if ((conflictCount ?? 0) > 0) {
    return {
      success: false,
      error: "This time slot was just taken. Please select another.",
    };
  }

  // ── 2. Service validation ───────────────────────────────────────────────
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, is_active, name, price, duration")
    .eq("id", input.serviceId)
    .eq("tenant_id", input.tenantId)
    .single();

  if (serviceError || !service?.is_active) {
    return {
      success: false,
      error: "The selected service is no longer available.",
    };
  }

  // ── 3. Insert booking ───────────────────────────────────────────────────
  const insert: BookingInsert = {
    tenant_id: input.tenantId,
    service_id: input.serviceId,
    customer_name: input.customerName.trim(),
    customer_email: input.customerEmail.trim().toLowerCase(),
    customer_phone: input.customerPhone.trim() || null,
    start_at: input.startAt,
    end_at: input.endAt,
    status: "new",
    notes: input.notes?.trim() || null,
  };

  const { data: booking, error: insertError } = await supabase
    .from("bookings")
    .insert(insert)
    .select("id, start_at, end_at")
    .single();

  if (insertError || !booking) {
    return {
      success: false,
      error: insertError?.message ?? "Booking could not be recorded.",
    };
  }

  // ── 4. Google Calendar event (non-fatal) ────────────────────────────────
  const calendarConnected = await isCalendarConnected(input.tenantId);

  if (calendarConnected) {
    try {
      const gcalEventId = await createCalendarEvent(input.tenantId, {
        summary: `${input.serviceName} — ${input.customerName}`,
        description: [
          `Customer: ${input.customerName}`,
          `Email: ${input.customerEmail}`,
          input.customerPhone ? `Phone: ${input.customerPhone}` : null,
          input.notes ? `Notes: ${input.notes}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
        startAt: input.startAt,
        endAt: input.endAt,
        attendeeEmail: input.customerEmail,
        timeZone: input.timezone,
      });

      if (gcalEventId) {
        await supabase
          .from("bookings")
          .update({ gcal_event_id: gcalEventId })
          .eq("id", booking.id);
      }
    } catch (err) {
      console.warn("[submitBooking] GCal event creation failed:", err);
    }
  }

  // ── 5. Transactional emails ─────────────────────────────────────────────
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const bookingPortalUrl = `${appUrl}/book/${input.tenantId}`;
  const dashboardUrl = `${appUrl}/dashboard`;

  // Fetch owner's email from Supabase Auth (service role can access auth.users)
  const {
    data: { user: ownerUser },
  } = await supabase.auth.admin.getUserById(input.tenantId);

  const ownerEmail =
    process.env.RESEND_OWNER_EMAIL ??
    ownerUser?.email ??
    null;

  // Send customer confirmation (non-fatal)
  const confirmationResult = await sendBookingConfirmation({
    to: input.customerEmail,
    customerName: input.customerName,
    businessName: input.businessName,
    serviceName: input.serviceName,
    servicePrice: input.servicePrice,
    serviceDuration: input.serviceDuration,
    startAt: input.startAt,
    endAt: input.endAt,
    timezone: input.timezone,
    accentColor: "#6366f1", // default; tenant color injected in Step 5 portal page
    bookingId: booking.id,
    bookingPortalUrl,
  });

  // Send owner lead notification (non-fatal)
  if (ownerEmail) {
    await sendLeadNotification({
      to: ownerEmail,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone || null,
      businessName: input.businessName,
      serviceName: input.serviceName,
      servicePrice: input.servicePrice,
      startAt: input.startAt,
      endAt: input.endAt,
      timezone: input.timezone,
      accentColor: "#6366f1",
      dashboardUrl,
      notes: input.notes ?? null,
    });
  }

  // Mark confirmation as sent if email succeeded
  if (confirmationResult.success) {
    await supabase
      .from("bookings")
      .update({ confirmation_sent_at: new Date().toISOString() })
      .eq("id", booking.id);
  }

  return {
    success: true,
    data: {
      bookingId: booking.id,
      startAt: booking.start_at,
      endAt: booking.end_at,
    },
  };
}

// ── Bookable dates helper ─────────────────────────────────────────────────

export async function getBookableDatesForTenant(
  businessHours: BusinessHours,
  daysAhead?: number
): Promise<ActionResult<string[]>> {
  const dates = getBookableDates(businessHours, daysAhead ?? 60);
  return { success: true, data: dates };
}