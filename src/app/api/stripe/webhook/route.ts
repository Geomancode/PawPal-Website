import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  normalizeTier,
  tierFromStripePrice,
  type SubscriptionTier,
} from "@/lib/subscriptions";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

function toIso(seconds?: number | null) {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

function extractSubscriptionTiming(subscription: Stripe.Subscription) {
  const raw = subscription as unknown as {
    current_period_start?: number | null;
    current_period_end?: number | null;
  };
  return {
    currentPeriodStart: toIso(raw.current_period_start),
    currentPeriodEnd: toIso(raw.current_period_end),
  };
}

function firstPriceId(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price.id ?? null;
}

function eventSubscriptionId(event: Stripe.Event) {
  const object = event.data.object as {
    id?: string;
    object?: string;
    subscription?: string | { id?: string } | null;
  };
  if (object.object === "subscription") return object.id ?? null;
  if (typeof object.subscription === "string") return object.subscription;
  return object.subscription?.id ?? null;
}

function shouldHandleSubscriptionEvent(event: Stripe.Event) {
  const object = event.data.object as {
    object?: string;
    mode?: string | null;
  };

  if (event.type === "checkout.session.completed") {
    return object.object === "checkout.session" && object.mode === "subscription";
  }

  return (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  );
}

async function recordEvent(event: Stripe.Event, userId?: string | null) {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("subscription_events").insert({
    id: event.id,
    event_type: event.type,
    user_id: userId || null,
    stripe_subscription_id: eventSubscriptionId(event),
    payload: event as unknown as Record<string, unknown>,
  });
  if (error && error.code !== "23505") throw error;
  return error?.code !== "23505";
}

async function upsertSubscription({
  userId,
  customerId,
  subscription,
  tier,
}: {
  userId: string;
  customerId: string | null;
  subscription: Stripe.Subscription;
  tier: SubscriptionTier;
}) {
  const supabaseAdmin = getSupabaseAdmin();
  const priceId = firstPriceId(subscription);
  const timing = extractSubscriptionTiming(subscription);
  const activeTier =
    subscription.status === "active" || subscription.status === "trialing"
      ? tier
      : "free";

  const { error: subError } = await supabaseAdmin
    .from("billing_subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        tier,
        status: subscription.status,
        current_period_start: timing.currentPeriodStart,
        current_period_end: timing.currentPeriodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: toIso(subscription.canceled_at),
        metadata: subscription.metadata,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );
  if (subError) throw subError;

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      subscription_tier: activeTier,
      subscription_expires_at: timing.currentPeriodEnd,
    })
    .eq("id", userId);
  if (profileError) throw profileError;
}

async function handleCheckoutCompleted(stripe: Stripe, session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;
  const userId = session.metadata?.user_id || session.client_reference_id;
  const tier = normalizeTier(session.metadata?.tier);
  if (!userId || tier === "free" || typeof session.subscription !== "string") {
    throw new Error("Subscription checkout session missing user, tier, or subscription id");
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  await upsertSubscription({
    userId,
    customerId:
      typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
    subscription,
    tier,
  });
}

async function handleSubscriptionChanged(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.user_id;
  if (!userId) return;
  const metadataTier = normalizeTier(subscription.metadata.tier);
  const priceTier = tierFromStripePrice(firstPriceId(subscription));
  const tier = metadataTier !== "free" ? metadataTier : priceTier;
  await upsertSubscription({
    userId,
    customerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id,
    subscription,
    tier,
  });
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured" },
      { status: 500 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const object = event.data.object;
  const userId =
    "metadata" in object && object.metadata
      ? (object.metadata.user_id as string | undefined)
      : null;

  try {
    if (!shouldHandleSubscriptionEvent(event)) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const shouldProcess = await recordEvent(event, userId);
    if (!shouldProcess) return NextResponse.json({ received: true, duplicate: true });

    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(stripe, object as Stripe.Checkout.Session);
    } else if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await handleSubscriptionChanged(object as Stripe.Subscription);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook processing error:", err);
    const message = err instanceof Error ? err.message : "Webhook processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
