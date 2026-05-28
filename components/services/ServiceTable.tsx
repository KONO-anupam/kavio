// components/services/ServiceTable.tsx

"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ServiceForm } from "./ServiceForm";
import { toggleServiceActive, deleteService } from "@/app/dashboard/settings/actions";
import type { Service } from "@/types";

interface ServiceTableProps {
  initialServices: Service[];
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function ServiceTable({ initialServices }: ServiceTableProps) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFormSuccess(saved: Service) {
    setServices((prev) => {
      const exists = prev.findIndex((s) => s.id === saved.id);
      if (exists >= 0) {
        const next = [...prev];
        next[exists] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setShowForm(false);
    setEditingService(null);
  }

  function handleToggleActive(service: Service) {
    const next = !service.is_active;
    // Optimistic update
    setServices((prev) =>
      prev.map((s) => (s.id === service.id ? { ...s, is_active: next } : s))
    );
    startTransition(async () => {
      const result = await toggleServiceActive(service.id, next);
      if (!result.success) {
        // Revert
        setServices((prev) =>
          prev.map((s) =>
            s.id === service.id ? { ...s, is_active: !next } : s
          )
        );
        toast.error(result.error);
      } else {
        toast.success(
          next ? "Service activated" : "Service deactivated"
        );
      }
    });
  }

  function handleDelete(service: Service) {
    startTransition(async () => {
      const result = await deleteService(service.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setServices((prev) => prev.filter((s) => s.id !== service.id));
      toast.success("Service removed");
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-text-muted)",
            }}
          >
            {services.length} service{services.length !== 1 ? "s" : ""} in catalog
          </p>
        </div>
        {!showForm && !editingService && (
          <Button
            variant="accent"
            size="sm"
            onClick={() => setShowForm(true)}
            icon={
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
          >
            Add service
          </Button>
        )}
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <ServiceForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Table */}
      {services.length === 0 && !showForm ? (
        <div
          style={{
            textAlign: "center",
            padding: "64px 24px",
            background: "var(--color-surface-1)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.25rem",
              color: "var(--color-text-secondary)",
              marginBottom: "8px",
            }}
          >
            No services on record
          </p>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
              marginBottom: "20px",
            }}
          >
            Add your first service to make the booking portal available to customers.
          </p>
          <Button variant="accent" onClick={() => setShowForm(true)}>
            Add first service
          </Button>
        </div>
      ) : (
        <div
          style={{
            background: "var(--color-surface-1)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 80px 80px 120px",
              padding: "10px 16px",
              borderBottom: "1px solid var(--color-border)",
              background: "var(--color-surface-2)",
            }}
          >
            {["Service", "Duration", "Price", "Status", ""].map((col) => (
              <span
                key={col}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                }}
              >
                {col}
              </span>
            ))}
          </div>

          {/* Rows */}
          <AnimatePresence initial={false}>
            {services.map((service, i) => (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* Edit form inline */}
                {editingService?.id === service.id ? (
                  <div style={{ padding: "12px 16px", borderBottom: i < services.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                    <ServiceForm
                      service={service}
                      onSuccess={handleFormSuccess}
                      onCancel={() => setEditingService(null)}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 80px 80px 80px 120px",
                      padding: "12px 16px",
                      borderBottom:
                        i < services.length - 1
                          ? "1px solid var(--color-border)"
                          : "none",
                      alignItems: "center",
                      opacity: service.is_active ? 1 : 0.5,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {/* Name + description */}
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          color: "var(--color-text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {service.name}
                      </p>
                      {service.description && (
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--color-text-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginTop: "1px",
                          }}
                        >
                          {service.description}
                        </p>
                      )}
                    </div>

                    <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                      {formatDuration(service.duration)}
                    </span>

                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {formatPrice(service.price)}
                    </span>

                    {/* Active toggle */}
                    <div>
                      <button
                        onClick={() => handleToggleActive(service)}
                        disabled={isPending}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "3px 8px",
                          borderRadius: "10px",
                          border: "1px solid",
                          background: "transparent",
                          cursor: "pointer",
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          color: service.is_active
                            ? "var(--color-booked)"
                            : "var(--color-text-muted)",
                          borderColor: service.is_active
                            ? "color-mix(in oklch, var(--color-booked) 30%, transparent)"
                            : "var(--color-border)",
                          transition: "all 0.15s",
                        }}
                      >
                        <div
                          style={{
                            width: "5px",
                            height: "5px",
                            borderRadius: "50%",
                            background: service.is_active
                              ? "var(--color-booked)"
                              : "var(--color-text-muted)",
                          }}
                        />
                        {service.is_active ? "Active" : "Inactive"}
                      </button>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingService(service)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(service)}
                        loading={isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}