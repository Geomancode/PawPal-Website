"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Package, ArrowRight, Loader2 } from "lucide-react";
import { saveOrder, saveCart, generateOrderId, loadCart } from "../storeData";

interface StripeSession {
  id: string;
  status: string;
  customer_email: string;
  amount_total: number;
  currency: string;
  metadata: Record<string, string>;
  line_items: { name: string; quantity: number; amount: number }[];
}

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [session, setSession] = useState<StripeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderId] = useState(() => generateOrderId());

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID found");
      setLoading(false);
      return;
    }

    fetch(`/api/checkout/session?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setSession(data);

          // Save order to localStorage
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
    return (
      <div className="min-h-screen bg-[#fffdf9] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-amber-500" />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fffdf9] pt-28 flex items-center justify-center">
        <div className="glass rounded-2xl p-10 text-center max-w-md">
          <p className="text-red-500 font-medium mb-4">⚠️ {error}</p>
          <button
            onClick={() => router.push("/store")}
            className="px-6 py-3 bg-amber-500 text-white rounded-full font-bold cursor-pointer"
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffdf9] pt-28 pb-20">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-10 border border-gray-100 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, delay: 0.2 }}
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center"
          >
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </motion.div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful! 🎉</h2>
          <p className="text-gray-500 mb-2">Thank you for your purchase</p>

          <p className="text-sm bg-gray-50 inline-block px-4 py-2 rounded-full font-mono font-bold text-amber-600 mb-4">
            Order #{orderId}
          </p>

          {session && (
            <div className="text-left mt-6 space-y-4">
              {/* Amount */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                <p className="text-sm text-emerald-700">
                  💳 Paid <strong>€{((session.amount_total || 0) / 100).toFixed(2)}</strong> via Stripe
                </p>
              </div>

              {/* Items */}
              {session.line_items && session.line_items.length > 0 && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4 text-amber-500" /> Items
                  </h4>
                  <div className="space-y-2">
                    {session.line_items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.name} × {item.quantity}</span>
                        <span className="font-bold text-gray-700">€{(item.amount / 100).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confirmation email */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-sm text-amber-700">
                  📧 Receipt sent to <strong>{session.customer_email}</strong>.
                  Your order will ship within 1–2 business days.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/store/orders")}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-bold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              View My Orders <ArrowRight className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/store")}
              className="px-8 py-3 glass hover:bg-white/70 text-gray-700 rounded-full font-bold transition-all border border-gray-200 cursor-pointer"
            >
              Continue Shopping
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fffdf9] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
