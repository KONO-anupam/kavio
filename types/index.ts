// types/index.ts

import type { Database, BookingStatus } from "./database";

// ============================================================
// Row types — direct table row shapes
// ============================================================

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type CalendarSyncToken =
  Database["public"]["Tables"]["calendar_sync_tokens"]["Row"];

// ============================================================
// Insert types
// ============================================================

export type ProfileInsert =
  Database["public"]["Tables"]["profiles"]["Insert"];
export type ServiceInsert =
  Database["public"]["Tables"]["services"]["Insert"];
export type BookingInsert =
  Database["public"]["Tables"]["bookings"]["Insert"];
export type CalendarSyncTokenInsert =
  Database["public"]["Tables"]["calendar_sync_tokens"]["Insert"];

// ============================================================
// Update types
// ============================================================

export type ProfileUpdate =
  Database["public"]["Tables"]["profiles"]["Update"];
export type ServiceUpdate =
  Database["public"]["Tables"]["services"]["Update"];
export type BookingUpdate =
  Database["public"]["Tables"]["bookings"]["Update"];

// ============================================================
// Enums
// ============================================================

export type { BookingStatus };

export const BOOKING_STATUSES: BookingStatus[] = [
  "new",
  "contacted",
  "booked",
  "cancelled",
];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  new: "New",
  contacted: "Contacted",
  booked: "Booked",
  cancelled: "Cancelled",
};

// ============================================================
// Composed / enriched types (joins)
// ============================================================

export type BookingWithService = Booking & {
  service: Pick<Service, "id" | "name" | "duration" | "price">;
};

// ============================================================
// Business hours
// ============================================================

export interface DayHours {
  open: string;    // "HH:MM" 24hr
  close: string;   // "HH:MM" 24hr
  enabled: boolean;
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type BusinessHours = Record<DayOfWeek, DayHours>;

// ============================================================
// Dashboard metrics (returned by get_tenant_metrics RPC)
// ============================================================

export interface TenantMetrics {
  total_leads: number;
  booked_count: number;
  cancelled_count: number;
  conversion_rate: number;
  revenue_pipeline: number;
}

// ============================================================
// Server action return type convention
// ============================================================

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================================
// Google Calendar token shape (stored encrypted)
// ============================================================

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
  scope: string;
}

// ============================================================
// Time slot (used by booking portal availability engine)
// ============================================================

export interface TimeSlot {
  start: string;   // ISO 8601
  end: string;     // ISO 8601
  available: boolean;
}