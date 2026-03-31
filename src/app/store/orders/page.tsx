"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Package, ChevronDown, ChevronUp, MapPin,
  CreditCard, Clock, Truck, CheckCircle2, ShoppingBag,
} from "lucide-react";
import { Order, loadOrders } from "../storeData";

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof Clock; label: string }> = {
  processing: { color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: Clock, label: "Processing" },
  shipped: { color: "text-blue-600", bg: "bg-blue-50 border-blue-200", icon: Truck, label: "Shipped" },
  delivered: { color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2, label: "Delivered" },
};

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.processing;
  const StatusIcon = status.icon;
  const date = new Date(order.createdAt);
  const dateStr = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-gray-100 overflow-hidden hover:border-amber-200 transition-colors"
    >
      {/* Header Row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-5 flex items-center gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
      >
        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
          <Package className="w-6 h-6 text-amber-500" />
        </div>

        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-800 font-mono text-sm">{order.id}</p>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${status.bg} ${status.color}`}>
              <StatusIcon className="w-3 h-3" /> {status.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{dateStr} at {timeStr} · {itemCount} item{itemCount !== 1 ? "s" : ""}</p>
        </div>

        <div className="text-right shrink-0">
          <p className="font-extrabold text-gray-800">€{order.total.toFixed(2)}</p>
        </div>

        <div className="shrink-0 ml-2">
          {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {/* Expanded Detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
              {/* Order progress bar */}
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: "Order Placed", done: true },
                  { label: "Processing", done: order.status !== "processing" || true },
                  { label: "Shipped", done: order.status === "shipped" || order.status === "delivered" },
                  { label: "Delivered", done: order.status === "delivered" },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${s.done ? "bg-emerald-400" : "bg-gray-200"}`} />
                    <span className={`text-xs font-medium ${s.done ? "text-emerald-600" : "text-gray-400"}`}>{s.label}</span>
                    {i < 3 && <div className={`w-6 h-0.5 ${s.done ? "bg-emerald-300" : "bg-gray-200"}`} />}
                  </div>
                ))}
              </div>

              {/* Items */}
              <div>
                <h4 className="font-semibold text-gray-700 text-sm mb-2 flex items-center gap-1">
                  <ShoppingBag className="w-4 h-4 text-amber-500" /> Items
                </h4>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <span className="text-2xl">{item.product.image}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-400">€{item.product.price.toFixed(2)} × {item.quantity}</p>
                      </div>
                      <span className="font-bold text-sm text-gray-700">€{(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping & Payment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-gray-50">
                  <h4 className="font-semibold text-gray-700 text-sm mb-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-amber-500" /> Shipping</h4>
                  <p className="text-xs text-gray-600">{order.shipping.fullName}</p>
                  <p className="text-xs text-gray-500">{order.shipping.address}</p>
                  <p className="text-xs text-gray-500">{order.shipping.city}, {order.shipping.zipCode}</p>
                  <p className="text-xs text-gray-500">{order.shipping.country}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <h4 className="font-semibold text-gray-700 text-sm mb-1 flex items-center gap-1"><CreditCard className="w-3.5 h-3.5 text-amber-500" /> Payment</h4>
                  <p className="text-xs text-gray-600">{order.payment.brand} ending in ****{order.payment.last4}</p>
                  <div className="mt-2 space-y-0.5">
                    <p className="text-xs text-gray-500 flex justify-between"><span>Subtotal</span><span>€{order.subtotal.toFixed(2)}</span></p>
                    <p className="text-xs text-gray-500 flex justify-between"><span>Shipping</span><span>{order.shippingCost === 0 ? "Free" : `€${order.shippingCost.toFixed(2)}`}</span></p>
                    <p className="text-xs text-gray-500 flex justify-between"><span>Tax</span><span>€{order.tax.toFixed(2)}</span></p>
                    <p className="text-xs text-gray-800 font-bold flex justify-between pt-1 border-t"><span>Total</span><span>€{order.total.toFixed(2)}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Orders Page ───────────────────────────────────────
export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => { setOrders(loadOrders()); }, []);

  return (
    <div className="min-h-screen bg-[#fffdf9] pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-4">
        <button
          onClick={() => router.push("/store")}
          className="flex items-center gap-1 text-gray-500 hover:text-amber-600 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </button>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-7 h-7 text-amber-500" /> My Orders
          </h1>
          <span className="text-sm text-gray-400">{orders.length} order{orders.length !== 1 ? "s" : ""}</span>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 glass rounded-2xl border border-gray-100">
            <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-400 mb-2">No orders yet</h3>
            <p className="text-sm text-gray-300 mb-6">Start shopping and your orders will appear here</p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/store")}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-bold transition-all shadow-lg cursor-pointer"
            >
              Browse Products
            </motion.button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
