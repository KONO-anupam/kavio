// components/layout/Header.tsx

import type { TenantMetrics } from "@/types";

interface MetricProps {
  label: string;
  value: string | number;
  sub?: string;
}

function Metric({ label, value, sub }: MetricProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1px",
        padding: "0 20px",
        borderRight: "1px solid var(--color-border)",
      }}
    >
      <p
        style={{
          fontSize: "0.6875rem",
          color: "var(--color-text-muted)",
          fontFamily: "var(--font-sans)",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          fontWeight: 500,
        }}
      >
        {label}
      </p>
      <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
        <span
          style={{
            fontSize: "1.25rem",
            fontFamily: "var(--font-serif)",
            color: "var(--color-text-primary)",
            lineHeight: 1.2,
          }}
        >
          {value}
        </span>
        {sub && (
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

interface HeaderProps {
  metrics: TenantMetrics;
  pageTitle: string;
}

export function Header({ metrics, pageTitle }: HeaderProps) {
  const formattedRevenue =
    metrics.revenue_pipeline >= 1000
      ? `$${(metrics.revenue_pipeline / 1000).toFixed(1)}k`
      : `$${metrics.revenue_pipeline.toFixed(0)}`;

  return (
    <header
      style={{
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-base-950)",
        display: "flex",
        alignItems: "center",
        height: "56px",
        paddingLeft: "24px",
        position: "sticky",
        top: 0,
        zIndex: 40,
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Page title */}
      <h4
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "0.9375rem",
          fontWeight: 500,
          color: "var(--color-text-primary)",
          paddingRight: "20px",
          borderRight: "1px solid var(--color-border)",
          marginRight: "0",
          whiteSpace: "nowrap",
        }}
      >
        {pageTitle}
      </h4>

      {/* Metrics strip */}
      <div style={{ display: "flex", alignItems: "center", overflow: "auto" }}>
        <Metric
          label="Leads this month"
          value={metrics.total_leads}
        />
        <Metric
          label="Conversion"
          value={`${metrics.conversion_rate}%`}
          sub={`${metrics.booked_count} booked`}
        />
        <Metric
          label="Revenue pipeline"
          value={formattedRevenue}
          sub="booked"
        />
      </div>
    </header>
  );
}