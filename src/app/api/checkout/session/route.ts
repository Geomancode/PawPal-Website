import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { reportError } from "@/lib/errorReporting";
import { assertStripeTestMode, getStripeSecretKey } from "@/lib/stripeGuard";

function getStripe() {
  return new Stripe(getStripeSecretKey());
}

export async function GET(req: NextRequest) {
  try {
    assertStripeTestMode();
    const sessionId = req.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "payment_intent"],
    });

    return NextResponse.json({
      id: session.id,
      mode: session.mode,
      status: session.payment_status,
      customer_email: session.customer_email || session.customer_details?.email,
      amount_total: session.amount_total,
      currency: session.currency,
      metadata: session.metadata ?? {},
      line_items: session.line_items?.data.map((item) => ({
        name: item.description,
        quantity: item.quantity,
        amount: item.amount_total,
      })) ?? [],
    });
  } catch (err) {
    reportError(err, { route: "/api/checkout/session", method: "GET" });
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
