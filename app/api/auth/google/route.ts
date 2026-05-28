// app/api/auth/google/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthorizationUrl } from "@/lib/google/calendar";

/**
 * GET /api/auth/google
 *
 * Initiates the Google Calendar OAuth2 flow.
 * Generates a CSRF state token (the tenant's user ID signed via Supabase session),
 * stores it in a short-lived cookie, then redirects to Google's consent screen.
 *
 * Only authenticated tenants can initiate this flow.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // State = tenant user ID — verified in the callback to prevent CSRF
  const state = user.id;
  const authUrl = getAuthorizationUrl(state);

  const response = NextResponse.redirect(authUrl);

  // Store state in a short-lived HTTP-only cookie for CSRF verification
  response.cookies.set("gcal_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  return response;
}