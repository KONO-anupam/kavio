// components/settings/SettingsForm.tsx

"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateProfile } from "@/app/dashboard/settings/actions";
import type { Profile } from "@/types";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Kolkata",
  "Australia/Sydney",
];

interface SettingsFormProps {
  profile: Profile;
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const [accentColor, setAccentColor] = useState(profile.accent_color);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Inject the color picker value (not a text input, needs explicit append)
    formData.set("accent_color", accentColor);

    startTransition(async () => {
      const result = await updateProfile(formData);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Profile updated");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "var(--color-surface-1)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <Input
        label="Business name"
        name="business_name"
        type="text"
        defaultValue={profile.business_name}
        placeholder="Acme Consulting"
        required
      />

      <Input
        label="Booking URL slug"
        name="slug"
        type="text"
        defaultValue={profile.slug}
        placeholder="acme-consulting"
        hint="Used in your public booking URL. Lowercase letters, numbers, and hyphens only."
        required
      />

      {/* Timezone */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label
          htmlFor="timezone"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.8125rem",
            fontWeight: 500,
            color: "var(--color-text-secondary)",
          }}
        >
          Timezone
        </label>
        <select
          id="timezone"
          name="timezone"
          defaultValue={profile.timezone}
          style={{
            height: "36px",
            padding: "0 12px",
            background: "var(--color-base-800)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-text-primary)",
            fontFamily: "var(--font-sans)",
            fontSize: "0.9375rem",
            outline: "none",
            cursor: "pointer",
          }}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Accent color */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.8125rem",
            fontWeight: 500,
            color: "var(--color-text-secondary)",
          }}
        >
          Brand accent color
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            style={{
              width: "36px",
              height: "36px",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              background: "var(--color-base-800)",
              cursor: "pointer",
              padding: "2px",
            }}
          />
          <input
            type="text"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            maxLength={7}
            style={{
              height: "36px",
              width: "100px",
              padding: "0 12px",
              background: "var(--color-base-800)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text-primary)",
              fontFamily: "monospace",
              fontSize: "0.875rem",
              outline: "none",
            }}
          />
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            Applied across buttons, highlights, and your booking portal
          </span>
        </div>
      </div>

      <div
        style={{
          paddingTop: "12px",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button type="submit" variant="accent" loading={isPending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}