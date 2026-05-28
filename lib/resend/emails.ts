// lib/resend/emails.ts

/**
 * Typed email dispatch functions.
 * Thin layer over sendEmail() that imports the templates and
 * provides a clean interface for callers in server actions.
 */

import React from "react";
import { sendEmail, type SendEmailResult } from "./client";
import { BookingConfirmation, type BookingConfirmationProps } from "@/emails/BookingConfirmation";
import { LeadNotification, type LeadNotificationProps } from "@/emails/LeadNotification";

export async function sendBookingConfirmation(
  props: BookingConfirmationProps & { to: string }
): Promise<SendEmailResult> {
  const { to, ...templateProps } = props;
  return sendEmail({
    to,
    subject: `Appointment confirmed — ${props.businessName}`,
    template: React.createElement(BookingConfirmation, templateProps),
  });
}

export async function sendLeadNotification(
  props: LeadNotificationProps & { to: string }
): Promise<SendEmailResult> {
  const { to, ...templateProps } = props;
  return sendEmail({
    to,
    subject: `New booking: ${props.customerName} — ${props.serviceName}`,
    template: React.createElement(LeadNotification, templateProps),
    replyTo: props.customerEmail,
  });
}