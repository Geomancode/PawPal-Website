import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { items, shipping } = await req.json();

    // Build line items for Stripe Checkout
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
      (item: { name: string; price: number; quantity: number; image: string }) => ({
        price_data: {
          currency: "eur",
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100), // Stripe uses cents
        },
        quantity: item.quantity,
      })
    );

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      // Card (Visa/MC/Amex + Apple Pay + Google Pay), Bancontact (Belgium),
      // iDEAL (Netherlands), Link (one-click), Klarna (BNPL), PayPal
      payment_method_types: ["card", "bancontact", "ideal", "link", "klarna", "paypal"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${baseUrl}/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/store/checkout`,
      customer_email: shipping?.email || undefined,
      metadata: {
        shipping_name: shipping?.fullName || "",
        shipping_address: shipping?.address || "",
        shipping_city: shipping?.city || "",
        shipping_zip: shipping?.zipCode || "",
        shipping_country: shipping?.country || "",
        shipping_phone: shipping?.phone || "",
      },
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
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
