import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { reportError } from "@/lib/errorReporting";
import { assertStripeTestMode, getStripeSecretKey } from "@/lib/stripeGuard";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizeTier, tierFromStripePrice } from "@/lib/subscriptions";
import { reconcileStoreCheckout } from "@/lib/storeCheckout";

function getStripe() {
  // Matches the installed Stripe 21 SDK. Webhook payloads may have older versions;
  // only their resource ID is used to retrieve the current, versioned snapshot.
  return new Stripe(getStripeSecretKey(), { apiVersion: "2026-03-25.dahlia" });
}

function toIso(seconds: unknown) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) return null;
  const date = new Date(seconds * 1000);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function subscriptionSnapshot(subscription: Stripe.Subscription, session?: Stripe.Checkout.Session) {
  const userId = subscription.metadata.user_id || session?.metadata?.user_id || session?.client_reference_id;
  if (!userId) throw new Error("Subscription has no mapped user");
  const sessionUser = session?.metadata?.user_id || session?.client_reference_id;
  if (sessionUser && sessionUser !== userId) throw new Error("Subscription user mapping conflict");
  const items = subscription.items.data;
  const supported = items.filter((item) => tierFromStripePrice(item.price.id) !== "free");
  // Multiple paid plans / incomplete item pages need an explicit billing policy.
  if (subscription.items.has_more || supported.length > 1) throw new Error("Ambiguous subscription items");
  const item = supported[0] || (items.length === 1 ? items[0] : undefined);
  if (!item) throw new Error("Subscription has no supported billing item");
  const priceTier = tierFromStripePrice(item.price.id);
  const tier = priceTier !== "free" ? priceTier : normalizeTier(subscription.metadata.tier || session?.metadata?.tier);
  if (tier === "free") throw new Error("Subscription has no mapped paid tier");
  const start = toIso(item.current_period_start);
  const end = toIso(item.current_period_end);
  if ((subscription.status === "active" || subscription.status === "trialing") &&
      (!start || !end || Date.parse(end) <= Date.parse(start))) {
    throw new Error("Active subscription has no valid item period");
  }
  return {
    user_id: userId,
    stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    stripe_subscription_id: subscription.id,
    stripe_price_id: item.price.id,
    tier, status: subscription.status,
    current_period_start: start, current_period_end: end,
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: toIso(subscription.canceled_at), metadata: subscription.metadata,
  };
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not configured" }, { status: 500 });

  let stripe: Stripe;
  try {
    assertStripeTestMode();
    stripe = getStripe();
  } catch (err) {
    reportError(err, { route: "/api/stripe/webhook", method: "POST" });
    return NextResponse.json({ error: "Stripe is not configured for test mode" }, { status: 500 });
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const object = event.data.object;
  const storeEvent = ["checkout.session.completed", "checkout.session.expired", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed"].includes(event.type);
  const eventSession = storeEvent ? object as Stripe.Checkout.Session : undefined;
  if (eventSession?.mode === "payment" && eventSession.metadata?.checkout_attempt_id) {
    try {
      // Only the verified event ID/resource ID are used. Fresh Stripe state is
      // checked against the reservation before any stock/order mutation.
      const checked = await reconcileStoreCheckout(stripe, getSupabaseAdmin(), eventSession.id, { id: event.id, type: event.type });
      if (!checked) throw new Error("Store checkout mapping is missing");
      return NextResponse.json({ received: true });
    } catch (err) {
      reportError(err, { route: "/api/stripe/webhook", method: "POST" });
      return NextResponse.json({ error: "Store payment processing failed; retry" }, { status: 500 });
    }
  }
  const session = event.type === "checkout.session.completed" ? object as Stripe.Checkout.Session : undefined;
  const subscriptionEvent = ["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type);
  if ((!session || session.mode !== "subscription") && !subscriptionEvent) {
    return NextResponse.json({ received: true, ignored: true });
  }
  const subscriptionId = session
    ? (typeof session.subscription === "string" ? session.subscription : session.subscription?.id)
    : (object as Stripe.Subscription).id;
  if (!subscriptionId) return NextResponse.json({ error: "Missing subscription id" }, { status: 500 });

  let admin: ReturnType<typeof getSupabaseAdmin> | null = null;
  let token: string | null = null;
  try {
    admin = getSupabaseAdmin();
    // The lease starts BEFORE fetching Stripe, serializing even same-second or
    // out-of-order events. Expired workers cannot commit after a new lease wins.
    const claim = await admin.rpc("claim_subscription_webhook", {
      p_subscription_id: subscriptionId, p_event_id: event.id,
    });
    if (claim.error) throw claim.error;
    if (claim.data?.status === "duplicate") return NextResponse.json({ received: true, duplicate: true });
    if (claim.data?.status !== "claimed" || !claim.data.token) {
      return NextResponse.json({ error: "Subscription update in progress; retry" }, { status: 503 });
    }
    token = claim.data.token;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const snapshot = subscriptionSnapshot(subscription, session);
    const applied = await admin.rpc("apply_subscription_webhook", {
      p_subscription_id: subscriptionId, p_token: token,
      p_event: event, p_snapshot: snapshot,
    });
    if (applied.error) throw applied.error;
    return NextResponse.json({ received: true, duplicate: applied.data?.status === "duplicate" });
  } catch (err) {
    reportError(err, { route: "/api/stripe/webhook", method: "POST" });
    return NextResponse.json({ error: "Webhook processing failed; retry" }, { status: 500 });
  } finally {
    if (token && admin) {
      try {
        const released = await admin.rpc("release_subscription_webhook", { p_subscription_id: subscriptionId, p_token: token });
        if (released.error) throw released.error;
      } catch (err) {
        // Failure keeps the bounded lease; it never marks an event successful.
        reportError(err, { route: "/api/stripe/webhook", method: "POST" });
      }
    }
  }
}
