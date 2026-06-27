"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Package, MapPin, CreditCard,
  Truck, ShieldCheck, Lock, Loader2, ExternalLink,
  CheckCircle2,
} from "lucide-react";
import {
  CartItem, ShippingInfo,
  loadCart,
} from "../storeData";
import ProductVisual from "../ProductVisual";
import { StatusMessage } from "@/components/ui";

const STEPS = [
  { id: 1, label: "Shipping", icon: MapPin },
  { id: 2, label: "Review", icon: Package },
  { id: 3, label: "Payment", icon: CreditCard },
];

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerReducedMotionSnapshot() {
  return false;
}

function useHydratedReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );
}

function checkoutStepMotion(shouldReduceMotion: boolean) {
  return {
    initial: false,
    animate: { opacity: 1, x: 0 },
    exit: shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 },
    transition: shouldReduceMotion ? { duration: 0 } : undefined,
  };
}

function formatEuro(value: number) {
  return `€${value.toFixed(2)}`;
}

function getItemCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

// ─── Step Indicator ────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="checkout-stepper mb-8 flex items-center justify-center gap-2" aria-label="Checkout progress">
      {STEPS.map((step, i) => {
        const done = current > step.id;
        const active = current === step.id;
        return (
          <li key={step.id} className="flex items-center gap-2">
            <div
              className={`flex min-h-11 items-center gap-2 rounded-paw-md px-3 py-2 text-sm font-extrabold transition-colors sm:px-4 ${
              active ? "bg-paw-primary text-white shadow-paw-action" : done ? "bg-paw-success-soft text-paw-success" : "bg-paw-panel-subtle text-paw-muted"
            }`}
              aria-current={active ? "step" : undefined}
            >
              <step.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-8 ${done ? "bg-paw-success" : "bg-paw-border"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ─── Input Field ───────────────────────────────────────
function Field({ id, label, value, onChange, placeholder, type = "text", required = true, autoComplete }: {
  id: string;
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; type?: string; required?: boolean; autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-paw-ink">
        {label}{required && <span className="text-paw-danger">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded-paw-md border border-paw-border bg-paw-panel px-4 py-3 text-paw-ink transition-all focus:border-paw-trust focus:outline-none focus:ring-4 focus:ring-paw-trust/20"
      />
    </div>
  );
}

// ─── Order Summary Sidebar ─────────────────────────────
function OrderSummary({ items, loading }: { items: CartItem[]; loading: boolean }) {
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const itemCount = getItemCount(items);

  return (
    <aside className="checkout-summary-card rounded-paw-lg border border-paw-border bg-paw-panel/90 p-6 shadow-paw-panel backdrop-blur-sm lg:sticky lg:top-28" aria-label="Checkout summary">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-paw-primary">Checkout summary</p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-extrabold text-paw-ink">
            <Package className="h-5 w-5 text-paw-primary" aria-hidden="true" />
            Order summary
          </h2>
        </div>
        <span className="shrink-0 rounded-paw-sm border border-paw-border bg-paw-panel-subtle px-2.5 py-1 text-xs font-bold text-paw-muted">
          {loading ? "Loading" : `${itemCount} item${itemCount === 1 ? "" : "s"}`}
        </span>
      </div>

      {loading ? (
        <div className="rounded-paw-md border border-paw-border bg-paw-panel-subtle p-4 text-sm font-bold text-paw-body">
          Loading your cart before payment review...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-paw-md border border-paw-warning/20 bg-paw-warning-soft p-4 text-sm font-bold text-paw-body">
          Your cart is empty. Returning to the store...
        </div>
      ) : (
        <div className="mb-5 max-h-[22rem] space-y-3 overflow-y-auto pr-1">
          {items.map((item) => (
            <div key={item.product.id} className="flex gap-3 rounded-paw-md border border-paw-border bg-paw-panel-subtle p-3">
              <ProductVisual product={item.product} size="sm" className="border border-paw-border" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-paw-ink">{item.product.name}</p>
                <p className="mt-1 text-xs font-bold text-paw-muted">
                  Qty {item.quantity} x {formatEuro(item.product.price)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-extrabold tabular-nums text-paw-ink">
                {formatEuro(item.product.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 border-t border-paw-border pt-4">
        <div className="flex justify-between text-sm text-paw-body">
          <span>Subtotal</span>
          <span className="font-bold tabular-nums">{formatEuro(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-paw-body">
          <span>Shipping</span>
          <span className="font-bold text-paw-success">Free</span>
        </div>
        <div className="flex justify-between border-t border-paw-border pt-3 text-xl font-extrabold text-paw-ink">
          <span>Total due</span>
          <span className="tabular-nums">{formatEuro(subtotal)}</span>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {[
          "Stripe hosts the card and wallet payment step.",
          "PawPal keeps your cart intact if payment does not start.",
          "Free shipping is included before you leave this page.",
        ].map((label) => (
          <div key={label} className="flex items-start gap-2 text-xs leading-5 text-paw-body">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-paw-success" aria-hidden="true" />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-paw-md border border-paw-trust/20 bg-paw-trust-soft p-3">
        <ShieldCheck className="h-4 w-4 shrink-0 text-paw-trust" />
        <p className="text-xs font-bold leading-5 text-paw-body">
          Secure payment powered by <strong className="text-paw-ink">Stripe</strong>.
        </p>
      </div>
    </aside>
  );
}

// ─── Main Checkout Page ────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const shouldReduceMotion = useHydratedReducedMotion();
  const [step, setStep] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [shipping, setShipping] = useState<ShippingInfo>({
    fullName: "", email: "", address: "", city: "", zipCode: "", country: "", phone: "",
  });

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      const loaded = loadCart();
      if (cancelled) return;
      if (loaded.length === 0) {
        router.push("/store");
      }
      setCart(loaded);
      setCartLoaded(true);
    });
    return () => { cancelled = true; };
  }, [router]);

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const emailLooksValid = /^\S+@\S+\.\S+$/.test(shipping.email.trim());
  const canProceedShipping = Boolean(
    shipping.fullName &&
    emailLooksValid &&
    shipping.address &&
    shipping.city &&
    shipping.zipCode &&
    shipping.country,
  );

  // Redirect to Stripe Checkout
  const handleStripeCheckout = async () => {
    setRedirecting(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({
            name: i.product.name,
            price: i.product.price,
            quantity: i.quantity,
            image: i.product.image,
            imageUrl: i.product.imageUrl,
            currency: i.product.currency,
          })),
          shipping,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error || "Could not start Stripe checkout. Please review your cart and try again.");
        setRedirecting(false);
      }
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Network error. Please try again.");
      setRedirecting(false);
    }
  };

  return (
    <div className="commerce-page-shell min-h-screen bg-paw-page pt-28 pb-20 text-paw-ink">
      <div className="max-w-5xl mx-auto px-4">
        {/* Back button */}
        <button
          type="button"
          onClick={() => step === 1 ? router.push("/store") : setStep(step - 1)}
          className="mb-6 flex cursor-pointer items-center gap-1 text-paw-muted transition-colors hover:text-paw-primary"
        >
          <ArrowLeft className="w-4 h-4" /> {step === 1 ? "Back to Store" : "Back"}
        </button>

        <div className="checkout-hero-panel mb-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-paw-primary">PawPal Shop</p>
            <h1 className="mt-2 text-3xl font-extrabold text-paw-ink sm:text-5xl">Secure checkout</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-paw-body sm:text-base">
              Confirm delivery details, review your pet essentials, and finish with Stripe-secured payment.
            </p>
          </div>
          <div className="checkout-assurance-grid">
            {[
              { icon: Lock, label: "Stripe-secured" },
              { icon: Truck, label: "Free shipping" },
              { icon: ShieldCheck, label: "Cart preserved on retry" },
            ].map((item) => (
              <div key={item.label} className="checkout-assurance-chip">
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <StepIndicator current={redirecting ? 3 : step} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Main Content ── */}
          <div className="lg:col-span-2">
            <>
              {/* ────── STEP 1: SHIPPING ────── */}
              {step === 1 && (
                <motion.div
                  key="shipping"
                  {...checkoutStepMotion(shouldReduceMotion)}
                  className="checkout-main-card rounded-paw-lg border border-paw-border bg-paw-panel/80 p-8 shadow-paw-panel backdrop-blur-sm"
                >
                  <h2 className="mb-6 flex items-center gap-2 text-2xl font-extrabold text-paw-ink">
                    <MapPin className="h-5 w-5 text-paw-primary" /> Shipping Information
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Field id="fullName" label="Full Name" value={shipping.fullName} onChange={(v) => setShipping({ ...shipping, fullName: v })} placeholder="John Doe" autoComplete="name" />
                    </div>
                    <Field id="email" label="Email" value={shipping.email} onChange={(v) => setShipping({ ...shipping, email: v })} placeholder="john@example.com" type="email" autoComplete="email" />
                    <Field id="phone" label="Phone" value={shipping.phone} onChange={(v) => setShipping({ ...shipping, phone: v })} placeholder="+32 XXX XXX XXX" type="tel" required={false} autoComplete="tel" />
                    <div className="sm:col-span-2">
                      <Field id="address" label="Street Address" value={shipping.address} onChange={(v) => setShipping({ ...shipping, address: v })} placeholder="123 Pet Street" autoComplete="street-address" />
                    </div>
                    <Field id="city" label="City" value={shipping.city} onChange={(v) => setShipping({ ...shipping, city: v })} placeholder="Ghent" autoComplete="address-level2" />
                    <Field id="zipCode" label="Zip Code" value={shipping.zipCode} onChange={(v) => setShipping({ ...shipping, zipCode: v })} placeholder="9000" autoComplete="postal-code" />
                    <div className="sm:col-span-2">
                      <Field id="country" label="Country" value={shipping.country} onChange={(v) => setShipping({ ...shipping, country: v })} placeholder="Belgium" autoComplete="country-name" />
                    </div>
                  </div>

                  {!emailLooksValid && shipping.email && (
                    <StatusMessage tone="warning" className="mt-5" title="Check the email address">
                      Enter a valid email so Stripe and PawPal can send the order confirmation.
                    </StatusMessage>
                  )}

                  <div className="mt-6 flex items-center gap-3 rounded-paw-md border border-paw-success/20 bg-paw-success-soft p-4">
                    <Truck className="h-5 w-5 shrink-0 text-paw-success" />
                    <p className="text-sm text-paw-body">Free shipping on all orders. Estimated delivery: 3-5 business days.</p>
                  </div>

                  {!canProceedShipping && (
                    <p className="mt-4 text-sm font-bold text-paw-muted">
                      Complete the required delivery details to review your order.
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={!canProceedShipping}
                    onClick={() => setStep(2)}
                    className={`mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-paw-lg py-3.5 text-lg font-bold transition-all ${
                      canProceedShipping ? "bg-paw-primary text-white shadow-paw-action hover:bg-paw-primary-hover" : "cursor-not-allowed bg-paw-panel-subtle text-paw-muted"
                    }`}
                  >
                    Review Order <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}

              {/* ────── STEP 2: REVIEW & PAY ────── */}
              {step === 2 && (
                <motion.div
                  key="review"
                  {...checkoutStepMotion(shouldReduceMotion)}
                  className="checkout-main-card rounded-paw-lg border border-paw-border bg-paw-panel/80 p-8 shadow-paw-panel backdrop-blur-sm"
                >
                  <h2 className="mb-6 flex items-center gap-2 text-2xl font-extrabold text-paw-ink">
                    <Package className="h-5 w-5 text-paw-primary" /> Review Your Order
                  </h2>

                  {/* Shipping summary */}
                  <div className="mb-6 rounded-paw-md border border-paw-border bg-paw-panel-subtle p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h4 className="flex items-center gap-2 font-bold text-paw-ink"><MapPin className="h-4 w-4 text-paw-primary" /> Shipping to</h4>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-sm font-extrabold text-paw-primary transition-colors hover:text-paw-primary-hover focus:outline-none focus:ring-4 focus:ring-paw-primary/20"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-sm text-paw-body">{shipping.fullName}</p>
                    <p className="text-sm text-paw-muted">{shipping.address}</p>
                    <p className="text-sm text-paw-muted">{shipping.city}, {shipping.zipCode}, {shipping.country}</p>
                    <p className="text-sm text-paw-muted">{shipping.email}{shipping.phone ? ` · ${shipping.phone}` : ""}</p>
                  </div>

                  {/* Items */}
                  <div className="mb-6">
                    <h4 className="mb-3 flex items-center gap-2 font-bold text-paw-ink">
                      <Package className="h-4 w-4 text-paw-primary" /> Items ({getItemCount(cart)})
                    </h4>
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex items-center gap-3 rounded-paw-sm bg-paw-panel-subtle p-3">
                          <ProductVisual product={item.product} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-paw-ink">{item.product.name}</p>
                            <p className="text-xs text-paw-muted">Qty {item.quantity} x {formatEuro(item.product.price)}</p>
                          </div>
                          <span className="text-sm font-bold tabular-nums">{formatEuro(item.product.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="mb-6 space-y-2 border-t border-paw-border pt-4">
                    <div className="flex justify-between text-sm text-paw-body"><span>Subtotal</span><span className="tabular-nums">{formatEuro(subtotal)}</span></div>
                    <div className="flex justify-between text-sm text-paw-body"><span>Shipping</span><span className="font-bold text-paw-success">Free</span></div>
                    <div className="flex justify-between border-t border-paw-border pt-2 text-xl font-extrabold text-paw-ink"><span>Total due</span><span className="tabular-nums">{formatEuro(subtotal)}</span></div>
                  </div>

                  {/* Stripe Pay Button */}
                  <div className="space-y-3">
                    <div className="rounded-paw-lg border border-paw-primary/20 bg-paw-primary-soft p-5">
                      <h3 className="flex items-center gap-2 text-lg font-extrabold text-paw-ink">
                        <Lock className="h-5 w-5 text-paw-primary" aria-hidden="true" />
                        Secure Stripe payment
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-paw-body">
                        The next step opens Stripe Checkout for card and wallet payment. Review the amount here before continuing.
                      </p>
                    </div>

                    {checkoutError && (
                      <StatusMessage tone="danger" title="Payment could not start">
                        {checkoutError}
                      </StatusMessage>
                    )}

                    {redirecting && (
                      <StatusMessage tone="info" title="Opening Stripe Checkout">
                        Keep this tab open while the secure payment page loads.
                      </StatusMessage>
                    )}

                    <button
                      type="button"
                      onClick={handleStripeCheckout}
                      disabled={redirecting}
                      aria-busy={redirecting}
                      className="flex min-h-16 w-full cursor-pointer items-center justify-center gap-3 rounded-paw-md bg-paw-primary px-4 py-4 text-lg font-extrabold text-white shadow-paw-action transition-colors hover:bg-paw-primary-hover focus:outline-none focus:ring-4 focus:ring-paw-primary/25 disabled:cursor-wait disabled:opacity-80"
                    >
                      {redirecting ? (
                        <>
                          <Loader2 className={`h-5 w-5 ${shouldReduceMotion ? "" : "animate-spin"}`} aria-hidden="true" />
                          Opening secure Stripe payment...
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          Pay {formatEuro(subtotal)} securely with Stripe
                          <ExternalLink className="w-4 h-4 opacity-60" />
                        </>
                      )}
                    </button>

                    <div className="flex items-start justify-center gap-2 text-center text-xs leading-5 text-paw-muted">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Secure payment powered by Stripe · PCI DSS Level 1 certified</span>
                    </div>

                    {/* Stripe badge */}
                    <div className="flex items-center justify-center gap-4 pt-2">
                      {["Visa", "Mastercard", "Amex", "Apple Pay"].map((brand) => (
                        <span key={brand} className="rounded border border-paw-border px-2 py-1 text-xs font-medium text-paw-muted">{brand}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1">
            <OrderSummary items={cart} loading={!cartLoaded} />
          </div>
        </div>
      </div>
    </div>
  );
}
