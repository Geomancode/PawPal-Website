import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

export async function GET(req: NextRequest) {
  try {
    const stripe = getStripe();
    const sessionId = req.nextUrl.searchParams.get("session_id");
    
    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "payment_intent"],
    });

    return NextResponse.json({
      id: session.id,
      status: session.payment_status,
      customer_email: session.customer_email || session.customer_details?.email,
      amount_total: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
      line_items: session.line_items?.data.map((item) => ({
        name: item.description,
        quantity: item.quantity,
        amount: item.amount_total,
      })),
    });
  } catch (err) {
    console.error("Session retrieve error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
