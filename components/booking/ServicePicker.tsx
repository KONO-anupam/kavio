// components/booking/ServicePicker.tsx

"use client";

import { motion } from "framer-motion";
import type { Service } from "@/types";

interface ServicePickerProps {
  services: Service[];
  selected: Service | null;
  onSelect: (service: Service) => void;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export function ServicePicker({ services, selected, onSelect }: ServicePickerProps) {
  if (services.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "48px 24px",
          color: "var(--color-text-muted)",
          fontFamily: "var(--font-sans)",
          fontSize: "0.875rem",
        }}
      >
        No services are currently available for booking.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {services.map((service, i) => {
        const isSelected = selected?.id === service.id;

        return (
          <motion.button
            key={service.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
            onClick={() => onSelect(service)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              padding: "14px 16px",
              background: isSelected ? "var(--accent-dim)" : "transparent",
              border: `1px solid ${isSelected ? "var(--accent-border)" : "var(--color-border)"}`,
              borderRadius: "var(--radius-lg)",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              transition: "all 0.15s",
            }}
          >
            {/* Selection indicator */}
            <div
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--color-border)"}`,
                background: isSelected ? "var(--accent)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              {isSelected && (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4L3.5 6L6.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>

            {/* Service info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                  marginBottom: service.description ? "3px" : 0,
                }}
              >
                {service.name}
              </p>
              {service.description && (
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {service.description}
                </p>
              )}
            </div>

            {/* Duration + Price */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                }}
              >
                {formatPrice(service.price)}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                {formatDuration(service.duration)}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
