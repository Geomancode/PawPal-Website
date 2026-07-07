import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { reportError } from "@/lib/errorReporting";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  configureWebPush,
  isExpiredPushEndpoint,
  toWebPushSubscription,
  type PushPayload,
  type StoredWebPushSubscription,
} from "@/lib/webPush";

export const runtime = "nodejs";

function isAuthorized(req: NextRequest) {
  const expected = process.env.PUSH_WEBHOOK_SECRET?.trim();
  const provided = req.headers.get("x-push-secret")?.trim();
  return Boolean(expected && provided && expected === provided);
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePayload(body: unknown): (PushPayload & { userId: string }) | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const userId = cleanString(record.userId);
  const title = cleanString(record.title);
  const messageBody = cleanString(record.body);
  const url = cleanString(record.url) || "/profile";

  if (!userId || !title) return null;
  return {
    userId,
    title,
    body: messageBody,
    url,
  };
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = normalizePayload(await req.json());
    if (!payload) {
      return NextResponse.json({ error: "Invalid push payload" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("web_push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", payload.userId);

    if (error) throw error;

    const subscriptions = (data ?? []) as StoredWebPushSubscription[];
    if (subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, deleted: 0 });
    }

    configureWebPush();
    const message = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url,
    });

    const results = await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(toWebPushSubscription(subscription), message);
          return { sent: 1, failed: 0, deleted: 0 };
        } catch (error) {
          if (isExpiredPushEndpoint(error)) {
            const { error: deleteError } = await supabase
              .from("web_push_subscriptions")
              .delete()
              .eq("id", subscription.id);

            if (deleteError) throw deleteError;
            return { sent: 0, failed: 0, deleted: 1 };
          }

          reportError(error, {
            route: "/api/push/send",
            method: "POST",
            endpointId: subscription.id,
          });
          return { sent: 0, failed: 1, deleted: 0 };
        }
      }),
    );

    return NextResponse.json(
      results.reduce(
        (total, result) => ({
          sent: total.sent + result.sent,
          failed: total.failed + result.failed,
          deleted: total.deleted + result.deleted,
        }),
        { sent: 0, failed: 0, deleted: 0 },
      ),
    );
  } catch (error) {
    reportError(error, { route: "/api/push/send", method: "POST" });
    return NextResponse.json({ error: "Unable to send push notifications" }, { status: 500 });
  }
}

