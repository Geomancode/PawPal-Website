"use client";

import {
  useState,
  useEffect,
  useSyncExternalStore,
  type HTMLInputTypeAttribute,
} from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Package, MapPin, CreditCard,
  Truck, ShieldCheck, Lock, Loader2, ExternalLink,
} from "lucide-react";
import {
  CartItem, ShippingInfo,
  loadCart,
} from "../storeData";
import ProductVisual from "../ProductVisual";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  StatusMessage,
  buttonClassName,
} from "@/components/ui";
import type { MessageKey } from "@/i18n/messages/en";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";

const STEPS = [
  { id: 1, icon: MapPin },
  { id: 2, icon: Package },
  { id: 3, icon: CreditCard },
] as const;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const ACCOUNT_FIXTURES_ENABLED =
  process.env.NEXT_PUBLIC_P3B1G1_ACCOUNT_FIXTURES === "1";

type CheckoutTranslation = (key: MessageKey) => string;

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

// ─── Step Indicator ────────────────────────────────────
function StepIndicator({ current, t }: { current: number; t: CheckoutTranslation }) {
  return (
    <Card
      variant="panel"
      className="mb-10 flex items-center justify-center gap-2 overflow-x-auto p-paw-sm"
      aria-label={t("checkoutStepsAriaLabel")}
    >
      {STEPS.map((step, i) => {
        const done = current > step.id;
        const active = current === step.id;
        const label =
          step.id === 1
            ? t("checkoutStepShipping")
            : step.id === 2
              ? t("checkoutStepReview")
              : t("checkoutStepPayment");
        return (
          <div key={step.id} className="flex items-center gap-2">
            <Badge
              tone={done ? "success" : active ? "primary" : "neutral"}
              variant="filter"
              className={
                active
                  ? "bg-paw-primary text-paw-on-primary shadow-paw-action"
                  : undefined
              }
              aria-current={active ? "step" : undefined}
            >
              <step.icon className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{label}</span>
            </Badge>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-8 ${done ? "bg-paw-success" : "bg-paw-border"}`} />
            )}
          </div>
        );
      })}
    </Card>
  );
}

// ─── Input Field ───────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = "text", required = true }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; type?: HTMLInputTypeAttribute; required?: boolean;
}) {
  return (
    <Input
      label={required ? `${label} *` : label}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
    />
  );
}

// ─── Order Summary Sidebar ─────────────────────────────
function OrderSummary({ items, t }: { items: CartItem[]; t: CheckoutTranslation }) {
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  return (
    <Card variant="panel">
      <CardContent>
      <h3 className="mb-4 flex items-center gap-2 font-extrabold text-paw-ink">
        <Package className="h-4 w-4 text-paw-primary" /> {t("checkoutOrderSummaryTitle")}
      </h3>
      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
        {items.map((item) => (
          <div key={item.product.id} className="flex items-center gap-3">
            <ProductVisual product={item.product} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-bold text-paw-ink">{item.product.name}</p>
              <p className="text-xs text-paw-muted">{t("checkoutQuantityPrefix")} {item.quantity}</p>
            </div>
            <span className="text-sm font-extrabold text-paw-ink">€{(item.product.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="space-y-2 border-t border-paw-border pt-3">
        <div className="flex justify-between text-sm text-paw-body"><span>{t("checkoutSubtotal")}</span><span>€{subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm text-paw-body">
          <span>{t("checkoutShipping")}</span>
          <span className="font-bold text-paw-on-success-soft">{t("checkoutFree")}</span>
        </div>
        <div className="flex justify-between border-t border-paw-border pt-2 text-lg font-extrabold text-paw-ink"><span>{t("checkoutTotal")}</span><span>€{subtotal.toFixed(2)}</span></div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-paw-sm border border-paw-trust/20 bg-paw-trust-soft p-3">
        <ShieldCheck className="h-4 w-4 shrink-0 text-paw-on-trust-soft" />
        <p className="text-xs text-paw-on-trust-soft">{t("checkoutSecuredByStripe")}</p>
      </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Checkout Page ────────────────────────────────
export default function CheckoutPage() {
  const { loader, t } = useRouteTranslations();
  const router = useRouter();
  const shouldReduceMotion = useHydratedReducedMotion();
  const [step, setStep] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [redirecting, setRedirecting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [shipping, setShipping] = useState<ShippingInfo>({
    fullName: "", email: "", address: "", city: "", zipCode: "", country: "", phone: "",
  });

  useEffect(() => {
    let cancelled = false;
    if (ACCOUNT_FIXTURES_ENABLED) {
      import("@/lib/p3b1g1AccountFixtures").then(({ loadP3B1g1AccountFixtures }) => {
        if (cancelled) return;
        const fixture = loadP3B1g1AccountFixtures().checkout;
        setCart(fixture.cart);
        setShipping(fixture.shipping);
      });
    } else {
      queueMicrotask(() => {
        const loaded = loadCart();
        if (cancelled) return;
        if (loaded.length === 0) {
          router.push("/store");
        }
        setCart(loaded);
      });
    }
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
        setCheckoutError(data.error || t("checkoutStartError"));
        setRedirecting(false);
      }
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : t("checkoutNetworkError"));
      setRedirecting(false);
    }
  };

  return (
    <div className="commerce-page-shell min-h-screen bg-paw-page pt-28 pb-20 text-paw-ink">
      {loader}
      <div className="max-w-5xl mx-auto px-4">
        {/* Back button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => step === 1 ? router.push("/store") : setStep(step - 1)}
          className="mb-6 -ml-2 text-paw-muted hover:text-paw-primary"
        >
          <ArrowLeft className="w-4 h-4" /> {step === 1 ? t("checkoutBackToStore") : t("checkoutBack")}
        </Button>

        <Card
          variant="hero"
          className="mb-8 flex flex-col items-start justify-between gap-5 p-paw-xl sm:flex-row sm:items-end"
        >
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-paw-primary">{t("checkoutShopEyebrow")}</p>
            <h1 className="mt-2 text-3xl font-extrabold text-paw-ink sm:text-5xl">{t("checkoutTitle")}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-paw-body sm:text-base">
              {t("checkoutDescription")}
            </p>
          </div>
          <div className="checkout-assurance-grid">
            {[
              { icon: Lock, label: t("checkoutAssuranceStripe") },
              { icon: Truck, label: t("checkoutAssuranceFreeShipping") },
              { icon: ShieldCheck, label: t("checkoutAssuranceNfc") },
            ].map((item) => (
              <Card
                key={item.label}
                variant="compact"
                elevation="none"
                className="flex items-center gap-paw-sm p-paw-sm text-sm font-black text-paw-body"
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Card>
            ))}
          </div>
        </Card>

        <StepIndicator current={step} t={t} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Main Content ── */}
          <div className="lg:col-span-2">
            <>
              {/* ────── STEP 1: SHIPPING ────── */}
              {step === 1 && (
                <motion.div
                  key="shipping"
                  {...checkoutStepMotion(shouldReduceMotion)}
                >
                  <Card variant="panel">
                    <CardContent className="p-8">
                  <h2 className="mb-6 flex items-center gap-2 text-2xl font-extrabold text-paw-ink">
                    <MapPin className="h-5 w-5 text-paw-primary" /> {t("checkoutShippingInformation")}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Field label={t("checkoutFullNameLabel")} value={shipping.fullName} onChange={(v) => setShipping({ ...shipping, fullName: v })} placeholder={t("checkoutFullNamePlaceholder")} />
                    </div>
                    <Field label={t("checkoutEmailLabel")} value={shipping.email} onChange={(v) => setShipping({ ...shipping, email: v })} placeholder={t("checkoutEmailPlaceholder")} type="email" />
                    <Field label={t("checkoutPhoneLabel")} value={shipping.phone} onChange={(v) => setShipping({ ...shipping, phone: v })} placeholder={t("checkoutPhonePlaceholder")} type="tel" />
                    <div className="sm:col-span-2">
                      <Field label={t("checkoutStreetAddressLabel")} value={shipping.address} onChange={(v) => setShipping({ ...shipping, address: v })} placeholder={t("checkoutStreetAddressPlaceholder")} />
                    </div>
                    <Field label={t("checkoutCityLabel")} value={shipping.city} onChange={(v) => setShipping({ ...shipping, city: v })} placeholder={t("checkoutCityPlaceholder")} />
                    <Field label={t("checkoutZipCodeLabel")} value={shipping.zipCode} onChange={(v) => setShipping({ ...shipping, zipCode: v })} placeholder={t("checkoutZipCodePlaceholder")} />
                    <div className="sm:col-span-2">
                      <Field label={t("checkoutCountryLabel")} value={shipping.country} onChange={(v) => setShipping({ ...shipping, country: v })} placeholder={t("checkoutCountryPlaceholder")} />
                    </div>
                  </div>

                  {!emailLooksValid && shipping.email && (
                    <StatusMessage tone="warning" variant="compact" className="mt-5" title={t("checkoutEmailWarningTitle")}>
                      {t("checkoutEmailWarningDescription")}
                    </StatusMessage>
                  )}

                  <div className="mt-6 flex items-center gap-3 rounded-paw-md border border-paw-success/20 bg-paw-success-soft p-4">
                    <Truck className="h-5 w-5 shrink-0 text-paw-on-success-soft" />
                    <p className="text-sm text-paw-on-success-soft">{t("checkoutDeliveryEstimate")}</p>
                  </div>

                  <motion.button
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                    disabled={!canProceedShipping}
                    onClick={() => setStep(2)}
                    className={buttonClassName({ size: "lg", className: "mt-6 w-full text-lg" })}
                  >
                    {t("checkoutReviewOrderButton")} <ArrowRight className="w-5 h-5" />
                  </motion.button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* ────── STEP 2: REVIEW & PAY ────── */}
              {step === 2 && (
                <motion.div
                  key="review"
                  {...checkoutStepMotion(shouldReduceMotion)}
                >
                  <Card variant="panel">
                    <CardContent className="p-8">
                  <h2 className="mb-6 flex items-center gap-2 text-2xl font-extrabold text-paw-ink">
                    <Package className="h-5 w-5 text-paw-primary" /> {t("checkoutReviewTitle")}
                  </h2>

                  {/* Shipping summary */}
                  <div className="mb-6 rounded-paw-md border border-paw-border bg-paw-panel-subtle p-4">
                    <h4 className="mb-2 flex items-center gap-2 font-bold text-paw-ink"><MapPin className="h-4 w-4 text-paw-primary" /> {t("checkoutShippingTo")}</h4>
                    <p className="text-sm text-paw-body">{shipping.fullName}</p>
                    <p className="text-sm text-paw-muted">{shipping.address}</p>
                    <p className="text-sm text-paw-muted">{shipping.city}, {shipping.zipCode}, {shipping.country}</p>
                    <p className="text-sm text-paw-muted">{shipping.email} · {shipping.phone}</p>
                  </div>

                  {/* Items */}
                  <div className="mb-6">
                    <h4 className="mb-3 flex items-center gap-2 font-bold text-paw-ink"><Package className="h-4 w-4 text-paw-primary" /> {t("checkoutItems")} ({cart.length})</h4>
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex items-center gap-3 rounded-paw-sm bg-paw-panel-subtle p-3">
                          <ProductVisual product={item.product} size="sm" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-paw-ink">{item.product.name}</p>
                            <p className="text-xs text-paw-muted">{t("checkoutQuantityPrefix")} {item.quantity}</p>
                          </div>
                          <span className="font-bold text-sm">€{(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="mb-6 space-y-2 border-t border-paw-border pt-4">
                    <div className="flex justify-between text-sm text-paw-body"><span>{t("checkoutSubtotal")}</span><span>€{subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm text-paw-body"><span>{t("checkoutShipping")}</span><span className="font-bold text-paw-on-success-soft">{t("checkoutFree")}</span></div>
                    <div className="flex justify-between border-t border-paw-border pt-2 text-xl font-extrabold text-paw-ink"><span>{t("checkoutTotal")}</span><span>€{subtotal.toFixed(2)}</span></div>
                  </div>

                  {/* Stripe Pay Button */}
                  <div className="space-y-3">
                    {checkoutError && (
                      <StatusMessage tone="danger" title={t("checkoutPaymentStartErrorTitle")}>
                        {checkoutError}
                      </StatusMessage>
                    )}

                    <motion.button
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                      onClick={handleStripeCheckout}
                      disabled={redirecting}
                      className={buttonClassName({ size: "lg", className: "w-full text-lg" })}
                    >
                      {redirecting ? (
                        <>
                          <motion.div
                            animate={shouldReduceMotion ? { rotate: 0 } : { rotate: 360 }}
                            transition={shouldReduceMotion ? { duration: 0 } : { repeat: Infinity, duration: 1, ease: "linear" }}
                          >
                            <Loader2 className="w-5 h-5" />
                          </motion.div>
                          {t("checkoutRedirectingToStripe")}
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          {t("checkoutPayPrefix")} €{subtotal.toFixed(2)} {t("checkoutWithStripeSuffix")}
                          <ExternalLink className="w-4 h-4 opacity-60" />
                        </>
                      )}
                    </motion.button>

                    <div className="flex items-center justify-center gap-2 text-xs text-paw-muted">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{t("checkoutSecurePaymentNote")}</span>
                    </div>

                    {/* Stripe badge */}
                    <div className="flex items-center justify-center gap-4 pt-2">
                      {["Visa", "Mastercard", "Amex", "Apple Pay"].map((brand) => (
                        <span key={brand} className="rounded-paw-sm border border-paw-outline-variant bg-paw-panel-subtle px-2 py-1 text-xs font-bold text-paw-muted">{brand}</span>
                      ))}
                    </div>
                  </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1">
            <OrderSummary items={cart} t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}
