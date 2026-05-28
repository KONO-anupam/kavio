// middleware.ts

import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

/**
 * Next.js middleware — runs on every matched request.
 *
 * Responsibilities:
 * 1. Refresh the Supabase session (keep cookie expiry current)
 * 2. Protect /dashboard/* — redirect unauthenticated users to /login
 * 3. Redirect already-authenticated users away from /login
 */
export async function middleware(request: NextRequest) {
  // Start with a passthrough response; middleware client may mutate its cookies
  const response = NextResponse.next({ request });
  const { supabase } = createMiddlewareClient(request, response);

  // getUser() validates the JWT with Supabase — more secure than getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ── Protect dashboard routes ──────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Redirect authenticated users away from login ──────────
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static, _next/image  (Next.js internals)
     * - favicon.ico, robots.txt, sitemap.xml
     * - /book/*  (public booking portal — no auth required)
     * - /api/webhooks/*  (webhook receivers — verified by signature)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|api/webhooks).*)",
  ],
};