// lib/resend/client.ts

/**
 * Resend client singleton and email dispatch helpers.
 *
 * All functions are server-only — never import in Client Components.
 * The Resend API key is only read server-side; it is never exposed to the browser.
 */

import { Resend } from "resend";
import { render } from "@react-email/render";
import type { ReactElement } from "react";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (_resend) return _resend;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY environment variable is not set. " +
        "Get your key at resend.com and add it to .env.local."
    );
  }

  _resend = new Resend(apiKey);
  return _resend;
}

function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  template: ReactElement;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Render a React Email template and send it via Resend.
 * Returns a typed result rather than throwing — callers decide
 * whether email failure should abort the parent operation.
 */
export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  try {
    const resend = getResend();
    const html = await render(params.template);

    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html,
      ...(params.replyTo ? { reply_to: params.replyTo } : {}),
    });

    if (error) {
      console.error("[resend] Send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("[resend] Unexpected error:", message);
    return { success: false, error: message };
  }
}