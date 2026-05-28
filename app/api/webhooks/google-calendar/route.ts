/**
 * POST /api/webhooks/google-calendar
 *
 * Receives Google Calendar push notifications (watch channel callbacks).
 * Google sends a POST to this endpoint whenever the watched calendar changes.
 *
 * Google push notification headers:
 *   X-Goog-Channel-Id      — our channel UUID (maps to calendar_sync_tokens.channel_id)
 *   X-Goog-Resource-Id     — Google's resource ID for the calendar
 *   X-Goog-Resource-State  — "sync" (initial), "exists" (change), "not_exists" (deleted)
 *   X-Goog-Message-Number  — sequential message number
 *
 * Security: We verify the channel_id exists in our database and matches a
 * known tenant before processing. Google does not sign webhook payloads,
 * so channel ID verification is our primary guard.
 *
 * This webhook is intentionally excluded from the middleware matcher
 * (see middleware.ts) so it is accessible without a session cookie.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const channelId = request.headers.get("x-goog-channel-id");
  const resourceState = request.headers.get("x-goog-resource-state");
  const resourceId = request.headers.get("x-goog-resource-id");

  // Always return 200 immediately — Google retries on non-2xx and can
  // disable channels if we're consistently slow.
  // All processing is best-effort.
  if (!channelId) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Ignore the initial sync notification — it's just Google confirming
  // the channel is open, not an actual calendar change.
  if (resourceState === "sync") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const supabase = createServiceRoleClient();

  // Verify the channel exists in our database
  const { data: syncToken, error } = await supabase
    .from("calendar_sync_tokens")
    .select("tenant_id, sync_token, calendar_id")
    .eq("channel_id", channelId)
    .single();

  if (error || !syncToken) {
    // Unknown channel — could be a stale/expired channel from a previous deployment.
    // Log and return 200 to prevent Google from disabling the channel aggressively.
    console.warn("[gcal_webhook] Unknown channel_id:", channelId);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Optionally store the resource ID on first "exists" notification
  if (resourceId && !error) {
    await supabase
      .from("calendar_sync_tokens")
      .update({ resource_id: resourceId })
      .eq("channel_id", channelId);
  }

  // At this point we know a calendar change occurred for syncToken.tenant_id.
  // The availability engine fetches live busy times on every slot request,
  // so no additional sync action is needed here in the MVP.
  //
  // In a production system you would:
  // 1. Use the sync_token to call calendar.events.list({syncToken}) for the delta
  // 2. Update a local cache of busy times for faster availability responses
  // 3. Renew the watch channel before it expires (channels expire after ~7 days)
  //
  // For now, just acknowledge the notification.
  console.info(
    `[gcal_webhook] Calendar change for tenant ${syncToken.tenant_id} — state: ${resourceState}`
  );

  return NextResponse.json({ ok: true }, { status: 200 });
}

/**
 * Google sends a GET to verify the endpoint is reachable when setting up a channel.
 * Return 200 immediately.
 */
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}