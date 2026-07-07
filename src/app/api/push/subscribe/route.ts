import { NextRequest, NextResponse } from "next/server";
import { reportError } from "@/lib/errorReporting";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

type PushSubscriptionBody = {
  endpoint?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
};

function getBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  const token = auth.slice(7).trim();
  return token || null;
}

async function resolveAuthenticatedUserId(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) return null;
  const { data, error } = await supabaseServer.auth.getUser(token);
  if (error) return null;
  return data.user?.id ?? null;
}

function normalizeSubscriptionBody(value: unknown): PushSubscriptionBody | null {
  const candidate =
    value && typeof value === "object" && "subscription" in value
      ? (value as { subscription?: unknown }).subscription
      : value;

  if (!candidate || typeof candidate !== "object") return null;
  return candidate as PushSubscriptionBody;
}

function extractSubscription(value: unknown) {
  const subscription = normalizeSubscriptionBody(value);
  const endpoint = typeof subscription?.endpoint === "string" ? subscription.endpoint.trim() : "";
  const p256dh = typeof subscription?.keys?.p256dh === "string" ? subscription.keys.p256dh.trim() : "";
  const auth = typeof subscription?.keys?.auth === "string" ? subscription.keys.auth.trim() : "";

  if (!endpoint || !p256dh || !auth) return null;
  return { endpoint, p256dh, auth };
}

function extractEndpoint(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const endpoint = (value as { endpoint?: unknown }).endpoint;
  return typeof endpoint === "string" ? endpoint.trim() : "";
}

export async function POST(req: NextRequest) {
  try {
    const userId = await resolveAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = extractSubscription(await req.json());
    if (!subscription) {
      return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("web_push_subscriptions")
      .upsert(
        {
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
          user_agent: req.headers.get("user-agent"),
        },
        { onConflict: "endpoint" },
      );

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    reportError(error, { route: "/api/push/subscribe", method: "POST" });
    return NextResponse.json({ error: "Unable to save push subscription" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await resolveAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const endpoint = extractEndpoint(await req.json());
    if (!endpoint) {
      return NextResponse.json({ error: "Missing push endpoint" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("web_push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("endpoint", endpoint);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    reportError(error, { route: "/api/push/subscribe", method: "DELETE" });
    return NextResponse.json({ error: "Unable to remove push subscription" }, { status: 500 });
  }
}

