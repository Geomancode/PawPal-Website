"use client";

import { Suspense, useState, useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShoppingCart, Plus, Minus, Trash2, ArrowRight,
  Search, SlidersHorizontal, ChevronRight, RefreshCw,
  ShieldCheck, Sparkles, Crown, CheckCircle2, Loader2,
  Bone, Dumbbell, HeartPulse, ShoppingBag, Tags, Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  PRODUCTS, CATEGORIES, Product, CartItem, Category,
  checkStoreAdmin,
  fetchCatalogProducts,
  formatOptionalPrice,
  formatPrice,
  loadCart, saveCart,
  withProductAssetOverrides,
} from "./storeData";
import ProductVisual from "./ProductVisual";
import { useAuth } from "@/components/AuthProvider";
import {
  paidTierFromValue,
  SUBSCRIPTION_PLANS,
  type SubscriptionTier,
} from "@/lib/subscriptions";
import {
  Badge,
  Button,
  Card,
  buttonClassName,
  EmptyState,
  Input,
  PageShell,
  ProductCard as StoreProductCard,
  Sheet,
  StatusMessage,
} from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/messages/en";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  all: ShoppingBag,
  food: Bone,
  toys: Dumbbell,
  accessories: Tags,
  health: HeartPulse,
};

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const ACCOUNT_FIXTURES_ENABLED =
  process.env.NEXT_PUBLIC_P3B1G1_ACCOUNT_FIXTURES === "1";
const STORE_METRIC_CLASSES = {
  shellTopSpacing: "pt-[112px] sm:pt-[128px]",
  loadingShellTopSpacing: "pt-[112px]",
  quantityControlSize: "h-[28px] w-[28px]",
  quantityLabelWidth: "w-[28px]",
  compactIconSize: "h-[14px] w-[14px]",
  floatingCartSize: "h-[64px] w-[64px]",
  toastBottomOffset: "bottom-[112px]",
} as const;

type StoreTranslation = (key: MessageKey) => string;

function fadeUpMotion(shouldReduceMotion: boolean | null, y: number, delay = 0) {
  void y;
  return {
    initial: false,
    animate: { opacity: 1, y: 0 },
    transition: shouldReduceMotion
      ? { duration: 0 }
      : delay > 0
        ? { delay }
        : undefined,
  };
}

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

