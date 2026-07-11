"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  ChevronDown,
  ChevronUp,
  MapPin,
  CreditCard,
  Clock,
  Truck,
  CheckCircle2,
  ShoppingBag,
} from "lucide-react";
import { Order, loadOrders } from "../storeData";
import ProductVisual from "../ProductVisual";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { useReducedMotionPreference } from "@/lib/useReducedMotionPreference";
import type { MessageKey } from "@/i18n/messages/en";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";

const ACCOUNT_FIXTURES_ENABLED =
  process.env.NEXT_PUBLIC_P3B1G1_ACCOUNT_FIXTURES === "1";

type OrdersTranslation = (key: MessageKey) => string;

type OrderStatus = Order["status"];

const STATUS_CONFIG: Record<
  OrderStatus,
  { tone: "warning" | "trust" | "success"; icon: typeof Clock }
> = {
  processing: { tone: "warning", icon: Clock },
  shipped: { tone: "trust", icon: Truck },
  delivered: { tone: "success", icon: CheckCircle2 },
};

const STATUS_INDEX: Record<OrderStatus, number> = {
  processing: 1,
  shipped: 2,
  delivered: 3,
};

function OrderCard({ order, t }: { order: Order; t: OrdersTranslation }) {
  const [expanded, setExpanded] = useState(false);
  const shouldReduceMotion = useReducedMotionPreference();
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.processing;
  const statusLabel =
    order.status === "shipped"
      ? t("ordersStatusShipped")
      : order.status === "delivered"
        ? t("ordersStatusDelivered")
        : t("ordersStatusProcessing");
  const progressSteps = [
    t("ordersProgressPlaced"),
    t("ordersStatusProcessing"),
    t("ordersStatusShipped"),
    t("ordersStatusDelivered"),
  ];
  const StatusIcon = status.icon;
  const date = new Date(order.createdAt);
  const dateStr = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const currentStatusIndex = STATUS_INDEX[order.status] ?? STATUS_INDEX.processing;

  return (
    <motion.div
      layout={!shouldReduceMotion}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : undefined}
    >
      <Card className="order-card-upgraded overflow-hidden transition-colors hover:border-paw-primary/35">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full cursor-pointer items-center gap-4 px-5 py-5 text-left transition-colors hover:bg-paw-panel-subtle sm:px-6"
          aria-expanded={expanded}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-paw-xl bg-paw-primary-soft text-paw-on-primary-soft">
            <Package className="h-6 w-6" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-sm font-bold text-paw-ink">{order.id}</p>
              <Badge tone={status.tone}>
                <StatusIcon className="h-3 w-3" aria-hidden="true" />
                {statusLabel}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-paw-muted">
              {dateStr} {t("ordersAt")} {timeStr} · {itemCount} {itemCount === 1 ? t("ordersItemSingular") : t("ordersItemPlural")}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="font-extrabold text-paw-ink">€{order.total.toFixed(2)}</p>
          </div>

          {expanded ? (
            <ChevronUp className="h-5 w-5 shrink-0 text-paw-muted" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0 text-paw-muted" aria-hidden="true" />
          )}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
              className="overflow-hidden"
            >
              <div className="space-y-5 border-t border-paw-border px-5 pb-6 pt-5 sm:px-6">
                <div className="flex flex-wrap items-center gap-2">
                  {progressSteps.map((label, index) => {
                    const done = index <= currentStatusIndex;
                    return (
                      <div key={label} className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${done ? "bg-paw-success" : "bg-paw-border"}`} />
                        <span className={`text-xs font-bold ${done ? "text-paw-success" : "text-paw-muted"}`}>
                          {label}
                        </span>
                        {index < PROGRESS_STEPS.length - 1 && (
                          <div className={`h-0.5 w-6 ${done ? "bg-paw-success/40" : "bg-paw-border"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-paw-ink">
                    <ShoppingBag className="h-4 w-4 text-paw-primary" aria-hidden="true" />
                    {t("ordersItemsTitle")}
                  </h4>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-3 rounded-paw-sm bg-paw-panel-subtle p-3">
                        <ProductVisual product={item.product} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-paw-ink">{item.product.name}</p>
                          <p className="text-xs text-paw-muted">€{item.product.price.toFixed(2)} × {item.quantity}</p>
                        </div>
                        <span className="text-sm font-extrabold text-paw-ink">
                          €{(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-paw-md border border-paw-border bg-paw-panel-subtle p-4">
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-paw-ink">
                      <MapPin className="h-4 w-4 text-paw-primary" aria-hidden="true" />
                      {t("ordersShippingTitle")}
                    </h4>
                    <p className="text-xs font-bold text-paw-body">{order.shipping.fullName}</p>
                    <p className="text-xs text-paw-muted">{order.shipping.address}</p>
                    <p className="text-xs text-paw-muted">{order.shipping.city}, {order.shipping.zipCode}</p>
                    <p className="text-xs text-paw-muted">{order.shipping.country}</p>
                  </div>
                  <div className="rounded-paw-md border border-paw-border bg-paw-panel-subtle p-4">
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-paw-ink">
                      <CreditCard className="h-4 w-4 text-paw-primary" aria-hidden="true" />
                      {t("ordersPaymentTitle")}
                    </h4>
                    <p className="text-xs font-bold text-paw-body">
                      {order.payment.brand} {t("ordersCardEndingIn")} ****{order.payment.last4}
                    </p>
                    <div className="mt-3 space-y-1.5">
                      <p className="flex justify-between text-xs text-paw-muted"><span>{t("ordersSubtotal")}</span><span>€{order.subtotal.toFixed(2)}</span></p>
                      <p className="flex justify-between text-xs text-paw-muted"><span>{t("ordersShippingTitle")}</span><span>{order.shippingCost === 0 ? t("ordersFree") : `€${order.shippingCost.toFixed(2)}`}</span></p>
                      <p className="flex justify-between text-xs text-paw-muted"><span>{t("ordersTax")}</span><span>€{order.tax.toFixed(2)}</span></p>
                      <p className="flex justify-between border-t border-paw-border pt-2 text-xs font-extrabold text-paw-ink">
                        <span>{t("ordersTotal")}</span><span>€{order.total.toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

export default function OrdersPage() {
  const { loader, t } = useRouteTranslations();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (ACCOUNT_FIXTURES_ENABLED) {
      import("@/lib/p3b1g1AccountFixtures").then(({ loadP3B1g1AccountFixtures }) => {
        if (!cancelled) setOrders(loadP3B1g1AccountFixtures().orders);
      });
    } else {
      queueMicrotask(() => {
        if (!cancelled) setOrders(loadOrders());
      });
    }
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="commerce-page-shell min-h-screen bg-paw-page pt-28 pb-20 text-paw-ink">
      {loader}
      <div className="mx-auto max-w-3xl px-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push("/store")}
          className="mb-6 -ml-2 text-paw-muted hover:text-paw-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("ordersBackToStore")}
        </Button>

        <div className="orders-hero-panel mb-8 flex items-end justify-between gap-4">
          <div>
            <Badge tone="primary" className="mb-3">{t("ordersPurchaseHistory")}</Badge>
            <h1 className="flex items-center gap-3 text-3xl font-extrabold text-paw-ink sm:text-4xl">
              <Package className="h-7 w-7 text-paw-primary" aria-hidden="true" />
              {t("ordersTitle")}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-paw-body">
              {t("ordersDescription")}
            </p>
          </div>
          <span className="orders-count-pill text-sm font-bold text-paw-muted">
            {orders.length} {orders.length === 1 ? t("ordersCountSingular") : t("ordersCountPlural")}
          </span>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title={t("ordersEmptyTitle")}
            description={t("ordersEmptyDescription")}
            className="orders-empty-state"
            action={
              <Button type="button" onClick={() => router.push("/store")}>
                {t("ordersBrowseProducts")}
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
