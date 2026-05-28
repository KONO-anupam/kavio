import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, storeTokens } from "@/lib/google/calendar";

/**
 * GET /api/auth/google/callback
 *
 * Google redirects here after the user grants or denies consent.
 *
 * Security checks:
 * 1. Verify ?state= matches the gcal_oauth_state cookie (CSRF protection)
 * 2. Verify the Supabase session is still valid and user ID matches state
 * 3. Exchange the authorization code for tokens
 * 4. Encrypt and store tokens in profiles.gcal_token_ref
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const settingsUrl = new URL("/dashboard/settings", request.url);

  // User denied consent
  if (errorParam) {
    settingsUrl.searchParams.set("gcal_error", "access_denied");
    const response = NextResponse.redirect(settingsUrl);
    response.cookies.delete("gcal_oauth_state");
    return response;
  }

  // Missing required params
  if (!code || !state) {
    settingsUrl.searchParams.set("gcal_error", "missing_params");
    const response = NextResponse.redirect(settingsUrl);
    response.cookies.delete("gcal_oauth_state");
    return response;
  }

  // CSRF verification — state must match cookie
  const storedState = request.cookies.get("gcal_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    settingsUrl.searchParams.set("gcal_error", "state_mismatch");
    const response = NextResponse.redirect(settingsUrl);
    response.cookies.delete("gcal_oauth_state");
    return response;
  }

  // Verify Supabase session and that the user ID matches the state
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || user.id !== state) {
    settingsUrl.searchParams.set("gcal_error", "session_invalid");
    const response = NextResponse.redirect(settingsUrl);
    response.cookies.delete("gcal_oauth_state");
    return response;
  }

  // Exchange code for tokens
  try {
    const tokens = await exchangeCodeForTokens(code);
    await storeTokens(user.id, tokens);
  } catch (err) {
    console.error("[gcal_callback] Token exchange failed:", err);
    settingsUrl.searchParams.set("gcal_error", "token_exchange_failed");
    const response = NextResponse.redirect(settingsUrl);
    response.cookies.delete("gcal_oauth_state");
    return response;
  }

  // Success — redirect back to settings with success indicator
  settingsUrl.searchParams.set("gcal_connected", "1");
  const response = NextResponse.redirect(settingsUrl);
  response.cookies.delete("gcal_oauth_state");
  return response;
}