function SubscriptionUpgradePanel({
  initialTier,
  source,
  appUserId,
  appEmail,
  accessToken,
  t,
}: {
  initialTier: Exclude<SubscriptionTier, "free">;
  source: string;
  appUserId: string | null;
  appEmail: string | null;
  accessToken?: string;
  t: StoreTranslation;
}) {
  const shouldReduceMotion = useHydratedReducedMotion();
  const [selectedTier, setSelectedTier] =
    useState<Exclude<SubscriptionTier, "free">>(initialTier);
  const [loadingTier, setLoadingTier] =
    useState<Exclude<SubscriptionTier, "free"> | null>(null);
  const [error, setError] = useState("");

  const startCheckout = async (tier: Exclude<SubscriptionTier, "free">) => {
    setSelectedTier(tier);
    setLoadingTier(tier);
    setError("");
    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          tier,
          userId: appUserId,
          email: appEmail,
          source,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || t("storeCheckoutStartError"));
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("storeSubscriptionCheckoutFailed"));
      setLoadingTier(null);
    }
  };

  return (
    <PageShell className={STORE_METRIC_CLASSES.shellTopSpacing} contentClassName="space-y-paw-xl">
      <div className="max-w-2xl">
        <Badge tone="primary" variant="semantic" className="mb-paw-lg">
          <Sparkles className="h-paw-md w-paw-md" aria-hidden="true" />
          {t("storeUpgradeBadge")}
        </Badge>
        <h1 className="font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">
          {t("storeUpgradeTitle")}
        </h1>
        <p className="mt-paw-md text-paw-type-body text-paw-body">
          {t("storeUpgradeCopy")}
        </p>
      </div>

      {error && (
        <StatusMessage tone="critical" variant="compact">
          {error}
        </StatusMessage>
      )}

      <div className="grid gap-paw-lg md:grid-cols-2">
        {(["basic", "pro"] as const).map((tier) => {
          const plan = SUBSCRIPTION_PLANS[tier];
          const active = selectedTier === tier;
          const busy = loadingTier === tier;
          return (
            <motion.div
              key={tier}
              {...fadeUpMotion(shouldReduceMotion, 18)}
            >
              <Card
                variant="panel"
                selected={active}
                className="h-full p-paw-xl"
              >
                <div className="mb-paw-lg flex items-start justify-between gap-paw-md">
                  <div>
                    <div className="mb-paw-sm flex h-paw-min-tap w-paw-min-tap items-center justify-center rounded-paw-control bg-paw-primary-soft text-paw-on-primary-soft">
                      {tier === "pro" ? (
                        <Crown className="h-paw-lg w-paw-lg" aria-hidden="true" />
                      ) : (
                        <Sparkles className="h-paw-lg w-paw-lg" aria-hidden="true" />
                      )}
                    </div>
                    <h2 className="text-paw-type-h2 font-black text-paw-ink">
                      {plan.name}
                    </h2>
                    <p className="mt-paw-sm text-sm leading-6 text-paw-body">
                      {plan.summary}
                    </p>
                  </div>
                  {plan.highlight && (
                    <Badge tone="success" variant="semantic" size="sm">
                      {t("storeRecommended")}
                    </Badge>
                  )}
                </div>

                <div className="mb-paw-lg flex items-end gap-paw-xs">
                  <span className="text-paw-type-metric font-black text-paw-ink">
                    €{plan.monthlyPrice.toFixed(2)}
                  </span>
                  <span className="pb-paw-xxs text-sm font-bold text-paw-muted">
                    {t("storePricePerMonth")}
                  </span>
                </div>

                <div className="mb-paw-xl space-y-paw-sm">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-paw-xs text-sm text-paw-body">
                      <CheckCircle2 className="mt-0.5 h-paw-md w-paw-md shrink-0 text-paw-on-success-soft" aria-hidden="true" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  size="lg"
                  variant={tier === "pro" ? "accent" : "primary"}
                  disabled={Boolean(loadingTier)}
                  onClick={() => startCheckout(tier)}
                  className="w-full"
                >
                  {busy && <Loader2 className="h-paw-md w-paw-md animate-spin" aria-hidden="true" />}
                  {t("storeUpgradeButtonPrefix")} {plan.name}
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card variant="compact" className="p-paw-md text-sm leading-6 text-paw-body">
        {t("storeFreeFeaturesNote")}
      </Card>
    </PageShell>
  );
}

// ─── Product Card ──────────────────────────────────────
function ProductCard({
  product, onAdd, onDetails, t, recommended = false,
}: {
  product: Product;
  onAdd: (p: Product) => void;
  onDetails: (p: Product) => void;
  t: StoreTranslation;
  recommended?: boolean;
}) {
  const shouldReduceMotion = useHydratedReducedMotion();
  const badgeTone: Record<NonNullable<Product["badge"]>, "success" | "warning" | "accent"> = {
    New: "success",
    "Best Seller": "warning",
    Sale: "accent",
  };

  return (
    <motion.div
      layout={!shouldReduceMotion}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
      whileHover={shouldReduceMotion ? undefined : { y: -6 }}
      className="relative"
    >
      {recommended && (
        <Badge
          tone="primary"
          variant="semantic"
          size="sm"
          className="absolute right-paw-sm top-paw-sm z-10"
        >
          <Sparkles className="h-paw-sm w-paw-sm" aria-hidden="true" />
          {t("storeAiPick")}
        </Badge>
      )}
      <StoreProductCard
        name={product.name}
        description={product.description}
        price={formatPrice(product)}
        originalPrice={formatOptionalPrice(product)}
        image={<ProductVisual product={product} size="lg" className="store-product-preview" />}
        badge={product.badge}
        badgeTone={product.badge ? badgeTone[product.badge] : undefined}
        rating={product.rating}
        ratingDetail={`(${product.reviewCount})`}
        detailsLabel={t("storeProductDetailsButton")}
        onDetails={() => onDetails(product)}
        actionLabel={t("storeAddButton")}
        onAction={() => onAdd(product)}
        className={
          recommended
            ? "border-paw-primary shadow-paw-floating ring-2 ring-paw-primary/25"
            : undefined
        }
      />
    </motion.div>
  );
}

function ProductDetailsDrawer({
  product,
  onClose,
  t,
}: {
  product: Product | null;
  onClose: () => void;
  t: StoreTranslation;
}) {

  return (
    <Sheet
      open={Boolean(product)}
      onClose={onClose}
      ariaLabel={product ? `${product.name} ${t("storeProductDetailsAriaSuffix")}` : t("storeProductDetailsTitle")}
      title={product?.name}
      description={product?.description}
      panelClassName="max-w-2xl"
    >
      {product && (
        <div className="space-y-paw-lg">
          <Card variant="compact" tone="subtle" elevation="none" className="flex flex-wrap items-center justify-between gap-paw-sm p-paw-md">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-paw-muted">
                {t("storeProductDetailsTitle")}
              </p>
              <p className="mt-paw-xxs text-2xl font-extrabold text-paw-primary">
                {formatPrice(product)}
              </p>
            </div>
            {product.badge && (
              <Badge tone="primary" variant="semantic" size="sm">
                {product.badge}
              </Badge>
            )}
          </Card>

          {product.detailImages?.length ? (
            <div className="space-y-paw-md">
              {product.detailImages.map((image) => (
                <Image
                  key={image.src}
                  src={image.src}
                  alt={image.alt}
                  width={1024}
                  height={1536}
                  sizes="(min-width: 768px) 640px, calc(100vw - 40px)"
                  className="h-auto w-full rounded-paw-panel border border-paw-border bg-paw-panel object-contain shadow-paw-panel"
                  loading="lazy"
                />
              ))}
            </div>
          ) : (
            <Card variant="compact" tone="subtle" elevation="none" className="flex justify-center p-paw-xxl">
              <ProductVisual product={product} size="lg" />
            </Card>
          )}
        </div>
      )}
    </Sheet>
  );
}

// ─── Cart Drawer ───────────────────────────────────────
function CartDrawer({
  isOpen, onClose, items, onUpdate, onRemove, t,
}: {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdate: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  t: StoreTranslation;
}) {
  const { path } = useI18n();
  const shouldReduceMotion = useHydratedReducedMotion();
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      ariaLabel={`${t("storeCartAriaPrefix")} (${items.length})`}
      title={
        <span className="inline-flex items-center gap-paw-xs">
          <ShoppingCart className="h-paw-lg w-paw-lg text-paw-primary" aria-hidden="true" />
          {t("storeCartTitle")} ({items.length})
        </span>
      }
      footer={
        items.length > 0 ? (
          <div className="space-y-paw-sm">
            <div className="flex justify-between text-sm text-paw-body">
              <span>{t("storeSubtotal")}</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-paw-body">
              <span>{t("storeShipping")}</span>
              <span>
                {shipping === 0 ? (
                  <span className="font-bold text-paw-success">{t("storeFreeShipping")}</span>
                ) : (
                  `€${shipping.toFixed(2)}`
                )}
              </span>
            </div>
            {subtotal < 50 && (
              <p className="rounded-paw-sm bg-paw-warning-soft px-paw-sm py-paw-xs text-xs font-semibold text-paw-body">
                {t("storeAddAmountPrefix")} €{(50 - subtotal).toFixed(2)} {t("storeFreeShippingSuffix")}
              </p>
            )}
            <div className="flex justify-between border-t border-paw-border pt-paw-sm text-lg font-extrabold text-paw-ink">
              <span>{t("storeTotal")}</span>
              <span>€{total.toFixed(2)}</span>
            </div>
            <Link
              href={path("/store/checkout")}
              className={buttonClassName({ size: "lg", className: "w-full" })}
            >
              {t("storeProceedToCheckout")} <ArrowRight className="h-paw-lg w-paw-lg" aria-hidden="true" />
            </Link>
          </div>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={t("storeCartEmptyTitle")}
          description={t("storeCartEmptyDescription")}
        />
      ) : (
        <div className="space-y-paw-md">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.product.id}
                layout={!shouldReduceMotion}
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, x: -20 }}
                className="flex gap-paw-md rounded-paw-card border border-paw-border bg-paw-panel-subtle p-paw-sm"
              >
                <ProductVisual product={item.product} size="md" />
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-extrabold text-paw-ink">
                    {item.product.name}
                  </h4>
                  <p className="mt-0.5 text-sm font-bold text-paw-primary">
                    €{item.product.price.toFixed(2)}
                  </p>
                  <div className="mt-paw-xs flex items-center gap-paw-xs">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      shape="compact"
                      className={STORE_METRIC_CLASSES.quantityControlSize}
                      onClick={() => onUpdate(item.product.id, item.quantity - 1)}
                      aria-label={`${t("storeDecreasePrefix")} ${item.product.name}`}
                    >
                      <Minus className="h-paw-sm w-paw-sm" aria-hidden="true" />
                    </Button>
                    <span className={`${STORE_METRIC_CLASSES.quantityLabelWidth} text-center text-sm font-extrabold text-paw-ink`}>
                      {item.quantity}
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      shape="compact"
                      className={STORE_METRIC_CLASSES.quantityControlSize}
                      onClick={() => onUpdate(item.product.id, item.quantity + 1)}
                      aria-label={`${t("storeIncreasePrefix")} ${item.product.name}`}
                    >
                      <Plus className="h-paw-sm w-paw-sm" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-paw-xxl w-paw-xxl text-paw-muted hover:text-paw-danger"
                    onClick={() => onRemove(item.product.id)}
                    aria-label={`${t("storeRemovePrefix")} ${item.product.name}`}
                  >
                    <Trash2 className="h-paw-md w-paw-md" aria-hidden="true" />
                  </Button>
                  <span className="text-sm font-extrabold text-paw-ink">
                    €{(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </Sheet>
  );
}

// ─── Main Store Page ───────────────────────────────────
function StorePageContent({ t }: { t: StoreTranslation }) {
  const { path } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useHydratedReducedMotion();
  const { user, session } = useAuth();
  const [products, setProducts] = useState<Product[]>(() => PRODUCTS.map(withProductAssetOverrides));
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category>("all");
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogIssue, setCatalogIssue] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const upgradeIntent = searchParams.get("intent") === "ai-upgrade";
  const upgradeTier = paidTierFromValue(searchParams.get("tier")) ?? "basic";
  const appUserId = searchParams.get("user_id");
  const appEmail = searchParams.get("email");
  const source = searchParams.get("source") ?? "web-store";
  const recommendedProductIds = useMemo(() => {
    const seen = new Set<string>();
    return (searchParams.get("products") ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => {
        if (id.length === 0 || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
  }, [searchParams]);
  const recommendedProductIdSet = useMemo(
    () => new Set(recommendedProductIds),
    [recommendedProductIds],
  );

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setCart(loadCart());
    });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => { saveCart(cart); }, [cart]);

  useEffect(() => {
    let cancelled = false;
    if (ACCOUNT_FIXTURES_ENABLED) {
      queueMicrotask(() => {
        if (!cancelled) setCatalogLoading(false);
      });
      return () => { cancelled = true; };
    }
    fetchCatalogProducts()
      .then((remoteProducts) => {
        if (cancelled) return;
        if (remoteProducts.length > 0) {
          setProducts(remoteProducts.map(withProductAssetOverrides));
          setCatalogIssue(null);
        } else {
          setProducts(PRODUCTS.map(withProductAssetOverrides));
          setCatalogIssue(t("storeNoCatalogFallback"));
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : t("storeCatalogUnavailable");
        setProducts(PRODUCTS.map(withProductAssetOverrides));
        setCatalogIssue(message);
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => { cancelled = true; };
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      queueMicrotask(() => {
        if (!cancelled) setIsAdmin(false);
      });
      return;
    }
    checkStoreAdmin().then((allowed) => {
      if (!cancelled) setIsAdmin(allowed);
    });
    return () => { cancelled = true; };
  }, [user]);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setToast(`✓ ${product.name} ${t("storeAddedToCartSuffix")}`);
    setTimeout(() => setToast(null), 2500);
  }, [t]);

  const updateQuantity = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== id));
    } else {
      setCart((prev) => prev.map((i) => i.product.id === id ? { ...i, quantity: qty } : i));
    }
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  }, []);

  const filtered = products.filter((p) => {
    const matchCat = category === "all" || p.category === category;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a, b) => {
    const aRecommended = recommendedProductIdSet.has(a.id);
    const bRecommended = recommendedProductIdSet.has(b.id);
    if (aRecommended === bRecommended) return 0;
    return aRecommended ? -1 : 1;
  });
  const recommendedMatchCount = products.filter((product) =>
    recommendedProductIdSet.has(product.id),
  ).length;

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const storePromises = [
    {
      icon: ShieldCheck,
      label: t("storePromiseNfcLabel"),
      copy: t("storePromiseNfcCopy"),
    },
    {
      icon: Truck,
      label: t("storePromiseFulfillmentLabel"),
      copy: t("storePromiseFulfillmentCopy"),
    },
    {
      icon: CheckCircle2,
      label: t("storePromiseCheckoutLabel"),
      copy: t("storePromiseCheckoutCopy"),
    },
  ];
  const categoryLabels: Record<Category, string> = {
    all: t("storeCategoryAll"),
    food: t("storeCategoryFood"),
    toys: t("storeCategoryToys"),
    accessories: t("storeCategoryAccessories"),
    health: t("storeCategoryHealth"),
  };

  if (upgradeIntent) {
    return (
      <SubscriptionUpgradePanel
        initialTier={upgradeTier}
        source={source}
        appUserId={appUserId}
        appEmail={appEmail}
        accessToken={session?.access_token}
        t={t}
      />
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-paw-page text-paw-ink">
      {/* ===== COMMERCE HEADER ===== */}
      <PageShell
        className={`border-b border-paw-outline-variant ${STORE_METRIC_CLASSES.shellTopSpacing}`}
        contentClassName="space-y-paw-lg"
      >
        <div className="grid gap-paw-lg lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)] lg:items-end">
          <div>
            <motion.h1
              {...fadeUpMotion(shouldReduceMotion, 18)}
              className="max-w-3xl font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display"
            >
              {t("storeHeroTitlePrefix")}{" "}
              <span className="text-paw-on-primary-soft">{t("storeHeroTitleHighlight")}</span>
            </motion.h1>
            <motion.p
              {...fadeUpMotion(shouldReduceMotion, 16, 0.08)}
              className="mt-paw-sm max-w-2xl text-paw-type-body text-paw-body sm:text-base"
            >
              {t("storeHeroCopy")}
            </motion.p>
          </div>

          <div className="space-y-paw-sm">
            {recommendedProductIds.length > 0 && (
              <motion.div
                {...fadeUpMotion(shouldReduceMotion, 10, 0.12)}
              >
                <Card
                  variant="compact"
                  className="flex flex-wrap items-center gap-paw-xs px-paw-sm py-paw-xs text-sm font-bold"
                >
                  <Sparkles className="h-paw-md w-paw-md text-paw-on-primary-soft" aria-hidden="true" />
                  <span>
                    {recommendedMatchCount > 0
                      ? `${recommendedMatchCount} ${
                          recommendedMatchCount === 1
                            ? t("storeRecommendedProductHighlightedSuffix")
                            : t("storeRecommendedProductsHighlightedSuffix")
                        }`
                      : t("storeRecommendationsMissing")}
                  </span>
                </Card>
              </motion.div>
            )}

            <motion.div
              {...fadeUpMotion(shouldReduceMotion, 14, 0.16)}
              className="relative"
            >
              <Input
                variant="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("storeSearchPlaceholder")}
                leftSlot={<Search className="h-paw-lg w-paw-lg" aria-hidden="true" />}
              />
            </motion.div>
          </div>
        </div>

        <motion.div
          {...fadeUpMotion(shouldReduceMotion, 14, 0.22)}
          className="grid grid-cols-3 gap-paw-sm"
        >
          {storePromises.map((promise) => (
            <Card
              key={promise.label}
              variant="compact"
              className="flex flex-col items-center gap-paw-xs p-paw-sm text-center sm:flex-row sm:items-start sm:gap-paw-sm sm:text-left"
            >
              <span className="flex h-paw-xxl w-paw-xxl shrink-0 items-center justify-center rounded-paw-control bg-paw-primary-soft text-paw-on-primary-soft">
                <promise.icon className={`${STORE_METRIC_CLASSES.compactIconSize} sm:h-paw-md sm:w-paw-md`} aria-hidden="true" />
              </span>
              <div>
                <p className="text-paw-type-caption font-extrabold leading-tight text-paw-ink sm:text-sm">
                  {promise.label}
                </p>
                <p className="mt-0.5 hidden text-xs leading-5 text-paw-body sm:block">
                  {promise.copy}
                </p>
              </div>
            </Card>
          ))}
        </motion.div>
      </PageShell>

      {/* ===== CATEGORY TABS + PRODUCT GRID ===== */}
      <section className="bg-paw-panel-subtle py-paw-lg">
        <div className="mx-auto max-w-7xl px-paw-md sm:px-paw-xl lg:px-paw-xxl">
        <div className="mb-paw-sm flex items-center gap-paw-xs">
          <SlidersHorizontal className="h-paw-md w-paw-md text-paw-muted" />
          <span className="text-sm font-bold text-paw-muted">{t("storeFilterByCategory")}</span>
        </div>
        <div className="-mx-paw-md mb-paw-sm flex gap-paw-sm overflow-x-auto px-paw-md pb-paw-xs sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          {CATEGORIES.map((cat) => (
            (() => {
              const CategoryIcon = CATEGORY_ICONS[cat.key];
              const active = category === cat.key;
              return (
                <motion.button
                  key={cat.key}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                  onClick={() => setCategory(cat.key)}
                  className={buttonClassName({
                    variant: active ? "primary" : "secondary",
                    size: "sm",
                    className: "shrink-0 cursor-pointer",
                  })}
                >
                  <CategoryIcon className={`${STORE_METRIC_CLASSES.compactIconSize} sm:h-paw-md sm:w-paw-md`} aria-hidden="true" />
                  {categoryLabels[cat.key]}
                </motion.button>
              );
            })()
          ))}
        </div>
        <div className="mb-paw-md flex flex-wrap items-center justify-between gap-paw-sm">
          <div className="flex flex-wrap items-center gap-paw-sm">
            <p className="text-sm font-semibold text-paw-muted">
              {filtered.length} {filtered.length === 1 ? t("storeProductCountSingular") : t("storeProductCountPlural")}
            </p>
            {catalogLoading && (
              <Badge tone="neutral" variant="semantic" size="sm">
                <RefreshCw className="h-paw-sm w-paw-sm animate-spin" aria-hidden="true" />
                {t("storeSyncing")}
              </Badge>
            )}
            {catalogIssue && (
              <Badge tone="warning" variant="semantic" size="sm">
                {t("storeDemoFallback")}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-paw-md">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="store-toolbar-action inline-flex cursor-pointer items-center gap-paw-xxs text-sm font-bold text-paw-muted transition-colors hover:text-paw-primary"
            >
              <ShoppingCart className="h-paw-md w-paw-md" aria-hidden="true" />
              {t("storeCartButton")} {totalItems > 0 ? `(${totalItems})` : ""}
            </button>
            {isAdmin && (
              <button
                onClick={() => router.push(path("/store/admin"))}
                className="store-toolbar-action flex cursor-pointer items-center gap-paw-xxs text-sm font-bold text-paw-trust transition-colors hover:text-paw-trust-hover"
              >
                <ShieldCheck className="h-paw-md w-paw-md" aria-hidden="true" />
                {t("storeManageCatalog")}
              </button>
            )}
            <button
              onClick={() => router.push(path("/store/orders"))}
              className="store-toolbar-action flex cursor-pointer items-center gap-paw-xxs text-sm font-bold text-paw-primary transition-colors hover:text-paw-primary-hover"
            >
              {t("storeMyOrders")} <ChevronRight className="h-paw-md w-paw-md" />
            </button>
          </div>
        </div>

        <motion.div layout={!shouldReduceMotion} className="grid grid-cols-1 gap-paw-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={addToCart}
                onDetails={setSelectedProduct}
                t={t}
                recommended={recommendedProductIdSet.has(product.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <EmptyState
            icon={Search}
            title={t("storeNoProductsTitle")}
            description={t("storeNoProductsDescription")}
            className="my-paw-xxxl"
          />
        )}
        </div>
      </section>

      {/* ===== FLOATING CART BUTTON ===== */}
      <AnimatePresence mode="wait">
        {totalItems > 0 && (
          <motion.div
            key="checkout-link"
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
            whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
            className="fixed bottom-paw-xxl right-paw-xxl z-50"
          >
            <Link
              href={path("/store/checkout")}
              className={`relative flex ${STORE_METRIC_CLASSES.floatingCartSize} items-center justify-center rounded-paw-panel bg-paw-primary text-paw-accent-ink shadow-paw-action transition-colors hover:bg-paw-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paw-trust/20`}
              aria-label={`${t("storeCheckoutWithPrefix")} ${totalItems} ${totalItems === 1 ? t("storeItemSingular") : t("storeItemPlural")}`}
            >
              <ShoppingCart className="h-paw-xl w-paw-xl" aria-hidden="true" />
              <motion.span
                initial={false}
                animate={{ scale: 1 }}
                className="absolute -right-paw-xxs -top-paw-xxs flex h-paw-xl w-paw-xl items-center justify-center rounded-paw-pill bg-paw-critical text-xs font-extrabold text-paw-on-critical"
              >
                {totalItems}
              </motion.span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== CART DRAWER ===== */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdate={updateQuantity}
        onRemove={removeItem}
        t={t}
      />

      <ProductDetailsDrawer
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        t={t}
      />

      {/* ===== ADD-TO-CART TOAST ===== */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: 40 }}
            className={`fixed ${STORE_METRIC_CLASSES.toastBottomOffset} left-1/2 z-50 flex -translate-x-1/2 items-center gap-paw-xs rounded-paw-panel border border-paw-outline-variant bg-paw-panel-low px-paw-lg py-paw-sm text-sm font-bold text-paw-ink shadow-paw-panel`}
          >
            <CheckCircle2 className="h-paw-md w-paw-md text-paw-on-success-soft" aria-hidden="true" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StorePage() {
  const { loader, t } = useRouteTranslations();

  return (
    <>
      {loader}
      <Suspense
        fallback={
          <div className={`min-h-screen bg-paw-page ${STORE_METRIC_CLASSES.loadingShellTopSpacing} text-center text-sm font-bold text-paw-muted`}>
            {t("storeLoading")}
          </div>
        }
      >
        <StorePageContent t={t} />
      </Suspense>
    </>
  );
}
