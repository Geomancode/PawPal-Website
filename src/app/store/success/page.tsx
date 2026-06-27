"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Package,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Receipt,
  Sparkles,
  Smartphone,
  QrCode,
  Truck,
  ClipboardList,
} from "lucide-react";
import { saveOrder, saveCart, generateOrderId, loadCart } from "../storeData";
import { AppDeepLinkButton, Badge, Button, Card, PairingHandoffCard } from "@/components/ui";

interface StripeSession {
  id: string;
  mode: string | null;
  status: string;
  customer_email: string;
  amount_total: number;
  currency: string;
  metadata: Record<string, string>;
  line_items: { name: string; quantity: number; amount: number }[];
}

function LoadingState() {
  return (
    <div className="commerce-page-shell flex min-h-screen items-center justify-center bg-paw-page text-paw-ink">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-paw-primary" aria-hidden="true" />
        <p className="text-sm font-bold text-paw-muted">Confirming your payment...</p>
      </div>
    </div>
  );
}

const PAIRING_STEPS = [
  {
    icon: Truck,
    title: "Wait for delivery",
    copy: "Your payment is confirmed and the order can move into processing. Checkout does not pair the tag.",
  },
  {
    icon: Smartphone,
    title: "Choose the pet in PawPal",
    copy: "Open the app and select the real pet profile that should own the tag.",
  },
  {
    icon: QrCode,
    title: "Scan or enter the code",
    copy: "Use the tag QR/NFC when it arrives. If scanning is unavailable, enter the printed code manually.",
  },
];

