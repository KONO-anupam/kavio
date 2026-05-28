// components/services/ServiceForm.tsx

"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createService, updateService } from "@/app/dashboard/settings/actions";
import type { Service } from "@/types";

interface ServiceFormProps {
  service?: Service;             // Present = edit mode, absent = create mode
  onSuccess: (service: Service) => void;
  onCancel: () => void;
}

export function ServiceForm({ service, onSuccess, onCancel }: ServiceFormProps) {
  const isEdit = !!service;
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = isEdit
        ? await updateService(service.id, formData)
        : await createService(formData);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        isEdit ? "Service details updated" : "Service added to catalog"
      );
      onSuccess(result.data);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        background: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)",
        padding: "24px",
      }}
    >
      <h4
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "0.9375rem",
          fontWeight: 600,
          color: "var(--color-text-primary)",
          marginBottom: "20px",
        }}
      >
        {isEdit ? "Edit service" : "New service"}
      </h4>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <Input
            label="Service name"
            name="name"
            type="text"
            placeholder="e.g. Deep Tissue Massage"
            defaultValue={service?.name ?? ""}
            required
            error={errors["name"]}
          />

          {/* Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="description"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "var(--color-text-secondary)",
              }}
            >
              Description
              <span
                style={{ color: "var(--color-text-muted)", fontWeight: 400, marginLeft: "6px" }}
              >
                optional
              </span>
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Brief description visible on the booking portal"
              defaultValue={service?.description ?? ""}
              rows={2}
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
                minHeight: "64px",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Input
              label="Duration (minutes)"
              name="duration"
              type="number"
              min="5"
              step="5"
              placeholder="60"
              defaultValue={service?.duration?.toString() ?? ""}
              required
              error={errors["duration"]}
            />
            <Input
              label="Price (USD)"
              name="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              defaultValue={service?.price?.toString() ?? ""}
              required
              error={errors["price"]}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "flex-end",
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" variant="accent" loading={isPending}>
            {isEdit ? "Save changes" : "Add service"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}