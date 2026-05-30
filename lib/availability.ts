// lib/availability.ts

/**
 * Availability Engine
 *
 * Computes bookable time slots for a given date by:
 * 1. Reading business hours for that day of week
 * 2. Fetching Google Calendar busy times (if connected)
 * 3. Fetching existing bookings from Supabase for that day
 * 4. Splitting the open window into N-minute slots
 * 5. Marking any slot that overlaps a busy block as unavailable
 *
 * All times are handled in UTC internally. Conversion to/from
 * tenant timezone is done at the edges using date-fns-tz.
 */

import {
  startOfDay,
  endOfDay,
  addMinutes,
  isWithinInterval,
  parseISO,
  format,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import type { BusinessHours, DayOfWeek, TimeSlot } from "@/types";

const DAY_NAMES: DayOfWeek[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

interface BusyBlock {
  start: string; // ISO 8601 UTC
  end: string;   // ISO 8601 UTC
}

interface AvailabilityParams {
  /** Date string in YYYY-MM-DD format (tenant local date) */
  date: string;
  /** Service duration in minutes */
  durationMinutes: number;
  /** Tenant's business hours configuration */
  businessHours: BusinessHours;
  /** Tenant's IANA timezone string e.g. "America/New_York" */
  timezone: string;
  /** Busy blocks from Google Calendar (UTC ISO strings) */
  gcalBusyBlocks: BusyBlock[];
  /** Existing booking blocks from Supabase (UTC ISO strings) */
  existingBookings: BusyBlock[];
  /** Slot interval in minutes — defaults to 15 */
  slotInterval?: number;
}

/**
 * Parse "HH:MM" string into { hours, minutes }
 */
function parseHHMM(time: string): { hours: number; minutes: number } {
  const parts = time.split(":");
  const hoursStr = parts[0];
  const minutesStr = parts[1];

  if (!hoursStr || !minutesStr) {
    throw new Error(`Invalid time format: "${time}". Expected "HH:MM".`);
  }

  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error(`Invalid time values in: "${time}".`);
  }

  return { hours, minutes };
}

/**
 * Check whether a proposed slot [slotStart, slotEnd) overlaps
 * any busy block.
 */
function overlapsAnyBusy(
  slotStart: Date,
  slotEnd: Date,
  busyBlocks: BusyBlock[]
): boolean {
  for (const block of busyBlocks) {
    const blockStart = parseISO(block.start);
    const blockEnd = parseISO(block.end);

    // Overlap condition: slot starts before block ends AND slot ends after block starts
    if (slotStart < blockEnd && slotEnd > blockStart) {
      return true;
    }
  }
  return false;
}

/**
 * Main availability computation function.
 * Returns an array of TimeSlot objects for the given date.
 */
export function computeAvailableSlots(params: AvailabilityParams): TimeSlot[] {
  const {
    date,
    durationMinutes,
    businessHours,
    timezone,
    gcalBusyBlocks,
    existingBookings,
    slotInterval = 15,
  } = params;

  // Determine the day of week for the requested date
  // Parse as a local date in the tenant's timezone
  const [yearStr, monthStr, dayStr] = date.split("-") as [string, string, string];
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed
  const day = parseInt(dayStr, 10);

  // Create a Date object representing midnight in the tenant's timezone
  const localMidnight = new Date(year, month, day, 0, 0, 0, 0);
  const utcMidnight = fromZonedTime(localMidnight, timezone);

  // Get the local date in the tenant's timezone to determine day of week
  const localDate = toZonedTime(utcMidnight, timezone);
  const dayIndex = localDate.getDay(); // 0 = Sunday
  const dayName = DAY_NAMES[dayIndex];

  if (!dayName) {
    return [];
  }

  const dayHours = businessHours[dayName];

  // Business is closed this day
  if (!dayHours?.enabled) {
    return [];
  }

  // Parse open and close times
  const openTime = parseHHMM(dayHours.open);
  const closeTime = parseHHMM(dayHours.close);

  // Build the open and close Date objects in the tenant timezone,
  // then convert to UTC for comparison
  const openLocal = setMilliseconds(
    setSeconds(
      setMinutes(setHours(localDate, openTime.hours), openTime.minutes),
      0
    ),
    0
  );
  const closeLocal = setMilliseconds(
    setSeconds(
      setMinutes(setHours(localDate, closeTime.hours), closeTime.minutes),
      0
    ),
    0
  );

  const openUTC = fromZonedTime(openLocal, timezone);
  const closeUTC = fromZonedTime(closeLocal, timezone);

  // Combine all busy blocks
  const allBusy: BusyBlock[] = [...gcalBusyBlocks, ...existingBookings];

  // Generate slots
  const slots: TimeSlot[] = [];
  const now = new Date();
  // Buffer: don't show slots in the past + 30 min buffer
  const bufferMs = 30 * 60 * 1000;

  let cursor = openUTC;
  while (cursor < closeUTC) {
    const slotEnd = addMinutes(cursor, durationMinutes);

    // Slot must fully fit within business hours
    if (slotEnd > closeUTC) break;

    // Skip slots in the past (with buffer)
    const isPast = cursor.getTime() < Date.now() + bufferMs;

    // Check against all busy blocks
    const isBusy = overlapsAnyBusy(cursor, slotEnd, allBusy);

    slots.push({
      start: cursor.toISOString(),
      end: slotEnd.toISOString(),
      available: !isPast && !isBusy,
    });

    cursor = addMinutes(cursor, slotInterval);
  }

  return slots;
}

/**
 * Format a UTC ISO string for display in a given timezone.
 * Returns e.g. "9:00 AM"
 */
export function formatSlotTime(isoString: string, timezone: string): string {
  const utcDate = parseISO(isoString);
  const localDate = toZonedTime(utcDate, timezone);
  return format(localDate, "h:mm a");
}

/**
 * Format a UTC ISO string as a full date string in a given timezone.
 * Returns e.g. "Monday, January 6"
 */
export function formatSlotDate(isoString: string, timezone: string): string {
  const utcDate = parseISO(isoString);
  const localDate = toZonedTime(utcDate, timezone);
  return format(localDate, "EEEE, MMMM d");
}

/**
 * Get the next N available booking dates starting from today.
 * Used to populate the date picker with valid dates only.
 */
export function getBookableDates(
  businessHours: BusinessHours,
  daysAhead: number = 60
): string[] {
  const dates: string[] = [];
  const today = new Date();

  for (let i = 0; i < daysAhead; i++) {
    const candidate = addMinutes(today, i * 24 * 60);
    const dayIndex = candidate.getDay();
    const dayName = DAY_NAMES[dayIndex];
    if (!dayName) continue;

    const dayHours = businessHours[dayName];
    if (dayHours?.enabled) {
      dates.push(format(candidate, "yyyy-MM-dd"));
    }
  }

  return dates;
}