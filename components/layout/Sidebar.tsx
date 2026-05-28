// components/layout/Sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { signOut } from "@/app/(auth)/login/actions";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Pipeline",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.25" />
        <rect x="9.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.25" />
        <rect x="1.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.25" />
        <rect x="9.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.25" />
      </svg>
    ),
  },
  {
    href: "/dashboard/services",
    label: "Services",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5L10 5.5H14.5L11 8.5L12.5 12.5L8 10L3.5 12.5L5 8.5L1.5 5.5H6L8 1.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.25" />
        <path d="M8 1.5V3M8 13V14.5M1.5 8H3M13 8H14.5M3.1 3.1L4.2 4.2M11.8 11.8L12.9 12.9M12.9 3.1L11.8 4.2M4.2 11.8L3.1 12.9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
  },
];

interface SidebarProps {
  businessName: string;
  slug: string;
}

export function Sidebar({ businessName, slug }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: "216px",
        flexShrink: 0,
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        position: "sticky",
        top: 0,
        background: "var(--color-base-950)",
      }}
    >
      {/* Wordmark */}
      <div
        style={{
          padding: "20px 16px 0",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "var(--radius-sm)",
              background: "var(--accent-dim)",
              border: "1px solid var(--accent-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="var(--accent)" />
              <rect x="8" y="1" width="5" height="5" rx="1" fill="var(--accent)" opacity="0.5" />
              <rect x="1" y="8" width="5" height="5" rx="1" fill="var(--accent)" opacity="0.5" />
              <rect x="8" y="8" width="5" height="5" rx="1" fill="var(--accent)" />
            </svg>
          </div>
          <div>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                lineHeight: 1.2,
                maxWidth: "140px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {businessName || "Your Business"}
            </p>
            <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", lineHeight: 1.2 }}>
              /{slug}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "2px" }}>
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <motion.div
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  padding: "7px 10px",
                  borderRadius: "var(--radius-md)",
                  background: isActive ? "var(--color-surface-2)" : "transparent",
                  border: isActive ? "1px solid var(--color-border)" : "1px solid transparent",
                  color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.875rem",
                  fontWeight: isActive ? 500 : 400,
                  cursor: "pointer",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {item.icon}
                {item.label}
                {isActive && (
                  <div
                    style={{
                      marginLeft: "auto",
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      background: "var(--accent)",
                    }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Booking portal link */}
      <div
        style={{
          padding: "12px 8px",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <a
          href={`/book/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            padding: "7px 10px",
            borderRadius: "var(--radius-md)",
            color: "var(--color-text-muted)",
            fontFamily: "var(--font-sans)",
            fontSize: "0.8125rem",
            textDecoration: "none",
            transition: "color 0.15s",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M6 2.5H2.5A1 1 0 0 0 1.5 3.5V11.5A1 1 0 0 0 2.5 12.5H10.5A1 1 0 0 0 11.5 11.5V8M8.5 1.5H12.5M12.5 1.5V5.5M12.5 1.5L6 8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          View booking portal
        </a>

        {/* Sign out */}
        <form action={signOut}>
          <button
            type="submit"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding: "7px 10px",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text-muted)",
              fontFamily: "var(--font-sans)",
              fontSize: "0.8125rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              width: "100%",
              transition: "color 0.15s",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2.5H2.5A1 1 0 0 0 1.5 3.5V10.5A1 1 0 0 0 2.5 11.5H5M9.5 9.5L12.5 7L9.5 4.5M12.5 7H5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}