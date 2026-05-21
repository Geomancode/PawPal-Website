import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabaseServer";
import { paidTierFromValue, SUBSCRIPTION_PLANS } from "@/lib/subscriptions";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

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

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
    const body = await req.json();
    const tier = paidTierFromValue(body.tier);
    if (!tier) {
      return NextResponse.json({ error: "Invalid subscription tier" }, { status: 400 });
    }

    const authUserId = await resolveAuthenticatedUserId(req);
    const userId =
      authUserId ||
      (typeof body.userId === "string" && body.userId.trim()
        ? body.userId.trim()
        : null);
    if (!userId) {
      return NextResponse.json(
        { error: "Sign in or provide a PawPal account before upgrading." },
        { status: 401 },
      );
    }

    const email =
      typeof body.email === "string" && body.email.includes("@")
        ? body.email.trim()
        : undefined;
    const plan = SUBSCRIPTION_PLANS[tier];
    const configuredPriceId = process.env[plan.stripePriceEnv];

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem =
      configuredPriceId
        ? { price: configuredPriceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: Math.round(plan.monthlyPrice * 100),
              recurring: { interval: "month" },
              product_data: {
                name: `PawPal ${plan.name}`,
                description: plan.summary,
              },
            },
          };

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      req.headers.get("origin") ||
      "http://localhost:3000";

    const metadata = {
      intent: "ai-upgrade",
      user_id: userId,
      tier,
      source: typeof body.source === "string" ? body.source : "web-store",
    };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [lineItem],
      client_reference_id: userId,
      customer_email: email,
      success_url: `${baseUrl}/store/success?intent=subscription&tier=${tier}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/store?intent=ai-upgrade&tier=${tier}`,
      metadata,
      subscription_data: {
        metadata,
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Subscription checkout error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
