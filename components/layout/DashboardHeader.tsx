// components/layout/DashboardHeader.tsx

"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import type { TenantMetrics } from "@/types";

function resolvePageTitle(pathname: string): string {
  if (pathname.startsWith("/dashboard/services")) return "Services";
  if (pathname.startsWith("/dashboard/settings")) return "Settings";
  return "Pipeline";
}

interface DashboardHeaderProps {
  metrics: TenantMetrics;
}

export function DashboardHeader({ metrics }: DashboardHeaderProps) {
  const pathname = usePathname();
  const pageTitle = resolvePageTitle(pathname);

  return <Header metrics={metrics} pageTitle={pageTitle} />;
}