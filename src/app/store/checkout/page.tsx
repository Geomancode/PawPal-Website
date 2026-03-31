"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Package, MapPin, CreditCard,
  CheckCircle2, Truck, ShieldCheck, Lock, Loader2, ExternalLink,
} from "lucide-react";
import {
  CartItem, ShippingInfo,
  loadCart,
} from "../storeData";

const STEPS = [
  { id: 1, label: "Shipping", icon: MapPin },
  { id: 2, label: "Review", icon: Package },
  { id: 3, label: "Payment", icon: CreditCard },
];

// ─── Step Indicator ────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {STEPS.map((step, i) => {
        const done = current > step.id;
        const active = current === step.id;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              active ? "bg-amber-500 text-white shadow-md" : done ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"
            }`}>
              <step.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 ${done ? "bg-emerald-300" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Input Field ───────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = "text", required = true }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}{required && <span className="text-rose-400">*</span>}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all bg-white text-gray-800"
      />
    </div>
  );
}

// ─── Order Summary Sidebar ─────────────────────────────
function OrderSummary({ items }: { items: CartItem[] }) {
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  return (
    <div className="glass rounded-2xl p-6 border border-gray-100">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Package className="w-4 h-4 text-amber-500" /> Order Summary
      </h3>
      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
        {items.map((item) => (
          <div key={item.product.id} className="flex items-center gap-3">
            <span className="text-2xl">{item.product.image}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{item.product.name}</p>
              <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
            </div>
            <span className="text-sm font-bold text-gray-700">€{(item.product.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="border-t pt-3 space-y-2">
        <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>€{subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Shipping</span>
          <span className="text-emerald-500 font-medium">Free</span>
        </div>
        <div className="flex justify-between text-lg font-extrabold pt-2 border-t"><span>Total</span><span>€{subtotal.toFixed(2)}</span></div>
      </div>
      <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
        <p className="text-xs text-blue-600">Secured by <strong>Stripe</strong></p>
      </div>
    </div>
  );
}

// ─── Main Checkout Page ────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [redirecting, setRedirecting] = useState(false);

  const [shipping, setShipping] = useState<ShippingInfo>({
    fullName: "", email: "", address: "", city: "", zipCode: "", country: "", phone: "",
  });

  useEffect(() => {
    const loaded = loadCart();
    if (loaded.length === 0) {
      router.push("/store");
    }
    setCart(loaded);
  }, [router]);

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const canProceedShipping = shipping.fullName && shipping.email && shipping.address && shipping.city && shipping.zipCode && shipping.country;

  // Redirect to Stripe Checkout
  const handleStripeCheckout = async () => {
    setRedirecting(true);
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
          })),
          shipping,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session: " + (data.error || "Unknown error"));
        setRedirecting(false);
      }
    } catch (err) {
      alert("Network error: " + (err instanceof Error ? err.message : "Unknown"));
      setRedirecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdf9] pt-28 pb-20">
      <div className="max-w-5xl mx-auto px-4">
        {/* Back button */}
        <button
          onClick={() => step === 1 ? router.push("/store") : setStep(step - 1)}
          className="flex items-center gap-1 text-gray-500 hover:text-amber-600 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> {step === 1 ? "Back to Store" : "Back"}
        </button>

        <StepIndicator current={step} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Main Content ── */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* ────── STEP 1: SHIPPING ────── */}
              {step === 1 && (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="glass rounded-2xl p-8 border border-gray-100"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-500" /> Shipping Information
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Field label="Full Name" value={shipping.fullName} onChange={(v) => setShipping({ ...shipping, fullName: v })} placeholder="John Doe" />
                    </div>
                    <Field label="Email" value={shipping.email} onChange={(v) => setShipping({ ...shipping, email: v })} placeholder="john@example.com" type="email" />
                    <Field label="Phone" value={shipping.phone} onChange={(v) => setShipping({ ...shipping, phone: v })} placeholder="+32 XXX XXX XXX" type="tel" />
                    <div className="sm:col-span-2">
                      <Field label="Street Address" value={shipping.address} onChange={(v) => setShipping({ ...shipping, address: v })} placeholder="123 Pet Street" />
                    </div>
                    <Field label="City" value={shipping.city} onChange={(v) => setShipping({ ...shipping, city: v })} placeholder="Ghent" />
                    <Field label="Zip Code" value={shipping.zipCode} onChange={(v) => setShipping({ ...shipping, zipCode: v })} placeholder="9000" />
                    <div className="sm:col-span-2">
                      <Field label="Country" value={shipping.country} onChange={(v) => setShipping({ ...shipping, country: v })} placeholder="Belgium" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                    <Truck className="w-5 h-5 text-emerald-500 shrink-0" />
                    <p className="text-sm text-emerald-700">Free shipping on all orders. Estimated delivery: 3–5 business days.</p>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={!canProceedShipping}
                    onClick={() => setStep(2)}
                    className={`mt-6 w-full py-3.5 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      canProceedShipping ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Review Order <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              )}

              {/* ────── STEP 2: REVIEW & PAY ────── */}
              {step === 2 && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="glass rounded-2xl p-8 border border-gray-100"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-500" /> Review Your Order
                  </h2>

                  {/* Shipping summary */}
                  <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-2"><MapPin className="w-4 h-4 text-amber-500" /> Shipping To</h4>
                    <p className="text-sm text-gray-600">{shipping.fullName}</p>
                    <p className="text-sm text-gray-500">{shipping.address}</p>
                    <p className="text-sm text-gray-500">{shipping.city}, {shipping.zipCode}, {shipping.country}</p>
                    <p className="text-sm text-gray-500">{shipping.email} · {shipping.phone}</p>
                  </div>

                  {/* Items */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-3"><Package className="w-4 h-4 text-amber-500" /> Items ({cart.length})</h4>
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                          <span className="text-2xl">{item.product.image}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">{item.product.name}</p>
                            <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                          </div>
                          <span className="font-bold text-sm">€{(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t pt-4 space-y-2 mb-6">
                    <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>€{subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm text-gray-500"><span>Shipping</span><span className="text-emerald-500 font-medium">Free</span></div>
                    <div className="flex justify-between text-xl font-extrabold pt-2 border-t"><span>Total</span><span>€{subtotal.toFixed(2)}</span></div>
                  </div>

                  {/* Stripe Pay Button */}
                  <div className="space-y-3">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleStripeCheckout}
                      disabled={redirecting}
                      className="w-full bg-[#635BFF] hover:bg-[#5851DB] text-white py-4 rounded-full font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg cursor-pointer disabled:opacity-60"
                    >
                      {redirecting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          >
                            <Loader2 className="w-5 h-5" />
                          </motion.div>
                          Redirecting to Stripe...
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          Pay €{subtotal.toFixed(2)} with Stripe
                          <ExternalLink className="w-4 h-4 opacity-60" />
                        </>
                      )}
                    </motion.button>

                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Secure payment powered by Stripe · PCI DSS Level 1 certified</span>
                    </div>

                    {/* Stripe badge */}
                    <div className="flex items-center justify-center gap-4 pt-2">
                      {["Visa", "Mastercard", "Amex", "Apple Pay"].map((brand) => (
                        <span key={brand} className="text-xs font-medium text-gray-300 px-2 py-1 rounded border border-gray-100">{brand}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1">
            <OrderSummary items={cart} />
          </div>
        </div>
      </div>
    </div>
  );
}
