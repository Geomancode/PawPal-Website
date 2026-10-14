import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { checkoutQuantities, CheckoutCatalogError } from "@/lib/checkoutCatalog";
import { checkoutRequestHash, checkoutRpc, reconcileDueStoreCheckouts, reconcileStoreCheckout, reservedLineItems, validateCheckoutAttempt } from "@/lib/storeCheckout";
import { normalizeShipping } from "@/lib/checkoutShipping";
import { isLocale, defaultLocale } from "@/i18n/locales";
import { localizedPath } from "@/i18n/routing";
import { reportError } from "@/lib/errorReporting";
import {
  assertStripeTestMode,
  createStripeIdempotencyKey,
  getStripeSecretKey,
} from "@/lib/stripeGuard";

function getStripe() {
  return new Stripe(getStripeSecretKey());
}

export async function POST(req: NextRequest) {
  try {
    const { items, shipping: rawShipping, locale: requestedLocale, attemptId: rawAttemptId } = await req.json();
    const shipping = normalizeShipping(rawShipping);
    if (!shipping) {
      return NextResponse.json({ error: "Valid shipping details are required" }, { status: 400 });
    }
    const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
    assertStripeTestMode();
    const requestedItems = checkoutQuantities(items);
    const attemptId = validateCheckoutAttempt(rawAttemptId);
    const stripe = getStripe();
    const baseUrl = new URL(
      process.env.NEXT_PUBLIC_BASE_URL ||
      req.headers.get("origin") ||
      "http://localhost:3000").origin;
    const admin = getSupabaseAdmin();
    await reconcileDueStoreCheckouts(stripe, admin, requestedItems.map((item) => item.id));
    const payload = { shipping, locale, base_url: baseUrl };
    const requestHash = checkoutRequestHash(requestedItems, payload);
    let reservation = await checkoutRpc(admin, "reserve_store_checkout", {
      p_attempt_id: attemptId, p_request_sha256: requestHash,
      p_items: requestedItems.map(({ id, quantity }) => ({ product_id: id, quantity })).sort((a, b) => a.product_id.localeCompare(b.product_id)),
      p_checkout_payload: payload,
    });
    const respond = async (sessionId: string) => {
      const checked = await reconcileStoreCheckout(stripe, admin, sessionId);
      if (!checked || checked.reservation.attempt_id !== attemptId) throw new Error("Checkout verification failed");
      if (checked.reservation.state === "paid") {
        return NextResponse.json({ sessionId, url: `${baseUrl}${localizedPath("/store/success", locale)}?session_id=${encodeURIComponent(sessionId)}` });
      }
      if (checked.reservation.state === "released") throw new CheckoutCatalogError("Checkout has ended", 409, "reservation_ended");
      if (checked.session.status !== "open" || !checked.session.url) throw new CheckoutCatalogError("Payment confirmation is pending", 409, "reservation_pending");
      return NextResponse.json({ url: checked.session.url, sessionId });
    };
    if (reservation.session_id) return await respond(reservation.session_id);
    if (reservation.state !== "held") throw new CheckoutCatalogError("Checkout has ended", 409, "reservation_ended");
    // Stripe may prune idempotency keys after 24 hours. Never create a second
    // payable session for an old, unresolved attempt after the safe retry window.
    if (reservation.create_started_at && Date.now() - Date.parse(reservation.create_started_at) >= 23 * 60 * 60 * 1000) {
      throw new CheckoutCatalogError("Checkout needs payment verification", 409, "reservation_pending");
    }
    if (!reservation.create_started_at && Date.parse(reservation.expires_at) - Date.now() <= 30 * 60 * 1000 + 5000) {
      await checkoutRpc(admin, "cancel_store_checkout_before_create", { p_attempt_id: attemptId });
      throw new CheckoutCatalogError("Checkout has ended", 409, "reservation_ended");
    }
    const lineItems = reservedLineItems(reservation);
    const frozen = reservation.checkout_payload;

    const metadata = {
      intent: "store-order",
      checkout_attempt_id: attemptId,
      checkout_request_sha256: reservation.request_sha256,
      shipping_name: frozen.shipping.fullName,
      shipping_address: frozen.shipping.address,
      shipping_city: frozen.shipping.city,
      shipping_zip: frozen.shipping.zipCode,
      shipping_country: frozen.shipping.country,
      shipping_phone: frozen.shipping.phone,
    };
    const idempotencyKey = createStripeIdempotencyKey("store-checkout", {
      attemptId,
    });
    // After this durable boundary, any create/network/DB error keeps stock held.
    // A retry uses the same frozen parameters and Stripe idempotency key.
    try {
      reservation = await checkoutRpc(admin, "begin_store_checkout_create", { p_attempt_id: attemptId });
    } catch (error) {
      if (error instanceof CheckoutCatalogError && error.code === "reservation_ended") {
        // Still definitely before this attempt's first provider call. The RPC
        // refuses release if a concurrent worker crossed that boundary.
        await checkoutRpc(admin, "cancel_store_checkout_before_create", { p_attempt_id: attemptId });
      }
      throw error;
    }
    if (reservation.session_id) return await respond(reservation.session_id);
    if (reservation.state !== "held") throw new CheckoutCatalogError("Checkout has ended", 409, "reservation_ended");
    const session = await stripe.checkout.sessions.create(
      {
        // Card (Visa/MC/Amex + Apple Pay + Google Pay), Bancontact (Belgium),
        // iDEAL (Netherlands), Link (one-click), Klarna (BNPL), PayPal
        payment_method_types: [
          "card",
          "bancontact",
          "ideal",
          "link",
          "klarna",
          "paypal",
        ],
        line_items: lineItems,
        client_reference_id: attemptId,
        expires_at: Math.floor(Date.parse(reservation.expires_at) / 1000),
        mode: "payment",
        success_url: `${frozen.base_url}${localizedPath("/store/success", frozen.locale)}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frozen.base_url}${localizedPath("/store/checkout", frozen.locale)}`,
        customer_email: frozen.shipping.email,
        metadata,
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: {
                amount: 0,
                currency: "eur",
              },
              display_name: "Standard Shipping (3-5 days)",
              delivery_estimate: {
                minimum: { unit: "business_day", value: 3 },
                maximum: { unit: "business_day", value: 5 },
              },
            },
          },
        ],
      },
      { idempotencyKey },
    );

    // Reconciliation validates the canonical Stripe session and commits its
    // binding before exposing a payable URL, even after a lost create response.
    return await respond(session.id);
  } catch (err) {
    if (err instanceof CheckoutCatalogError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    reportError(err, { route: "/api/checkout", method: "POST" });
    return NextResponse.json({ error: "Checkout is awaiting confirmation", code: "reservation_pending" }, { status: 503 });
  }
}
