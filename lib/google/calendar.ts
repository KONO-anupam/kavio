// lib/google/calendar.ts

/**
 * Google Calendar API client factory and helper functions.
 *
 * All functions in this module run server-side only.
 * Never import this in a Client Component.
 */

import { google } from "googleapis";
import { encrypt, decrypt, safeDecrypt } from "@/lib/encryption";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { GoogleTokens } from "@/types";

// ── OAuth2 client factory ─────────────────────────────────────────────────

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Missing Google OAuth2 environment variables. " +
        "Ensure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI are set."
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// ── Authorization URL generation ──────────────────────────────────────────

export function getAuthorizationUrl(state: string): string {
  const oauth2Client = getOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",       // Required to get a refresh_token
    prompt: "consent",            // Force consent screen to always get refresh_token
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    state,                        // CSRF protection — verified in callback
    include_granted_scopes: true,
  });
}

// ── Token exchange ────────────────────────────────────────────────────────

export async function exchangeCodeForTokens(
  code: string
): Promise<GoogleTokens> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error(
      "Google did not return both access_token and refresh_token. " +
        "Ensure the OAuth consent screen is set to prompt=consent and access_type=offline."
    );
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date ?? Date.now() + 3600 * 1000,
    token_type: tokens.token_type ?? "Bearer",
    scope: tokens.scope ?? "",
  };
}

// ── Authenticated Calendar client ─────────────────────────────────────────

/**
 * Build an authenticated Google Calendar client for a given tenant.
 * Reads the encrypted token ref from profiles, decrypts it,
 * sets up the OAuth2 client with auto-refresh, and saves refreshed
 * tokens back to the database.
 */
export async function getCalendarClient(tenantId: string) {
  const supabase = createServiceRoleClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("gcal_token_ref")
    .eq("id", tenantId)
    .single();

  if (error || !profile?.gcal_token_ref) {
    throw new Error(
      "Google Calendar is not connected for this tenant. " +
        "Complete the OAuth2 flow in Settings first."
    );
  }

  const tokensJson = decrypt(profile.gcal_token_ref);
  const tokens = JSON.parse(tokensJson) as GoogleTokens;

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
    token_type: tokens.token_type,
  });

  // Persist refreshed tokens automatically
  oauth2Client.on("tokens", async (newTokens) => {
    const merged: GoogleTokens = {
      ...tokens,
      access_token: newTokens.access_token ?? tokens.access_token,
      expiry_date: newTokens.expiry_date ?? tokens.expiry_date,
      ...(newTokens.refresh_token
        ? { refresh_token: newTokens.refresh_token }
        : {}),
    };

    const encrypted = encrypt(JSON.stringify(merged));
    await supabase
      .from("profiles")
      .update({ gcal_token_ref: encrypted })
      .eq("id", tenantId);
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

// ── Calendar operations ───────────────────────────────────────────────────

/**
 * Fetch busy time blocks from Google Calendar for a date range.
 * Used by the availability engine in Step 5.
 */
export async function getBusyTimes(
  tenantId: string,
  timeMin: Date,
  timeMax: Date,
  calendarId: string = "primary"
): Promise<Array<{ start: string; end: string }>> {
  const calendar = await getCalendarClient(tenantId);

  const { data } = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: calendarId }],
    },
  });

  const calendars = data.calendars;
  if (!calendars) return [];

  const busySlots = calendars[calendarId]?.busy ?? [];

  return busySlots
    .filter(
      (slot): slot is { start: string; end: string } =>
        typeof slot.start === "string" && typeof slot.end === "string"
    );
}

/**
 * Create a Google Calendar event for a confirmed booking.
 * Returns the created event ID.
 */
export async function createCalendarEvent(
  tenantId: string,
  params: {
    summary: string;
    description: string;
    startAt: string;       // ISO 8601
    endAt: string;         // ISO 8601
    attendeeEmail: string;
    timeZone: string;
  }
): Promise<string> {
  const calendar = await getCalendarClient(tenantId);

  const { data } = await calendar.events.insert({
    calendarId: "primary",
    sendUpdates: "all",         // Send invite to attendee
    requestBody: {
      summary: params.summary,
      description: params.description,
      start: {
        dateTime: params.startAt,
        timeZone: params.timeZone,
      },
      end: {
        dateTime: params.endAt,
        timeZone: params.timeZone,
      },
      attendees: [{ email: params.attendeeEmail }],
      status: "confirmed",
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },   // 24 hours before
          { method: "popup", minutes: 30 },
        ],
      },
    },
  });

  if (!data.id) {
    throw new Error("Google Calendar event was created but returned no ID.");
  }

  return data.id;
}

/**
 * Delete a Google Calendar event.
 * Called when a booking is cancelled.
 */
export async function deleteCalendarEvent(
  tenantId: string,
  eventId: string
): Promise<void> {
  const calendar = await getCalendarClient(tenantId);

  await calendar.events.delete({
    calendarId: "primary",
    eventId,
    sendUpdates: "all",
  });
}

// ── Token persistence helpers ─────────────────────────────────────────────

/**
 * Encrypt and store Google tokens for a tenant.
 * Called after the OAuth2 callback completes.
 */
export async function storeTokens(
  tenantId: string,
  tokens: GoogleTokens
): Promise<void> {
  const supabase = createServiceRoleClient();
  const encrypted = encrypt(JSON.stringify(tokens));

  const { error } = await supabase
    .from("profiles")
    .update({ gcal_token_ref: encrypted })
    .eq("id", tenantId);

  if (error) {
    throw new Error(`Failed to store Google tokens: ${error.message}`);
  }
}

/**
 * Check whether a tenant has Google Calendar connected.
 * Does not decrypt — just checks presence of the token ref.
 */
export async function isCalendarConnected(tenantId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { data } = await supabase
    .from("profiles")
    .select("gcal_token_ref")
    .eq("id", tenantId)
    .single();

  return !!data?.gcal_token_ref;
}

/**
 * Revoke and remove Google tokens for a tenant (disconnect flow).
 */
export async function disconnectCalendar(tenantId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  // Fetch current token to revoke with Google
  const { data: profile } = await supabase
    .from("profiles")
    .select("gcal_token_ref")
    .eq("id", tenantId)
    .single();

  if (profile?.gcal_token_ref) {
    const tokensJson = safeDecrypt(profile.gcal_token_ref);
    if (tokensJson) {
      try {
        const tokens = JSON.parse(tokensJson) as GoogleTokens;
        const oauth2Client = getOAuth2Client();
        await oauth2Client.revokeToken(tokens.access_token);
      } catch {
        // Best-effort revocation — continue with DB cleanup regardless
      }
    }
  }

  await supabase
    .from("profiles")
    .update({ gcal_token_ref: null })
    .eq("id", tenantId);
}