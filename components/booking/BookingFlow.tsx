// components/booking/BookingFlow.tsx

"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ServicePicker } from "./ServicePicker";
import { SlotPicker } from "./SlotPicker";
import { CustomerForm, type CustomerDetails } from "./CustomerForm";
import { ConfirmationScreen } from "./ConfirmationScreen";
import { submitBooking, type PublicProfile, type SubmitBookingResult } from "@/app/book/[slug]/actions";
import type { Service, TimeSlot } from "@/types";

type Step = "service" | "slot" | "details" | "confirmed";

const STEP_LABELS: Record<Step, string> = {
  service:   "Select service",
  slot:      "Choose a time",
  details:   "Your details",
  confirmed: "Confirmed",
};

const STEP_ORDER: Step[] = ["service", "slot", "details", "confirmed"];

interface BookingFlowProps {
  profile: PublicProfile;
  services: Service[];
  bookableDates: string[];
}

export function BookingFlow({ profile, services, bookableDates }: BookingFlowProps) {
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [confirmation, setConfirmation] = useState<SubmitBookingResult | null>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentStepIndex = STEP_ORDER.indexOf(step);

  function handleServiceSelect(service: Service) {
    setSelectedService(service);
    setSelectedSlot(null); // reset slot if service changes
  }

  function handleSlotSelect(slot: TimeSlot) {
    setSelectedSlot(slot);
  }

  function handleServiceNext() {
    if (!selectedService) {
      toast.error("Select a service to continue.");
      return;
    }
    setStep("slot");
  }

  function handleSlotNext() {
    if (!selectedSlot) {
      toast.error("Select an available time slot to continue.");
      return;
    }
    setStep("details");
  }

  function handleDetailsSubmit(details: CustomerDetails) {
    if (!selectedService || !selectedSlot) return;
    setCustomerDetails(details);

    startTransition(async () => {
      const result = await submitBooking({
        tenantId: profile.id,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        serviceDuration: selectedService.duration,
        customerName: details.name,
        customerEmail: details.email,
        customerPhone: details.phone,
        startAt: selectedSlot.start,
        endAt: selectedSlot.end,
        timezone: profile.timezone,
        businessName: profile.business_name,
        notes: details.notes || undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        // If slot conflict, send them back to pick another slot
        if (result.error.includes("time slot")) {
          setSelectedSlot(null);
          setStep("slot");
        }
        return;
      }

      setConfirmation(result.data);
      setStep("confirmed");
    });
  }

  return (
    <div>
      {/* Step indicator */}
      {step !== "confirmed" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0",
            marginBottom: "28px",
          }}
        >
          {STEP_ORDER.filter((s) => s !== "confirmed").map((s, i, arr) => {
            const idx = STEP_ORDER.indexOf(s);
            const isCurrent = s === step;
            const isComplete = currentStepIndex > idx;

            return (
              <div
                key={s}
                style={{ display: "flex", alignItems: "center", flex: i < arr.length - 1 ? 1 : undefined }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: isComplete
                        ? "var(--accent)"
                        : isCurrent
                        ? "var(--accent-dim)"
                        : "var(--color-surface-1)",
                      border: `1.5px solid ${
                        isComplete || isCurrent ? "var(--accent)" : "var(--color-border)"
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                      flexShrink: 0,
                    }}
                  >
                    {isComplete ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4.5 7.5L8.5 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <span
                        style={{
                          fontSize: "0.625rem",
                          fontWeight: 700,
                          color: isCurrent ? "var(--accent)" : "var(--color-text-muted)",
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        {i + 1}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "0.625rem",
                      fontFamily: "var(--font-sans)",
                      color: isCurrent ? "var(--color-text-primary)" : "var(--color-text-muted)",
                      fontWeight: isCurrent ? 500 : 400,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {STEP_LABELS[s]}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: "1px",
                      background: isComplete ? "var(--accent)" : "var(--color-border)",
                      margin: "0 6px",
                      marginBottom: "14px",
                      transition: "background 0.3s",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Step card */}
      <div
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "24px",
        }}
      >
        {step !== "confirmed" && (
          <h3
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.25rem",
              color: "var(--color-text-primary)",
              marginBottom: "20px",
            }}
          >
            {STEP_LABELS[step]}
          </h3>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
          >
            {step === "service" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <ServicePicker
                  services={services}
                  selected={selectedService}
                  onSelect={handleServiceSelect}
                />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={handleServiceNext}
                    disabled={!selectedService}
                    style={{
                      padding: "9px 20px",
                      background: selectedService ? "var(--accent)" : "var(--color-surface-2)",
                      border: "none",
                      borderRadius: "var(--radius-md)",
                      color: selectedService ? "#fff" : "var(--color-text-muted)",
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.9375rem",
                      fontWeight: 500,
                      cursor: selectedService ? "pointer" : "not-allowed",
                      transition: "all 0.15s",
                    }}
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {step === "slot" && selectedService && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <SlotPicker
                  tenantId={profile.id}
                  durationMinutes={selectedService.duration}
                  businessHours={profile.business_hours}
                  timezone={profile.timezone}
                  bookableDates={bookableDates}
                  selected={selectedSlot}
                  onSelect={handleSlotSelect}
                />
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setStep("service")}
                    style={{
                      padding: "9px 16px",
                      background: "transparent",
                      border: "none",
                      color: "var(--color-text-muted)",
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.875rem",
                      cursor: "pointer",
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSlotNext}
                    disabled={!selectedSlot}
                    style={{
                      padding: "9px 20px",
                      background: selectedSlot ? "var(--accent)" : "var(--color-surface-2)",
                      border: "none",
                      borderRadius: "var(--radius-md)",
                      color: selectedSlot ? "#fff" : "var(--color-text-muted)",
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.9375rem",
                      fontWeight: 500,
                      cursor: selectedSlot ? "pointer" : "not-allowed",
                      transition: "all 0.15s",
                    }}
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {step === "details" && selectedService && selectedSlot && (
              <CustomerForm
                service={selectedService}
                slot={selectedSlot}
                timezone={profile.timezone}
                onSubmit={handleDetailsSubmit}
                onBack={() => setStep("slot")}
                isSubmitting={isPending}
              />
            )}

            {step === "confirmed" && selectedService && selectedSlot && confirmation && customerDetails && (
              <ConfirmationScreen
                service={selectedService}
                slot={selectedSlot}
                timezone={profile.timezone}
                customerName={customerDetails.name}
                customerEmail={customerDetails.email}
                bookingId={confirmation.bookingId}
                businessName={profile.business_name}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}