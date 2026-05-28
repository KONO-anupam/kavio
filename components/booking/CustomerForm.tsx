// components/booking/CustomerForm.tsx

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatSlotTime, formatSlotDate } from "@/lib/availability";
import type { TimeSlot, Service } from "@/types";

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

interface CustomerFormProps {
  service: Service;
  slot: TimeSlot;
  timezone: string;
  onSubmit: (details: CustomerDetails) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function CustomerForm({
  service,
  slot,
  timezone,
  onSubmit,
  onBack,
  isSubmitting,
}: CustomerFormProps) {
  const [details, setDetails] = useState<CustomerDetails>({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<CustomerDetails>>({});

  function validate(): boolean {
    const next: Partial<CustomerDetails> = {};
    if (!details.name.trim()) next.name = "Your name is required.";
    if (!details.email.trim()) {
      next.email = "Your email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
      next.email = "Enter a valid email address.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) {
      onSubmit(details);
    }
  }

  const formattedDate = formatSlotDate(slot.start, timezone);
  const formattedTime = formatSlotTime(slot.start, timezone);
  const formattedEnd = formatSlotTime(slot.end, timezone);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Booking summary */}
      <div
        style={{
          padding: "14px 16px",
          background: "var(--accent-dim)",
          border: "1px solid var(--accent-border)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", fontFamily: "var(--font-sans)", marginBottom: "4px" }}>
          Confirming
        </p>
        <p style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--color-text-primary)", fontFamily: "var(--font-sans)", marginBottom: "2px" }}>
          {service.name}
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>
          {formattedDate} · {formattedTime} – {formattedEnd}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <Input
          label="Full name"
          type="text"
          autoComplete="name"
          placeholder="Jane Smith"
          value={details.name}
          onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
          error={errors.name}
          required
        />
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="jane@example.com"
          value={details.email}
          onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))}
          error={errors.email}
          required
        />
        <Input
          label="Phone number"
          type="tel"
          autoComplete="tel"
          placeholder="+1 (555) 000-0000"
          value={details.phone}
          onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))}
          hint="Optional — used for appointment reminders only."
        />

        {/* Notes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontFamily: "var(--font-sans)", fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>
            Notes
            <span style={{ color: "var(--color-text-muted)", fontWeight: 400, marginLeft: "6px" }}>optional</span>
          </label>
          <textarea
            placeholder="Anything the business should know before your appointment"
            value={details.notes}
            onChange={(e) => setDetails((d) => ({ ...d, notes: e.target.value }))}
            rows={3}
            style={{
              background: "var(--color-base-800)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-sans)",
              fontSize: "0.9375rem",
              padding: "8px 12px",
              resize: "vertical",
              outline: "none",
              lineHeight: 1.5,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
          <Button type="button" variant="ghost" onClick={onBack} disabled={isSubmitting}>
            Back
          </Button>
          <Button type="submit" variant="accent" fullWidth loading={isSubmitting}>
            Confirm appointment
          </Button>
        </div>
      </form>
    </div>
  );
}