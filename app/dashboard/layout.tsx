// app/dashboard/layout.tsx

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import type { TenantMetrics, BusinessHours } from "@/types";

interface DashboardLayoutProps {
  children: React.ReactNode;
  // Next.js 15 allows typed params via this pattern
  params?: Promise<Record<string, string>>;
}

// Determine the page title from the current segment.
// We do this server-side to keep the header a Server Component.
// The Header component receives pageTitle as a prop.
function getPageTitle(pathname: string): string {
  if (pathname.endsWith("/services")) return "Services";
  if (pathname.endsWith("/settings")) return "Settings";
  return "Pipeline";
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const supabase = await createClient();

  // Verify session — middleware already guards this route,
  // but we verify here too for defense-in-depth
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Fetch tenant profile for sidebar + accent color injection
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, business_name, slug, accent_color")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Profile should exist (created by trigger on signup).
    // If somehow missing, redirect to a setup flow.
    redirect("/login?error=profile_missing");
  }

  // Fetch metrics via RPC
  const { data: rawMetrics } = await supabase.rpc("get_tenant_metrics", {
    p_tenant_id: user.id,
  });

  const metrics: TenantMetrics = (rawMetrics as TenantMetrics | null) ?? {
    total_leads: 0,
    booked_count: 0,
    cancelled_count: 0,
    conversion_rate: 0,
    revenue_pipeline: 0,
  };

  return (
    // Inject tenant accent color as CSS custom property at layout level
    <div
      style={
        {
          "--accent": profile.accent_color,
          "--accent-dim": `color-mix(in oklch, ${profile.accent_color} 18%, transparent)`,
          "--accent-border": `color-mix(in oklch, ${profile.accent_color} 35%, transparent)`,
          display: "flex",
          minHeight: "100dvh",
          background: "var(--color-base)",
        } as React.CSSProperties
      }
    >
      <Sidebar
        businessName={profile.business_name}
        slug={profile.slug}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header is a placeholder here — each page passes its own title.
            We use a client component wrapper in Step 3 to get the pathname.
            For now we render the Header with a static title and real metrics. */}
        <DashboardHeader metrics={metrics} />

        <main style={{ flex: 1, padding: "24px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

// Small client boundary just for the header title
// (needs usePathname which requires "use client")
import { DashboardHeader } from "@/components/layout/DashboardHeader";