function StepCard({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof Truck;
  title: string;
  copy: string;
}) {
  return (
    <div className="rounded-paw-md border border-paw-border bg-paw-panel-subtle p-4 text-left">
      <div className="flex h-11 w-11 items-center justify-center rounded-paw-md bg-paw-primary-soft text-paw-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="mt-3 text-sm font-extrabold text-paw-ink">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-paw-body">{copy}</p>
    </div>
  );
}

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const intent = searchParams.get("intent");
  const requestedSubscription = intent === "subscription";
  const [session, setSession] = useState<StripeSession | null>(null);
  const [loading, setLoading] = useState(() => Boolean(sessionId));
  const [error, setError] = useState(() => sessionId ? "" : "No session ID found");
  const [orderId] = useState(() => generateOrderId());
  const isSubscription =
    requestedSubscription ||
    session?.mode === "subscription" ||
    session?.metadata?.intent === "ai-upgrade";

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    fetch(`/api/checkout/session?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setSession(data);

          const cart = loadCart();
          const completedSubscription =
            data.mode === "subscription" || data.metadata?.intent === "ai-upgrade";
          if (!completedSubscription && cart.length > 0) {
            const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
            saveOrder({
              id: orderId,
              items: cart,
              shipping: {
                fullName: data.metadata?.shipping_name || "",
                email: data.customer_email || "",
                address: data.metadata?.shipping_address || "",
                city: data.metadata?.shipping_city || "",
                zipCode: data.metadata?.shipping_zip || "",
                country: data.metadata?.shipping_country || "",
                phone: data.metadata?.shipping_phone || "",
              },
              payment: {
                last4: "Stripe",
                brand: "Stripe Checkout",
              },
              subtotal,
              shippingCost: 0,
              tax: subtotal * 0.21,
              total: (data.amount_total || 0) / 100,
              status: "processing",
              createdAt: new Date().toISOString(),
            });
            saveCart([]);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [sessionId, orderId, requestedSubscription]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="commerce-page-shell success-status-shell flex min-h-[100dvh] items-start justify-center bg-paw-page px-4 pb-16 pt-28 text-paw-ink">
        <Card className="success-card-upgraded w-full max-w-lg p-7 text-center sm:p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-paw-md bg-paw-danger-soft text-paw-danger">
            <AlertTriangle className="h-7 w-7" aria-hidden="true" />
          </div>
          <Badge tone="danger" className="mb-3">Checkout status</Badge>
          <h1 className="text-2xl font-extrabold text-paw-ink">We could not verify this payment</h1>
          <p className="mt-3 text-sm leading-6 text-paw-body">{error}</p>
          <div className="mt-5 rounded-paw-md border border-paw-border bg-paw-panel-subtle p-4 text-left">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-paw-muted">What this means</p>
            <p className="mt-2 text-sm leading-6 text-paw-body">
              PawPal only saves an order after Stripe returns a confirmed checkout session. This page alone cannot create a charge or order.
            </p>
          </div>
          <div className="success-action-row mt-6">
            <Button type="button" onClick={() => router.push("/store")}>
              Back to Store
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push("/store/orders")}>
              View Orders
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="commerce-page-shell min-h-screen bg-paw-page pt-28 pb-20 text-paw-ink">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.7fr)] lg:items-start">
          <Card className="success-card-upgraded p-7 sm:p-8">
            <div className="flex flex-col gap-5 text-left sm:flex-row sm:items-start">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-paw-lg bg-paw-success-soft text-paw-success">
                <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <Badge tone="success" className="mb-3">Payment confirmed</Badge>
                <h1 className="text-3xl font-extrabold leading-tight text-paw-ink sm:text-4xl">
                  {isSubscription ? "Plan payment confirmed" : "Order received"}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-paw-body sm:text-base">
                  {isSubscription
                    ? "Your PawPal AI plan will be available after the app refreshes your account."
                    : "Your payment is complete. The next useful step is setup in PawPal after your tag arrives."}
                </p>

                {isSubscription ? (
                  <div className="mt-5 inline-flex items-center gap-2 rounded-paw-md border border-paw-primary/20 bg-paw-primary-soft px-4 py-2 text-sm font-extrabold text-paw-primary">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Selected plan: PawPal {session?.metadata?.tier === "pro" ? "Pro" : "Basic"}
                  </div>
                ) : (
                  <div className="mt-5 inline-flex max-w-full items-center gap-2 rounded-paw-md border border-paw-primary/20 bg-paw-primary-soft px-4 py-2 font-mono text-sm font-extrabold text-paw-primary">
                    <Receipt className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">Order #{orderId}</span>
                  </div>
                )}
              </div>
            </div>

            {session && (
              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <div className="rounded-paw-md border border-paw-success/20 bg-paw-success-soft p-4">
                  <p className="text-xs font-black text-paw-success">Stripe payment</p>
                  <p className="mt-2 text-sm leading-6 text-paw-body">
                    Paid <strong className="text-paw-success">€{((session.amount_total || 0) / 100).toFixed(2)}</strong> via Stripe.
                  </p>
                </div>
                <div className="rounded-paw-md border border-paw-border bg-paw-panel-subtle p-4">
                  <p className="text-xs font-black text-paw-muted">Receipt</p>
                  <p className="mt-2 text-sm leading-6 text-paw-body">
                    Sent to <strong>{session.customer_email || "the checkout email"}</strong>.
                  </p>
                </div>
              </div>
            )}

            {session?.line_items && session.line_items.length > 0 && (
              <div className="mt-5 rounded-paw-md border border-paw-border bg-paw-panel-subtle p-4">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-paw-ink">
                  <Package className="h-4 w-4 text-paw-primary" aria-hidden="true" />
                  Purchased items
                </h2>
                <div className="space-y-2">
                  {session.line_items.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="flex justify-between gap-3 text-sm">
                      <span className="text-paw-body">{item.name} × {item.quantity}</span>
                      <span className="font-extrabold text-paw-ink">€{(item.amount / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {isSubscription ? (
                <Button type="button" onClick={() => router.push("/store?intent=ai-upgrade")}>
                  Manage Plans
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button type="button" onClick={() => router.push("/store/orders")}>
                  View My Orders
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
              <Button type="button" variant="secondary" onClick={() => router.push("/store")}>
                Continue Shopping
              </Button>
            </div>
          </Card>

          {isSubscription ? (
            <Card className="success-card-upgraded p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-paw-md bg-paw-trust-soft text-paw-trust">
                  <Smartphone className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-paw-ink">Next: refresh PawPal</h2>
                  <p className="mt-2 text-sm leading-6 text-paw-body">
                    Open the app and refresh your plan in Profile if AI access does not appear after sign-in.
                  </p>
                  <div className="mt-4">
                    <AppDeepLinkButton href="pawpal://" fallbackHref="/store?intent=ai-upgrade" fallbackLabel="Manage plans on web">
                      Open PawPal app
                    </AppDeepLinkButton>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-5">
              <PairingHandoffCard
                title="Next: pair the tag in PawPal"
                description="Pairing is not complete on this confirmation page. After delivery, use the PawPal app to connect the physical tag to a real pet profile."
                primaryAction={
                  <AppDeepLinkButton href="pawpal://" fallbackHref="/store/orders" fallbackLabel="View order on web">
                    Open PawPal app
                  </AppDeepLinkButton>
                }
                secondaryAction={
                  <Button type="button" variant="secondary" size="lg" onClick={() => router.push("/help")}>
                    Setup help
                  </Button>
                }
              />

              <Card className="success-card-upgraded p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-paw-md bg-paw-warning-soft text-paw-ink">
                    <ClipboardList className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <Badge tone="warning" className="mb-2">Setup pending</Badge>
                    <h2 className="text-lg font-extrabold text-paw-ink">No tag or profile state changed yet</h2>
                    <p className="mt-2 text-sm leading-6 text-paw-body">
                      This website confirms payment only. It does not show the tag as paired, connected, or attached to a public profile.
                    </p>
                  </div>
                </div>
              </Card>

              <div className="grid gap-3 sm:grid-cols-3">
                {PAIRING_STEPS.map((step) => (
                  <StepCard key={step.title} {...step} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SuccessContent />
    </Suspense>
  );
}
