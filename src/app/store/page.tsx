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
  BadgeCheck, Bone, Dumbbell, HeartPulse, MapPin, PackageCheck,
  QrCode, ScanLine, ShoppingBag, Smartphone, Tags, Truck,
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
  Button,
  buttonClassName,
  EmptyState,
  Input,
  ProductCard as StoreProductCard,
  Sheet,
} from "@/components/ui";

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  all: ShoppingBag,
  food: Bone,
  toys: Dumbbell,
  accessories: Tags,
  health: HeartPulse,
};

const CATEGORY_LABELS: Record<Category, string> = {
  all: "All products",
  food: "Treats",
  toys: "Play gear",
  accessories: "Tags & walk kit",
  health: "Care & rescue",
};

const STORE_PROMISES = [
  {
    icon: BadgeCheck,
    label: "Photo-led catalog",
    copy: "Approved product photos stay large enough to inspect before checkout.",
  },
  {
    icon: QrCode,
    label: "Pair after purchase",
    copy: "Smart Tag setup remains an app handoff, with QR/manual fallback language.",
  },
  {
    icon: ShieldCheck,
    label: "Secure checkout",
    copy: "Stripe-backed payment with cart persistence across visits.",
  },
];

const SMART_TAG_HERO_IMAGE = "/assets/store-products/current/smart-tag/hero.webp";

const SMART_TAG_FINISHES = [
  {
    label: "Yellow",
    src: "/assets/store-products/current/smart-tag/yellow.webp",
    note: "High-visibility tag face",
  },
  {
    label: "Silver",
    src: "/assets/store-products/current/smart-tag/silver.webp",
    note: "Low-key metal finish",
  },
];

const SMART_TAG_VALUE_PROPS = [
  {
    icon: ScanLine,
    label: "Scan to a public profile",
    copy: "A finder can open the pet's PawPal profile after the owner has set it up.",
  },
  {
    icon: BadgeCheck,
    label: "Owner-controlled details",
    copy: "Contact and care notes stay tied to the profile instead of printed forever.",
  },
  {
    icon: MapPin,
    label: "Recovery context",
    copy: "The tag complements PawPal's map-led safety flow without claiming live tracking.",
  },
];

const PAIRING_STEPS = [
  {
    step: "01",
    label: "Choose tag and gear",
    copy: "Use the catalog selector to find Smart Tag products, walk kit, and care add-ons.",
  },
  {
    step: "02",
    label: "Checkout stays explicit",
    copy: "Cart, quantity, shipping, and payment remain visible before purchase.",
  },
  {
    step: "03",
    label: "Pair in PawPal",
    copy: "After delivery, open the app to pair the tag to a real pet profile.",
  },
];

