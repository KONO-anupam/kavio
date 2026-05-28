// app/book/[slug]/page.tsx

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicProfile, getActiveServices } from "./actions";
import { getBookableDates } from "@/lib/availability";
import { BookingFlow } from "@/components/booking/BookingFlow";

interface BookingPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BookingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicProfile(slug);
  if (!result.success) return { title: "Book an Appointment" };
  return {
    title: `Book — ${result.data.business_name}`,
    description: `Schedule an appointment with ${result.data.business_name}`,
  };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params;

  const profileResult = await getPublicProfile(slug);
  if (!profileResult.success) notFound();

  const profile = profileResult.data;

  const servicesResult = await getActiveServices(profile.id);
  const services = servicesResult.success ? servicesResult.data : [];

  // Pre-compute bookable dates server-side to avoid a round-trip on first render
  const bookableDates = getBookableDates(profile.business_hours, 60);

  return (
    // Inject tenant accent color for the public portal
    <div
      style={
        {
          "--accent": profile.accent_color,
          "--accent-dim": `color-mix(in oklch, ${profile.accent_color} 18%, transparent)`,
          "--accent-border": `color-mix(in oklch, ${profile.accent_color} 35%, transparent)`,
          minHeight: "100dvh",
          background: "var(--color-base)",
          display: "flex",
          flexDirection: "column",
        } as React.CSSProperties
      }
    >
      {/* Background grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-base-50) 1px, transparent 1px), linear-gradient(90deg, var(--color-base-50) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Portal header */}
      <header
        style={{
          borderBottom: "1px solid var(--color-border)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "rgba(10,10,10,0.8)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: "26px",
            height: "26px",
            borderRadius: "6px",
            background: "var(--accent-dim)",
            border: "1px solid var(--accent-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="1" width="4" height="4" rx="1" fill="var(--accent)" />
            <rect x="7" y="1" width="4" height="4" rx="1" fill="var(--accent)" opacity="0.5" />
            <rect x="1" y="7" width="4" height="4" rx="1" fill="var(--accent)" opacity="0.5" />
            <rect x="7" y="7" width="4" height="4" rx="1" fill="var(--accent)" />
          </svg>
        </div>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.9375rem",
            fontWeight: 500,
            color: "var(--color-text-primary)",
          }}
        >
          {profile.business_name}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "0.75rem",
            color: "var(--color-text-muted)",
            fontFamily: "var(--font-sans)",
          }}
        >
          Secure booking
        </span>
      </header>

      {/* Main booking flow */}
      <main
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          padding: "32px 16px 64px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ width: "100%", maxWidth: "480px" }}>
          <BookingFlow
            profile={profile}
            services={services}
            bookableDates={bookableDates}
          />
        </div>
      </main>
    </div>
  );
}