// email/BookingConfirmation.tsx

/**
 * Customer-facing booking confirmation email.
 * Sent immediately after a successful booking submission.
 *
 * Design: dark background matching the app's design system,
 * accent color injected as an inline style from the tenant's profile.
 * React Email renders this to static HTML — all styles must be inline.
 */

import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export interface BookingConfirmationProps {
  customerName: string;
  businessName: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  startAt: string;       // ISO 8601 UTC
  endAt: string;         // ISO 8601 UTC
  timezone: string;
  accentColor: string;
  bookingId: string;
  bookingPortalUrl: string;
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(iso: string, tz: string): { date: string; time: string } {
  const utcDate = parseISO(iso);
  const localDate = toZonedTime(utcDate, tz);
  return {
    date: format(localDate, "EEEE, MMMM d, yyyy"),
    time: format(localDate, "h:mm a"),
  };
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hour${h > 1 ? "s" : ""}` : `${h} hr ${m} min`;
}

// Colors — must be static strings for email client compatibility
const colors = {
  bg:        "#0A0A0A",
  surface:   "#141414",
  border:    "rgba(255,255,255,0.08)",
  textPrimary:   "#F5F4EF",
  textSecondary: "#a3a3a3",
  textMuted:     "#525252",
};

export function BookingConfirmation({
  customerName,
  businessName,
  serviceName,
  servicePrice,
  serviceDuration,
  startAt,
  endAt,
  timezone,
  accentColor,
  bookingId,
  bookingPortalUrl,
}: BookingConfirmationProps) {
  const { date, time: startTime } = formatDateTime(startAt, timezone);
  const { time: endTime } = formatDateTime(endAt, timezone);

  // Derive a short booking reference from the UUID
  const bookingRef = bookingId.slice(0, 8).toUpperCase();

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Your appointment at {businessName} is confirmed — {date} at {startTime}
      </Preview>

      <Body
        style={{
          backgroundColor: colors.bg,
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          margin: 0,
          padding: "40px 16px",
        }}
      >
        <Container
          style={{
            maxWidth: "520px",
            margin: "0 auto",
          }}
        >
          {/* Header — business name + logo area */}
          <Section style={{ marginBottom: "32px" }}>
            <Row>
              <Column>
                <div
                  style={{
                    display: "inline-block",
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    backgroundColor: `${accentColor}22`,
                    border: `1px solid ${accentColor}44`,
                    textAlign: "center",
                    lineHeight: "32px",
                    marginBottom: "12px",
                  }}
                >
                  <span style={{ color: accentColor, fontSize: "14px", fontWeight: 700 }}>
                    ✦
                  </span>
                </div>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: "13px",
                    margin: 0,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {businessName}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Main card */}
          <Section
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: "16px",
              padding: "32px",
              marginBottom: "16px",
            }}
          >
            {/* Confirmation icon */}
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div
                style={{
                  display: "inline-block",
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: `${accentColor}1a`,
                  border: `1px solid ${accentColor}44`,
                  textAlign: "center",
                  lineHeight: "48px",
                }}
              >
                <span style={{ fontSize: "20px" }}>✓</span>
              </div>
            </div>

            <Heading
              as="h1"
              style={{
                color: colors.textPrimary,
                fontSize: "22px",
                fontWeight: 400,
                textAlign: "center",
                margin: "0 0 8px",
                letterSpacing: "-0.02em",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              Appointment confirmed
            </Heading>

            <Text
              style={{
                color: colors.textSecondary,
                fontSize: "14px",
                textAlign: "center",
                margin: "0 0 28px",
                lineHeight: "1.6",
              }}
            >
              Hello {customerName}, your booking at {businessName} is on the schedule.
            </Text>

            <Hr style={{ borderColor: colors.border, margin: "0 0 24px" }} />

            {/* Booking details table */}
            <table
              style={{ width: "100%", borderCollapse: "collapse" }}
              cellPadding={0}
              cellSpacing={0}
            >
              <tbody>
                {/* Service */}
                <tr>
                  <td
                    style={{
                      color: colors.textMuted,
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      paddingBottom: "12px",
                      width: "40%",
                    }}
                  >
                    Service
                  </td>
                  <td
                    style={{
                      color: colors.textPrimary,
                      fontSize: "14px",
                      fontWeight: 500,
                      paddingBottom: "12px",
                    }}
                  >
                    {serviceName}
                  </td>
                </tr>
                {/* Date */}
                <tr>
                  <td
                    style={{
                      color: colors.textMuted,
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      paddingBottom: "12px",
                    }}
                  >
                    Date
                  </td>
                  <td
                    style={{
                      color: colors.textPrimary,
                      fontSize: "14px",
                      fontWeight: 500,
                      paddingBottom: "12px",
                    }}
                  >
                    {date}
                  </td>
                </tr>
                {/* Time */}
                <tr>
                  <td
                    style={{
                      color: colors.textMuted,
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      paddingBottom: "12px",
                    }}
                  >
                    Time
                  </td>
                  <td
                    style={{
                      color: colors.textPrimary,
                      fontSize: "14px",
                      fontWeight: 500,
                      paddingBottom: "12px",
                    }}
                  >
                    {startTime} – {endTime}
                  </td>
                </tr>
                {/* Duration */}
                <tr>
                  <td
                    style={{
                      color: colors.textMuted,
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      paddingBottom: "12px",
                    }}
                  >
                    Duration
                  </td>
                  <td
                    style={{
                      color: colors.textPrimary,
                      fontSize: "14px",
                      fontWeight: 500,
                      paddingBottom: "12px",
                    }}
                  >
                    {formatDuration(serviceDuration)}
                  </td>
                </tr>
                {/* Price */}
                <tr>
                  <td
                    style={{
                      color: colors.textMuted,
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      paddingBottom: "0",
                    }}
                  >
                    Price
                  </td>
                  <td
                    style={{
                      color: accentColor,
                      fontSize: "16px",
                      fontWeight: 700,
                      paddingBottom: "0",
                    }}
                  >
                    {formatMoney(servicePrice)}
                  </td>
                </tr>
              </tbody>
            </table>

            <Hr style={{ borderColor: colors.border, margin: "24px 0" }} />

            {/* Reference number */}
            <div
              style={{
                backgroundColor: "#1c1c1c",
                border: `1px solid ${colors.border}`,
                borderRadius: "8px",
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                Reference
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: "13px",
                  fontFamily: "monospace",
                  margin: 0,
                  letterSpacing: "0.05em",
                }}
              >
                {bookingRef}
              </Text>
            </div>
          </Section>

          {/* Footer */}
          <Section>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: "12px",
                textAlign: "center",
                margin: "0 0 8px",
                lineHeight: "1.6",
              }}
            >
              Questions? Reply to this email or visit{" "}
              <Link
                href={bookingPortalUrl}
                style={{ color: accentColor, textDecoration: "none" }}
              >
                your booking portal
              </Link>
              .
            </Text>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: "11px",
                textAlign: "center",
                margin: 0,
              }}
            >
              © {new Date().getFullYear()} {businessName}. Powered by Kavio.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default BookingConfirmation;