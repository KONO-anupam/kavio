// app/dashboard/services/page.tsx

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ServiceTable } from "@/components/services/ServiceTable";
import type { Service } from "@/types";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect("/login");

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("tenant_id", user.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[services/page] Fetch error:", error.message);
  }

  const services: Service[] = data ?? [];

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h2
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "1.625rem",
            color: "var(--color-text-primary)",
            marginBottom: "6px",
          }}
        >
          Service catalog
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          Services listed here appear on your public booking portal. Inactive services are hidden from customers.
        </p>
      </div>

      <ServiceTable initialServices={services} />
    </div>
  );
}