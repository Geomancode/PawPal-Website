import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabaseServer";
import { checkoutQuantities, catalogLineItems, CheckoutCatalogError, type CatalogProduct } from "@/lib/checkoutCatalog";
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
    const { items, shipping: rawShipping, locale: requestedLocale } = await req.json();
    const shipping = normalizeShipping(rawShipping);
    if (!shipping) {
      return NextResponse.json({ error: "Valid shipping details are required" }, { status: 400 });
    }
    const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
    assertStripeTestMode();
    const requestedItems = checkoutQuantities(items);
    const { data: products, error: catalogError } = await supabaseServer
      .from("products")
      .select("id,name,price,currency,published,in_stock,stock_quantity")
      .eq("published", true)
      .in("id", requestedItems.map((item) => item.id));
    if (catalogError || !products) {
      throw new CheckoutCatalogError("Product catalog is unavailable", 503, "catalog_unavailable");
    }
    const lineItems = catalogLineItems(requestedItems, products as CatalogProduct[]);

    const stripe = getStripe();
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      req.headers.get("origin") ||
      "http://localhost:3000";

    const metadata = {
      intent: "store-order",
      shipping_name: shipping?.fullName || "",
      shipping_address: shipping?.address || "",
      shipping_city: shipping?.city || "",
      shipping_zip: shipping?.zipCode || "",
      shipping_country: shipping?.country || "",
      shipping_phone: shipping?.phone || "",
    };
    const idempotencyKey = createStripeIdempotencyKey("store-checkout", {
      lineItems,
      customerEmail: shipping?.email || null,
      metadata,
      mode: "payment",
      locale,
    });

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
        mode: "payment",
        success_url: `${baseUrl}${localizedPath("/store/success", locale)}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}${localizedPath("/store/checkout", locale)}`,
        customer_email: shipping?.email || undefined,
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

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    if (err instanceof CheckoutCatalogError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    reportError(err, { route: "/api/checkout", method: "POST" });
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