function productSearchKey(product: Product) {
  return [
    product.slug,
    product.sku,
    product.name,
    product.description,
    product.tags?.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isSmartTagProduct(product: Product) {
  const key = productSearchKey(product);
  return (
    key.includes("smart tag") ||
    key.includes("smart id") ||
    key.includes("nfc") ||
    key.includes("qr") ||
    key.includes("pawpal tag")
  );
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

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
}: {
  initialTier: Exclude<SubscriptionTier, "free">;
  source: string;
  appUserId: string | null;
  appEmail: string | null;
  accessToken?: string;
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
        throw new Error(data.error || "Could not start subscription checkout");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Subscription checkout failed");
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-paw-page pt-28 pb-16 text-paw-ink">
      <section className="mx-auto max-w-6xl px-4">
        <div className="mb-8 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-paw-md border border-paw-primary/20 bg-paw-primary-soft px-3 py-1.5 text-sm font-bold text-paw-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            PawPal AI upgrade
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-paw-ink sm:text-5xl">
            Choose your PawPal plan
          </h1>
          <p className="mt-4 text-base leading-7 text-paw-body">
            Basic unlocks your pet companion AI. Pro adds priority access for the
            next wave of advanced walk, safety, and multi-pet tools.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-paw-md border border-paw-danger/20 bg-paw-danger-soft px-4 py-3 text-sm font-bold text-paw-danger">
            {error}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {(["basic", "pro"] as const).map((tier) => {
            const plan = SUBSCRIPTION_PLANS[tier];
            const active = selectedTier === tier;
            const busy = loadingTier === tier;
            return (
              <motion.div
                key={tier}
                {...fadeUpMotion(shouldReduceMotion, 18)}
                className={`rounded-paw-lg border bg-paw-panel p-6 shadow-paw-panel ${
                  active ? "border-paw-primary" : "border-paw-border"
                }`}
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-paw-md bg-paw-primary-soft text-paw-primary">
                      {tier === "pro" ? (
                        <Crown className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Sparkles className="h-5 w-5" aria-hidden="true" />
                      )}
                    </div>
                    <h2 className="text-2xl font-extrabold text-paw-ink">
                      {plan.name}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-paw-body">
                      {plan.summary}
                    </p>
                  </div>
                  {plan.highlight && (
                    <span className="rounded-paw-sm border border-paw-success/20 bg-paw-success-soft px-2.5 py-1 text-xs font-bold text-paw-success">
                      Recommended
                    </span>
                  )}
                </div>

                <div className="mb-5 flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-paw-ink">
                    €{plan.monthlyPrice.toFixed(2)}
                  </span>
                  <span className="pb-1 text-sm font-bold text-paw-muted">
                    / month
                  </span>
                </div>

                <div className="mb-6 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm text-paw-body">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-paw-success" aria-hidden="true" />
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
                  {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  Upgrade to {plan.name}
                </Button>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 rounded-paw-md border border-paw-border bg-paw-panel-subtle p-4 text-sm leading-6 text-paw-body">
          Existing Free features stay available after cancellation. Paid AI access is
          restored automatically after Stripe confirms your subscription; if the app
          is already open, use Refresh plan in Profile.
        </div>
      </section>
    </div>
  );
}

// ─── Product Card ──────────────────────────────────────
function ProductCard({
  product, onAdd, onDetails, recommended = false,
}: {
  product: Product;
  onAdd: (p: Product) => void;
  onDetails: (p: Product) => void;
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
        <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-paw-sm bg-paw-primary px-2.5 py-1 text-xs font-extrabold text-white shadow-paw-panel">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          AI pick
        </span>
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
        detailsLabel="Details"
        onDetails={() => onDetails(product)}
        actionLabel="Add"
        onAction={() => onAdd(product)}
        className={
          recommended
            ? "border-paw-primary shadow-[0_14px_34px_rgba(74,144,217,0.22)] ring-2 ring-paw-primary/25"
            : undefined
        }
      />
    </motion.div>
  );
}

function ProductDetailsDrawer({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const smartTagProduct = product ? isSmartTagProduct(product) : false;

  return (
    <Sheet
      open={Boolean(product)}
      onClose={onClose}
      ariaLabel={product ? `${product.name} product details` : "Product details"}
      title={product?.name}
      description={product?.description}
      panelClassName="max-w-2xl"
    >
      {product && (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(280px,1fr)]">
            <div className="flex min-h-72 items-center justify-center rounded-paw-lg border border-paw-border bg-paw-panel-subtle p-4 shadow-paw-panel">
              <ProductVisual product={product} size="xl" />
            </div>

            <div className="rounded-paw-lg border border-paw-border bg-paw-panel p-4 shadow-paw-panel">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-paw-muted">
                    Inspect product
                  </p>
                  <p className="mt-1 text-3xl font-extrabold text-paw-primary">
                    {formatPrice(product)}
                  </p>
                </div>
                {product.badge && (
                  <span className="rounded-paw-sm bg-paw-primary-soft px-3 py-1 text-xs font-bold text-paw-primary">
                    {product.badge}
                  </span>
                )}
              </div>

              <p className="mt-4 text-sm leading-6 text-paw-body">
                {product.details || product.description}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-paw-body">
                <span className="rounded-paw-sm border border-paw-border bg-paw-panel-subtle px-3 py-2">
                  {product.sku ? `SKU ${product.sku}` : "Catalog item"}
                </span>
                <span
                  className={`rounded-paw-sm border px-3 py-2 ${
                    product.inStock
                      ? "border-paw-success/20 bg-paw-success-soft text-paw-success"
                      : "border-paw-warning/20 bg-paw-warning-soft text-paw-warning"
                  }`}
                >
                  {product.inStock ? "In stock" : "Availability limited"}
                </span>
              </div>

              {smartTagProduct && (
                <div className="mt-4 rounded-paw-md border border-paw-trust/20 bg-paw-trust-soft p-3">
                  <p className="flex items-center gap-2 text-sm font-extrabold text-paw-trust">
                    <Smartphone className="h-4 w-4" aria-hidden="true" />
                    Pairing happens in the PawPal app
                  </p>
                  <p className="mt-1 text-xs leading-5 text-paw-body">
                    The tag is not shown as connected here; after delivery, pair it to a real pet profile in PawPal.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: BadgeCheck,
                label: "Large photos",
                copy: "Product media stays uncropped for inspection.",
              },
              {
                icon: PackageCheck,
                label: "Cart preserved",
                copy: "Adding this item keeps your current selections.",
              },
              {
                icon: smartTagProduct ? QrCode : Truck,
                label: smartTagProduct ? "QR fallback" : "Shipping handoff",
                copy: smartTagProduct
                  ? "Use QR/manual setup if NFC is unavailable."
                  : "Checkout keeps shipping and order review separate.",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-paw-md border border-paw-border bg-paw-panel-subtle p-3"
              >
                <item.icon className="h-4 w-4 text-paw-primary" aria-hidden="true" />
                <p className="mt-2 text-sm font-extrabold text-paw-ink">
                  {item.label}
                </p>
                <p className="mt-1 text-xs leading-5 text-paw-body">
                  {item.copy}
                </p>
              </div>
            ))}
          </div>

          {product.detailImages?.length ? (
            <div className="space-y-4">
              {product.detailImages.map((image) => (
                <Image
                  key={image.src}
                  src={image.src}
                  alt={image.alt}
                  width={1024}
                  height={1536}
                  sizes="(min-width: 768px) 640px, calc(100vw - 40px)"
                  style={{ width: "100%", height: "auto" }}
                  className="w-full rounded-paw-md border border-paw-border bg-paw-panel object-contain shadow-paw-panel"
                  loading="lazy"
                />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </Sheet>
  );
}

// ─── Cart Drawer ───────────────────────────────────────
function CartDrawer({
  isOpen, onClose, items, onUpdate, onRemove,
}: {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdate: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const shouldReduceMotion = useHydratedReducedMotion();
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      ariaLabel={`Your Cart (${items.length})`}
      title={
        <span className="inline-flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-paw-primary" aria-hidden="true" />
          Your Cart ({items.length})
        </span>
      }
      footer={
        items.length > 0 ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-paw-body">
              <span>Subtotal</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-paw-body">
              <span>Shipping</span>
              <span>
                {shipping === 0 ? (
                  <span className="font-bold text-paw-success">Free</span>
                ) : (
                  `€${shipping.toFixed(2)}`
                )}
              </span>
            </div>
            {subtotal < 50 && (
              <p className="rounded-paw-sm bg-paw-warning-soft px-3 py-2 text-xs font-semibold text-paw-body">
                Add €{(50 - subtotal).toFixed(2)} more for free shipping.
              </p>
            )}
            <div className="flex justify-between border-t border-paw-border pt-3 text-lg font-extrabold text-paw-ink">
              <span>Total</span>
              <span>€{total.toFixed(2)}</span>
            </div>
            <Link
              href="/store/checkout"
              className={buttonClassName({ size: "lg", className: "w-full" })}
            >
              Proceed to Checkout <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse products and add items to get started."
        />
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.product.id}
                layout={!shouldReduceMotion}
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, x: -20 }}
                className="flex gap-4 rounded-paw-md border border-paw-border bg-paw-panel-subtle p-3"
              >
                <ProductVisual product={item.product} size="md" />
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-extrabold text-paw-ink">
                    {item.product.name}
                  </h4>
                  <p className="mt-0.5 text-sm font-bold text-paw-primary">
                    €{item.product.price.toFixed(2)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 rounded-paw-sm"
                      onClick={() => onUpdate(item.product.id, item.quantity - 1)}
                      aria-label={`Decrease ${item.product.name}`}
                    >
                      <Minus className="h-3 w-3" aria-hidden="true" />
                    </Button>
                    <span className="w-7 text-center text-sm font-extrabold text-paw-ink">
                      {item.quantity}
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 rounded-paw-sm"
                      onClick={() => onUpdate(item.product.id, item.quantity + 1)}
                      aria-label={`Increase ${item.product.name}`}
                    >
                      <Plus className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-paw-muted hover:text-paw-danger"
                    onClick={() => onRemove(item.product.id)}
                    aria-label={`Remove ${item.product.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
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
function StorePageContent() {
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
    fetchCatalogProducts()
      .then((remoteProducts) => {
        if (cancelled) return;
        if (remoteProducts.length > 0) {
          setProducts(remoteProducts.map(withProductAssetOverrides));
          setCatalogIssue(null);
        } else {
          setProducts(PRODUCTS.map(withProductAssetOverrides));
          setCatalogIssue("No published catalog products found. Showing demo catalog.");
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Catalog unavailable";
        setProducts(PRODUCTS.map(withProductAssetOverrides));
        setCatalogIssue(message);
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

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
    setToast(`✓ ${product.name} added to cart`);
    setTimeout(() => setToast(null), 2500);
  }, []);

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
  const focusTagProducts = useCallback(() => {
    setCategory("accessories");
    document.getElementById("store-catalog")?.scrollIntoView({
      behavior: shouldReduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [shouldReduceMotion]);

  if (upgradeIntent) {
    return (
      <SubscriptionUpgradePanel
        initialTier={upgradeTier}
        source={source}
        appUserId={appUserId}
        appEmail={appEmail}
        accessToken={session?.access_token}
      />
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-paw-page text-paw-ink">
      {/* ===== SMART TAG COMMERCE HEADER ===== */}
      <section className="relative overflow-hidden border-b border-paw-border bg-paw-page pt-20 pb-7 md:pt-24 md:pb-9">
        <div className="absolute inset-0 -z-10">
          <div className="hero-map-grid absolute inset-0 opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-paw-page via-paw-page/96 to-paw-primary-soft/35" />
        </div>
        <div className="mx-auto grid max-w-7xl gap-7 px-4 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.82fr)] lg:items-center">
          <div className="py-3 md:py-6">
            <motion.div
              {...fadeUpMotion(shouldReduceMotion, 12)}
              className="mb-3 inline-flex items-center gap-2 rounded-paw-sm border border-paw-primary/20 bg-paw-primary-soft px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] text-paw-primary"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              PawPal Smart Tag Store
            </motion.div>
            <motion.h1
              {...fadeUpMotion(shouldReduceMotion, 18)}
              className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-paw-ink sm:text-4xl lg:text-5xl"
            >
              Inspect the tag, understand the setup, then{" "}
              <span className="text-gradient">checkout with confidence</span>
            </motion.h1>
            <motion.p
              {...fadeUpMotion(shouldReduceMotion, 16, 0.08)}
              className="mt-3 max-w-2xl text-base leading-7 text-paw-body md:text-lg"
            >
              The Store starts with PawPal Smart Tag trust: real product imagery,
              clear category selection, and a pairing handoff that explains what
              happens after purchase without pretending the tag is already active.
            </motion.p>

            <motion.div
              {...fadeUpMotion(shouldReduceMotion, 16, 0.12)}
              className="mt-5 flex flex-col gap-3 sm:flex-row"
            >
              <Button type="button" size="lg" onClick={focusTagProducts}>
                Shop tag kit <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                Review cart {totalItems > 0 ? `(${totalItems})` : ""}
              </Button>
            </motion.div>

            <motion.div
              {...fadeUpMotion(shouldReduceMotion, 14, 0.18)}
              className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-3"
            >
              {STORE_PROMISES.map((promise) => (
                <div
                  key={promise.label}
                  className="rounded-paw-md border border-paw-border bg-paw-panel/86 p-3 shadow-[0_8px_22px_rgba(33,55,78,0.06)] backdrop-blur"
                >
                  <promise.icon className="h-4 w-4 text-paw-primary" aria-hidden="true" />
                  <p className="mt-2 text-sm font-extrabold text-paw-ink">
                    {promise.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-paw-body">
                    {promise.copy}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            {...fadeUpMotion(shouldReduceMotion, 16, 0.12)}
            className="rounded-paw-lg border border-paw-border bg-paw-panel/94 p-4 shadow-paw-floating backdrop-blur-sm"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-paw-primary">
                  Product proof
                </p>
                <h2 className="text-xl font-extrabold text-paw-ink">
                  PawPal Smart Tag
                </h2>
              </div>
              <span className="rounded-paw-sm border border-paw-success/20 bg-paw-success-soft px-3 py-1 text-xs font-bold text-paw-success">
                Real tag imagery
              </span>
            </div>

            <div className="relative overflow-hidden rounded-paw-lg border border-paw-primary/20 bg-paw-primary-soft/45 p-4">
              <div className="hero-map-grid absolute inset-0 opacity-35" />
              <Image
                src={SMART_TAG_HERO_IMAGE}
                alt="Silver and yellow PawPal smart ID tags"
                width={900}
                height={900}
                priority
                sizes="(min-width: 1024px) 420px, calc(100vw - 48px)"
                className="relative z-10 aspect-square w-full object-contain"
              />
              <div className="absolute bottom-3 left-3 z-20 rounded-paw-sm border border-paw-border bg-paw-panel/90 px-3 py-2 text-xs font-bold text-paw-body shadow-paw-panel backdrop-blur">
                QR/NFC profile handoff after owner setup
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              {SMART_TAG_FINISHES.map((finish) => (
                <div
                  key={finish.label}
                  className="rounded-paw-md border border-paw-border bg-paw-panel-subtle p-2"
                >
                  <Image
                    src={finish.src}
                    alt={`${finish.label} PawPal smart ID tag`}
                    width={360}
                    height={360}
                    sizes="180px"
                    className="aspect-square w-full rounded-paw-sm bg-paw-panel object-contain"
                  />
                  <p className="mt-2 text-sm font-extrabold text-paw-ink">
                    {finish.label}
                  </p>
                  <p className="text-xs leading-5 text-paw-body">{finish.note}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-paw-border bg-paw-panel/72 py-5">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 lg:grid-cols-[minmax(260px,0.72fr)_minmax(0,1fr)] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-extrabold text-paw-primary">
              <Tags className="h-4 w-4" aria-hidden="true" />
              Smart Tag value proposition
            </p>
            <h2 className="mt-2 text-2xl font-extrabold leading-tight text-paw-ink">
              The product is the tag plus the recovery profile it unlocks.
            </h2>
            <p className="mt-2 text-sm leading-6 text-paw-body">
              Store copy stays truthful: the tag supports public-profile recovery
              after pairing, and fallback setup remains visible when NFC is not available.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {SMART_TAG_VALUE_PROPS.map((item) => (
              <div
                key={item.label}
                className="rounded-paw-md border border-paw-border bg-paw-page p-4"
              >
                <item.icon className="h-5 w-5 text-paw-primary" aria-hidden="true" />
                <p className="mt-3 text-sm font-extrabold text-paw-ink">
                  {item.label}
                </p>
                <p className="mt-1 text-xs leading-5 text-paw-body">
                  {item.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-paw-border bg-paw-trust-soft/35 py-5">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 lg:grid-cols-[minmax(240px,0.58fr)_minmax(0,1fr)] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-extrabold text-paw-trust">
              <Smartphone className="h-4 w-4" aria-hidden="true" />
              Pairing handoff
            </p>
            <h2 className="mt-2 text-xl font-extrabold text-paw-ink">
              Buy here. Pair later in PawPal.
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {PAIRING_STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-paw-md border border-paw-border bg-paw-panel p-4"
              >
                <span className="text-xs font-black text-paw-muted">
                  {item.step}
                </span>
                <p className="mt-1 text-sm font-extrabold text-paw-ink">
                  {item.label}
                </p>
                <p className="mt-1 text-xs leading-5 text-paw-body">
                  {item.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CATEGORY TABS + PRODUCT GRID ===== */}
      <section id="store-catalog" className="scroll-mt-24 bg-paw-accent-soft/30 py-6 md:py-8">
        <div className="mx-auto max-w-7xl px-4">
        <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.42fr)] lg:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-paw-muted" aria-hidden="true" />
              <span className="text-sm font-bold text-paw-muted">Product selector</span>
            </div>
            <h2 className="text-2xl font-extrabold text-paw-ink">
              Browse real catalog items
            </h2>
            <p className="mt-1 text-sm leading-6 text-paw-body">
              Filter by category, inspect product photos, then add items without leaving the Store flow.
            </p>
          </div>

          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search smart tags, harnesses, first-aid..."
            leftSlot={<Search className="h-5 w-5" aria-hidden="true" />}
            className="h-12 rounded-paw-md bg-paw-panel/95 shadow-paw-panel"
          />
        </div>

        {recommendedProductIds.length > 0 && (
          <motion.div
            {...fadeUpMotion(shouldReduceMotion, 10)}
            className="mb-3 flex flex-wrap items-center gap-2 rounded-paw-md border border-paw-primary/20 bg-paw-panel/90 px-3 py-2 text-sm font-bold text-paw-ink shadow-paw-panel backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4 text-paw-primary" aria-hidden="true" />
            <span>
              {recommendedMatchCount > 0
                ? `${recommendedMatchCount} AI recommended product${recommendedMatchCount !== 1 ? "s" : ""} highlighted`
                : "AI recommendations are not in this catalog yet"}
            </span>
          </motion.div>
        )}

        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          {CATEGORIES.map((cat) => (
            (() => {
              const CategoryIcon = CATEGORY_ICONS[cat.key];
              return (
                <motion.button
                  type="button"
                  key={cat.key}
                  aria-pressed={category === cat.key}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                  onClick={() => setCategory(cat.key)}
                  className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-paw-md border border-b-4 px-3 py-2 text-xs font-bold transition active:translate-y-0.5 active:border-b-2 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${
                    category === cat.key
                      ? "border-paw-primary border-b-paw-primary-contrast bg-paw-primary text-white shadow-paw-action"
                      : "border-paw-border border-b-paw-border-strong bg-paw-panel/85 text-paw-ink hover:border-paw-primary/40 hover:bg-paw-primary-soft"
                  }`}
                >
                  <CategoryIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                  {CATEGORY_LABELS[cat.key]}
                </motion.button>
              );
            })()
          ))}
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-paw-muted">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""} in {CATEGORY_LABELS[category]}
            </p>
            {catalogLoading && (
              <span className="inline-flex items-center gap-1 rounded-paw-sm bg-paw-panel px-2 py-1 text-xs font-bold text-paw-muted">
                <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" />
                Syncing
              </span>
            )}
            {catalogIssue && (
              <span className="rounded-paw-sm bg-paw-warning-soft px-2 py-1 text-xs font-bold text-paw-warning">
                Demo fallback
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-paw-sm border border-paw-border bg-paw-panel px-3 py-2 text-sm font-bold text-paw-muted transition-colors hover:border-paw-primary/40 hover:text-paw-primary"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              Cart {totalItems > 0 ? `(${totalItems})` : ""}
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => router.push("/store/admin")}
                className="flex cursor-pointer items-center gap-1 rounded-paw-sm border border-paw-trust/20 bg-paw-trust-soft px-3 py-2 text-sm font-bold text-paw-trust transition-colors hover:text-paw-trust-hover"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Manage catalog
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push("/store/orders")}
              className="flex cursor-pointer items-center gap-1 rounded-paw-sm border border-paw-primary/20 bg-paw-primary-soft px-3 py-2 text-sm font-bold text-paw-primary transition-colors hover:text-paw-primary-hover"
            >
              My Orders <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <motion.div layout={!shouldReduceMotion} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={addToCart}
                onDetails={setSelectedProduct}
                recommended={recommendedProductIdSet.has(product.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <EmptyState
            icon={Search}
            title="No products found"
            description="Try adjusting your search or category filter."
            className="my-10"
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
            className="fixed bottom-8 right-8 z-50"
          >
            <Link
              href="/store/checkout"
              className="relative flex h-16 w-16 items-center justify-center rounded-paw-lg bg-paw-primary text-white shadow-paw-action transition-colors hover:bg-paw-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paw-trust/20"
              aria-label={`Proceed to checkout with ${totalItems} item${totalItems !== 1 ? "s" : ""}`}
            >
              <ShoppingCart className="h-6 w-6" aria-hidden="true" />
              <motion.span
                initial={false}
                animate={{ scale: 1 }}
                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-paw-sm bg-paw-danger text-xs font-extrabold text-white"
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
      />

      <ProductDetailsDrawer
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* ===== ADD-TO-CART TOAST ===== */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: 40 }}
            className="fixed bottom-28 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-paw-lg bg-paw-ink px-6 py-3 text-sm font-bold text-white shadow-paw-panel"
          >
            <CheckCircle2 className="h-4 w-4 text-paw-success" aria-hidden="true" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StorePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paw-page pt-28 text-center text-sm font-bold text-paw-muted">
          Loading store...
        </div>
      }
    >
      <StorePageContent />
    </Suspense>
  );
}
