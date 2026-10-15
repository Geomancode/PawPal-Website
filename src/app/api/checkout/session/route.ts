import { NextRequest } from "next/server";
import Stripe from "stripe";
import { reportError } from "@/lib/errorReporting";
import { assertStripeTestMode, getStripeSecretKey } from "@/lib/stripeGuard";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { reconcileStoreCheckout } from "@/lib/storeCheckout";
import { privateStoreJson, requireStoreUser, StoreIdentityError } from "@/lib/storeIdentity";

export async function GET(req: NextRequest) {
  try {
    const { userId, client } = await requireStoreUser(req);
    assertStripeTestMode();
    const sessionId = req.nextUrl.searchParams.get("session_id");
    if (!sessionId || sessionId.length > 255) return privateStoreJson({ error: "Invalid session" }, 400);
    const { data: binding, error } = await client.rpc("get_my_store_checkout", { p_session_id: sessionId });
    if (error) throw error;
    const stripe = new Stripe(getStripeSecretKey());
    let session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["line_items", "payment_intent"] });
    if (session.livemode !== false) return privateStoreJson({ error: "Order not found" }, 404);
    let storeLineItems: { product_id: string; name: string; quantity: number; amount: number }[] | null = null;
    if (session.mode === "payment") {
      if (!binding || binding.owner_id !== userId || binding.session_id !== sessionId) {
        return privateStoreJson({ error: "Order not found" }, 404);
      }
      const checked = await reconcileStoreCheckout(stripe, getSupabaseAdmin(), session.id);
      if (!checked || checked.reservation.owner_id !== userId || checked.reservation.attempt_id !== binding.attempt_id) {
        return privateStoreJson({ error: "Order not found" }, 404);
      }
      session = { ...session, ...checked.session };
      // These identities and amounts were frozen from the catalog and compared
      // with every provider line above; never match a cart by display name alone.
      storeLineItems = checked.reservation.items.map((item) => ({
        product_id: item.product_id, name: item.name, quantity: item.quantity,
        amount: item.unit_amount * item.quantity,
      }));
    } else if (session.mode !== "subscription" || session.metadata?.user_id !== userId) {
      // The subscription recipient's verified identity is required too. An email,
      // return URL or possession of a Stripe session ID is not authorization.
      return privateStoreJson({ error: "Order not found" }, 404);
    }
    return privateStoreJson({
      id: session.id, owner_id: userId, mode: session.mode, status: session.payment_status,
      customer_email: session.customer_email || session.customer_details?.email || "",
      amount_total: session.amount_total, amount_subtotal: session.amount_subtotal,
      shipping_cents: session.total_details?.amount_shipping ?? 0,
      tax_cents: session.total_details?.amount_tax ?? 0, currency: session.currency,
      // Never expose the unrestricted provider metadata (including shipping PII).
      metadata: { intent: session.metadata?.intent, tier: session.metadata?.tier,
        checkout_attempt_id: session.mode === "payment" ? binding.attempt_id : undefined },
      line_items: storeLineItems ?? session.line_items?.data.map((item) => ({
        name: item.description, quantity: item.quantity, amount: item.amount_total,
      })) ?? [],
    });
  } catch (error) {
    if (error instanceof StoreIdentityError) return privateStoreJson({ error: error.code }, error.status);
    reportError(error, { route: "/api/checkout/session", method: "GET" });
    return privateStoreJson({ error: "Payment verification is unavailable" }, 503);
  }
}
