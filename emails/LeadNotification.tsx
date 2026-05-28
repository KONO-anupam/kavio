// email/LeadNotification.tsx

/**
 * Business owner lead notification email.
 * Sent to the tenant immediately after a new booking is submitted.
 * Action-oriented — shows all customer details and a direct link
 * to the dashboard pipeline.
 */

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export interface LeadNotificationProps {
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  businessName: string;
  serviceName: string;
  servicePrice: number;
  startAt: string;
  endAt: string;
  timezone: string;
  accentColor: string;
  dashboardUrl: string;
  notes: string | null;
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(iso: string, tz: string): string {
  const localDate = toZonedTime(parseISO(iso), tz);
  return format(localDate, "EEE, MMM d 'at' h:mm a");
}

const colors = {
  bg:            "#0A0A0A",
  surface:       "#141414",
  surfaceAlt:    "#1c1c1c",
  border:        "rgba(255,255,255,0.08)",
  textPrimary:   "#F5F4EF",
  textSecondary: "#a3a3a3",
  textMuted:     "#525252",
  new:           "#3b82f6",
};

export function LeadNotification({
  customerName,
  customerEmail,
  customerPhone,
  businessName,
  serviceName,
  servicePrice,
  startAt,
  endAt,
  timezone,
  accentColor,
  dashboardUrl,
  notes,
}: LeadNotificationProps) {
  const formattedStart = formatDateTime(startAt, timezone);
  const formattedEnd = formatDateTime(endAt, timezone);

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        New lead: {customerName} booked {serviceName} — {formattedStart}
      </Preview>

      <Body
        style={{
          backgroundColor: colors.bg,
          fontFamily:
            "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          margin: 0,
          padding: "40px 16px",
        }}
      >
        <Container style={{ maxWidth: "520px", margin: "0 auto" }}>

          {/* Header */}
          <Section style={{ marginBottom: "24px" }}>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: "12px",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                fontWeight: 600,
                margin: "0 0 4px",
              }}
            >
              {businessName}
            </Text>
            <Heading
              as="h1"
              style={{
                color: colors.textPrimary,
                fontSize: "20px",
                fontWeight: 400,
                margin: 0,
                letterSpacing: "-0.02em",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              New booking request
            </Heading>
          </Section>

          {/* Status badge */}
          <Section style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: "10px",
                backgroundColor: `${colors.new}1a`,
                border: `1px solid ${colors.new}44`,
              }}
            >
              <Text
                style={{
                  color: colors.new,
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  margin: 0,
                }}
              >
                New — awaiting review
              </Text>
            </div>
          </Section>

          {/* Main card */}
          <Section
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: "16px",
              overflow: "hidden",
              marginBottom: "16px",
            }}
          >
            {/* Customer block */}
            <div style={{ padding: "24px 24px 0" }}>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  margin: "0 0 12px",
                }}
              >
                Customer
              </Text>

              <table style={{ width: "100%", borderCollapse: "collapse" }} cellPadding={0} cellSpacing={0}>
                <tbody>
                  <tr>
                    <td style={{ color: colors.textMuted, fontSize: "12px", paddingBottom: "8px", width: "30%" }}>
                      Name
                    </td>
                    <td style={{ color: colors.textPrimary, fontSize: "14px", fontWeight: 500, paddingBottom: "8px" }}>
                      {customerName}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: colors.textMuted, fontSize: "12px", paddingBottom: "8px" }}>
                      Email
                    </td>
                    <td style={{ fontSize: "14px", paddingBottom: "8px" }}>
                      <Link
                        href={`mailto:${customerEmail}`}
                        style={{ color: accentColor, textDecoration: "none" }}
                      >
                        {customerEmail}
                      </Link>
                    </td>
                  </tr>
                  {customerPhone && (
                    <tr>
                      <td style={{ color: colors.textMuted, fontSize: "12px", paddingBottom: "8px" }}>
                        Phone
                      </td>
                      <td style={{ fontSize: "14px", paddingBottom: "8px" }}>
                        <Link
                          href={`tel:${customerPhone}`}
                          style={{ color: accentColor, textDecoration: "none" }}
                        >
                          {customerPhone}
                        </Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Hr style={{ borderColor: colors.border, margin: "20px 0" }} />

            {/* Appointment block */}
            <div style={{ padding: "0 24px" }}>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  margin: "0 0 12px",
                }}
              >
                Appointment
              </Text>

              <table style={{ width: "100%", borderCollapse: "collapse" }} cellPadding={0} cellSpacing={0}>
                <tbody>
                  <tr>
                    <td style={{ color: colors.textMuted, fontSize: "12px", paddingBottom: "8px", width: "30%" }}>
                      Service
                    </td>
                    <td style={{ color: colors.textPrimary, fontSize: "14px", fontWeight: 500, paddingBottom: "8px" }}>
                      {serviceName}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: colors.textMuted, fontSize: "12px", paddingBottom: "8px" }}>
                      Starts
                    </td>
                    <td style={{ color: colors.textPrimary, fontSize: "14px", fontWeight: 500, paddingBottom: "8px" }}>
                      {formattedStart}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: colors.textMuted, fontSize: "12px", paddingBottom: "8px" }}>
                      Ends
                    </td>
                    <td style={{ color: colors.textSecondary, fontSize: "14px", paddingBottom: "8px" }}>
                      {formattedEnd}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: colors.textMuted, fontSize: "12px", paddingBottom: "0" }}>
                      Value
                    </td>
                    <td
                      style={{
                        color: accentColor,
                        fontSize: "15px",
                        fontWeight: 700,
                        paddingBottom: "0",
                      }}
                    >
                      {formatMoney(servicePrice)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Notes block — only rendered if notes present */}
            {notes && (
              <>
                <Hr style={{ borderColor: colors.border, margin: "20px 0" }} />
                <div style={{ padding: "0 24px 24px" }}>
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: "11px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      margin: "0 0 8px",
                    }}
                  >
                    Customer notes
                  </Text>
                  <div
                    style={{
                      backgroundColor: colors.surfaceAlt,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "8px",
                      padding: "12px",
                    }}
                  >
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: "13px",
                        margin: 0,
                        lineHeight: "1.6",
                        fontStyle: "italic",
                      }}
                    >
                      &ldquo;{notes}&rdquo;
                    </Text>
                  </div>
                </div>
              </>
            )}

            {/* CTA */}
            <div
              style={{
                padding: "20px 24px",
                backgroundColor: colors.surfaceAlt,
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: "12px",
                  margin: "0 0 12px",
                }}
              >
                Move this lead to <strong style={{ color: colors.textSecondary }}>Contacted</strong> once you have reached out, then to <strong style={{ color: colors.textSecondary }}>Booked</strong> when confirmed.
              </Text>
              <Link
                href={dashboardUrl}
                style={{
                  display: "inline-block",
                  backgroundColor: accentColor,
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 600,
                  padding: "10px 20px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  letterSpacing: "0.01em",
                }}
              >
                Open pipeline →
              </Link>
            </div>
          </Section>

          {/* Footer */}
          <Section>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: "11px",
                textAlign: "center",
                margin: 0,
                lineHeight: "1.6",
              }}
            >
              This notification was sent by Kavio on behalf of {businessName}.
              <br />
              Manage notification preferences in your{" "}
              <Link href={`${dashboardUrl}/settings`} style={{ color: colors.textMuted }}>
                account settings
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default LeadNotification;