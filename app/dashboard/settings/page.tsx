// app/dashboard/settings/page.tsx

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { SearchParams } from "next/dist/server/request/search-params";
import { createClient } from "@/lib/supabase/server";
import { isCalendarConnected } from "@/lib/google/calendar";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { CalendarConnection } from "@/components/settings/CalenderConnection";
import type { Profile } from "@/types";

export const metadata: Metadata = { title: "Settings" };

interface SettingsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, business_name, slug, accent_color, timezone, business_hours")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login?error=profile_missing");

  const calendarConnected = await isCalendarConnected(user.id);

  // Read OAuth result from query params (set by callback route)
  const gcalConnected = params["gcal_connected"] === "1";
  const gcalError = typeof params["gcal_error"] === "string"
    ? params["gcal_error"]
    : undefined;

  const gcalErrorMessages: Record<string, string> = {
    access_denied:        "Calendar access was denied. You can reconnect at any time.",
    state_mismatch:       "Security check failed. Please try connecting again.",
    session_invalid:      "Your session expired during the OAuth flow. Sign in and retry.",
    token_exchange_failed:"Google returned an error during token exchange. Please try again.",
    missing_params:       "The OAuth callback was missing required parameters.",
  };

  return (
    <div style={{ maxWidth: "620px", display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Page heading */}
      <div>
        <h2
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "1.625rem",
            color: "var(--color-text-primary)",
            marginBottom: "6px",
          }}
        >
          Account settings
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          Manage your business profile and integrations.
        </p>
      </div>

      {/* OAuth feedback banners */}
      {gcalConnected && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            background: "color-mix(in oklch, var(--color-booked) 10%, transparent)",
            border: "1px solid color-mix(in oklch, var(--color-booked) 25%, transparent)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="var(--color-booked)" strokeWidth="1.25" />
            <path d="M5 8L7 10L11 6" stroke="var(--color-booked)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p style={{ fontSize: "0.875rem", color: "var(--color-booked)", fontFamily: "var(--font-sans)" }}>
            Google Calendar connected successfully.
          </p>
        </div>
      )}

      {gcalError && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            background: "color-mix(in oklch, #ef4444 10%, transparent)",
            border: "1px solid color-mix(in oklch, #ef4444 25%, transparent)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="#f87171" strokeWidth="1.25" />
            <path d="M8 5V8.5M8 11H8.01" stroke="#f87171" strokeWidth="1.25" strokeLinecap="round" />
          </svg>
          <p style={{ fontSize: "0.875rem", color: "#f87171", fontFamily: "var(--font-sans)" }}>
            {gcalErrorMessages[gcalError] ?? "An error occurred during calendar connection."}
          </p>
        </div>
      )}

      {/* Business profile form */}
      <section>
        <h4 style={{ marginBottom: "16px", color: "var(--color-text-secondary)" }}>
          Business profile
        </h4>
        <SettingsForm profile={profile as Profile} />
      </section>

      <div style={{ height: "1px", background: "var(--color-border)" }} />

      {/* Google Calendar integration */}
      <section>
        <h4 style={{ marginBottom: "6px", color: "var(--color-text-secondary)" }}>
          Google Calendar
        </h4>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-text-muted)",
            marginBottom: "16px",
          }}
        >
          When connected, new bookings automatically create calendar events and availability is computed from your calendar&apos;s busy times.
        </p>
        <CalendarConnection isConnected={calendarConnected} />
      </section>

      <div style={{ height: "1px", background: "var(--color-border)" }} />

      {/* Booking portal link */}
      <section>
        <h4 style={{ marginBottom: "6px", color: "var(--color-text-secondary)" }}>
          Public booking portal
        </h4>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            background: "var(--color-surface-1)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <code
            style={{
              flex: 1,
              fontSize: "0.8125rem",
              color: "var(--color-text-secondary)",
              fontFamily: "monospace",
            }}
          >
            {process.env.NEXT_PUBLIC_APP_URL }/book/{profile.slug}
          </code>
          <a
            href={`/book/${profile.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "0.8125rem",
              color: "var(--accent)",
              textDecoration: "none",
              fontFamily: "var(--font-sans)",
              flexShrink: 0,
            }}
          >
            Open ↗
          </a>
        </div>
      </section>
    </div>
  );
}