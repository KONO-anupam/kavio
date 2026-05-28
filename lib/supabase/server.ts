// lib/supabase/server.ts

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import type { CookieOptions } from "@supabase/ssr";

/**
 * Server-side Supabase client with cookie-based session management.
 * Use in:
 * - Server Components
 * - Server Actions
 * - Route Handlers
 *
 * Reads the user's session from cookies automatically.
 * Uses the anon key — subject to RLS.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options: CookieOptions;
        }>
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll called from a Server Component where cookies cannot be set.
          // Session refresh is handled by the middleware instead.
        }
      },
    },
  });
}

/**
 * Service-role Supabase client — bypasses RLS.
 * Use ONLY in:
 * - Server Actions that need to write on behalf of unauthenticated users
 *   (e.g., public booking portal submission)
 * - Webhook handlers
 * - Background jobs
 *
 * NEVER expose this client or its key to the browser.
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  // We import createServerClient with a no-op cookie adapter since the
  // service role client does not manage user sessions.
  return createServerClient<Database>(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // no-op — service role client has no session to persist
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}