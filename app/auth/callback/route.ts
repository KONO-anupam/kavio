// app/auth/callback/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles the redirect from Supabase after:
 * - Magic link click
 * - OAuth provider callback (Google, added in Step 4)
 *
 * Supabase appends ?code= or #access_token= to this URL.
 * The server client exchanges the code for a session and sets cookies.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Ensure we redirect to a relative path only (prevent open redirect)
      const redirectPath = next.startsWith("/") ? next : "/dashboard";
      return NextResponse.redirect(new URL(redirectPath, origin));
    }
  }

  // If exchange failed or no code present, redirect to login with error param
  return NextResponse.redirect(
    new URL("/login?error=auth_callback_failed", origin)
  );
}