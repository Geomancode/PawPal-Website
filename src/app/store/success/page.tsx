"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Package, ArrowRight, Loader2, AlertTriangle, Receipt } from "lucide-react";
import { saveOrder, saveCart, generateOrderId, loadCart } from "../storeData";
import { Badge, Button, Card } from "@/components/ui";

interface StripeSession {
  id: string;
  status: string;
  customer_email: string;
  amount_total: number;
  currency: string;
  metadata: Record<string, string>;
  line_items: { name: string; quantity: number; amount: number }[];
}

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paw-page text-paw-ink">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-paw-primary" aria-hidden="true" />
        <p className="text-sm font-bold text-paw-muted">Confirming your payment...</p>
      </div>
    </div>
  );
}

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [session, setSession] = useState<StripeSession | null>(null);
  const [loading, setLoading] = useState(() => Boolean(sessionId));
  const [error, setError] = useState(() => sessionId ? "" : "No session ID found");
  const [orderId] = useState(() => generateOrderId());

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
          if (cart.length > 0) {
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
  }, [sessionId, orderId]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paw-page px-4 pt-24 text-paw-ink">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-paw-md bg-paw-danger-soft text-paw-danger">
            <AlertTriangle className="h-7 w-7" aria-hidden="true" />
          </div>
          <Badge tone="danger" className="mb-3">Checkout status</Badge>
          <h1 className="text-2xl font-extrabold text-paw-ink">We could not verify this payment</h1>
          <p className="mt-3 text-sm leading-6 text-paw-body">{error}</p>
          <Button type="button" onClick={() => router.push("/store")} className="mt-6">
            Back to Store
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paw-page pt-28 pb-20 text-paw-ink">
      <div className="mx-auto max-w-2xl px-4">
        <Card className="p-8 text-center sm:p-10">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-paw-success-soft text-paw-success">
            <CheckCircle2 className="h-12 w-12" aria-hidden="true" />
          </div>

          <Badge tone="success" className="mb-3">Payment confirmed</Badge>
          <h1 className="text-3xl font-extrabold text-paw-ink">Payment successful</h1>
          <p className="mt-2 text-paw-body">Thank you for your PawPal purchase.</p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-paw-md border border-paw-primary/20 bg-paw-primary-soft px-4 py-2 font-mono text-sm font-extrabold text-paw-primary">
            <Receipt className="h-4 w-4" aria-hidden="true" />
            Order #{orderId}
          </div>

          {session && (
            <div className="mt-7 space-y-4 text-left">
              <div className="rounded-paw-md border border-paw-success/20 bg-paw-success-soft p-4 text-center">
                <p className="text-sm text-paw-success">
                  Paid <strong>€{((session.amount_total || 0) / 100).toFixed(2)}</strong> via Stripe
                </p>
              </div>

              {session.line_items && session.line_items.length > 0 && (
                <div className="rounded-paw-md border border-paw-border bg-paw-panel-subtle p-4">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-paw-ink">
                    <Package className="h-4 w-4 text-paw-primary" aria-hidden="true" />
                    Items
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

              <div className="rounded-paw-md border border-paw-warning/20 bg-paw-warning-soft p-4">
                <p className="text-sm leading-6 text-paw-warning">
                  Receipt sent to <strong>{session.customer_email}</strong>. Your order will ship within 1-2 business days.
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button type="button" onClick={() => router.push("/store/orders")}>
              View My Orders
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push("/store")}>
              Continue Shopping
            </Button>
          </div>
        </Card>
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
