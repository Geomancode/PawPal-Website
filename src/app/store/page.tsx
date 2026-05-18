"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, Plus, Minus, Trash2, ArrowRight,
  Package, Search, SlidersHorizontal, ChevronRight, RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  PRODUCTS, CATEGORIES, Product, CartItem, Category,
  checkStoreAdmin,
  fetchCatalogProducts,
  formatOptionalPrice,
  formatPrice,
  loadCart, saveCart,
} from "./storeData";
import ProductVisual from "./ProductVisual";
import { useAuth } from "@/components/AuthProvider";
import { DoodleBowl, DoodlePaw } from "@/components/PetDoodles";
import {
  Button,
  EmptyState,
  Input,
  ProductCard as StoreProductCard,
  Sheet,
} from "@/components/ui";

// ─── Product Card ──────────────────────────────────────
function ProductCard({
  product, onAdd,
}: {
  product: Product;
  onAdd: (p: Product) => void;
}) {
  const badgeTone: Record<NonNullable<Product["badge"]>, "success" | "warning" | "accent"> = {
    New: "success",
    "Best Seller": "warning",
    Sale: "accent",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6 }}
    >
      <StoreProductCard
        name={product.name}
        description={product.description}
        price={formatPrice(product)}
        originalPrice={formatOptionalPrice(product)}
        image={<ProductVisual product={product} size="lg" className="bg-transparent" />}
        badge={product.badge}
        badgeTone={product.badge ? badgeTone[product.badge] : undefined}
        rating={product.rating}
        ratingDetail={`(${product.reviewCount})`}
        actionLabel="Add"
        onAction={() => onAdd(product)}
      />
    </motion.div>
  );
}

// ─── Cart Drawer ───────────────────────────────────────
function CartDrawer({
  isOpen, onClose, items, onUpdate, onRemove, onCheckout,
}: {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdate: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}) {
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
            <Button
              type="button"
              size="lg"
              onClick={onCheckout}
              className="w-full"
            >
              Proceed to Checkout <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
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
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
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
export default function StorePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [category, setCategory] = useState<Category>("all");
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogIssue, setCatalogIssue] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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
          setProducts(remoteProducts);
          setCatalogIssue(null);
        } else {
          setProducts(PRODUCTS);
          setCatalogIssue("No published catalog products found. Showing demo catalog.");
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Catalog unavailable";
        setProducts(PRODUCTS);
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
  });

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="relative min-h-screen w-full bg-paw-page text-paw-ink">
      {/* ===== HERO ===== */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-paw-accent-soft/60 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-paw-primary-soft/70 blur-[100px]" />
        </div>
        {/* Pet doodles */}
        <div className="absolute top-[20%] right-[5%] hidden h-12 w-20 text-paw-warning/15 doodle-float lg:block"><DoodleBowl className="h-full w-full" /></div>
        <div className="absolute bottom-[10%] left-[3%] hidden h-14 w-14 text-paw-accent/15 doodle-float-alt lg:block" style={{ animationDelay: "2s" }}><DoodlePaw className="h-full w-full" /></div>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 rounded-paw-md border border-paw-border bg-paw-panel/80 px-4 py-2 shadow-paw-panel backdrop-blur-sm"
          >
            <Package className="h-4 w-4 text-paw-primary" />
            <span className="text-sm font-bold text-paw-primary">PawPal Shop</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4 text-4xl font-extrabold tracking-tight text-paw-ink md:text-6xl"
          >
            Everything Your Pet{" "}
            <span className="text-gradient">Needs</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mb-8 max-w-xl text-lg leading-8 text-paw-body"
          >
            Premium food, toys, accessories, and health products — curated with love.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative mx-auto mb-4 max-w-lg"
          >
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              leftSlot={<Search className="h-5 w-5" aria-hidden="true" />}
              className="h-12 rounded-paw-lg bg-paw-panel/80"
            />
          </motion.div>
        </div>
      </section>

      {/* ===== CATEGORY TABS + PRODUCT GRID ===== */}
      <section className="bg-paw-accent-soft/35 py-8">
        <div className="mx-auto max-w-7xl px-4">
        <div className="mb-2 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-paw-muted" />
          <span className="text-sm font-bold text-paw-muted">Filter by category</span>
        </div>
        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCategory(cat.key)}
              className={`rounded-paw-md border px-5 py-2.5 text-sm font-bold transition cursor-pointer ${
                category === cat.key
                  ? "border-paw-primary bg-paw-primary text-white shadow-paw-action"
                  : "border-paw-border bg-paw-panel/85 text-paw-ink hover:border-paw-primary/40 hover:bg-paw-primary-soft"
              }`}
            >
              {cat.icon} {cat.label}
            </motion.button>
          ))}
        </div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-paw-muted">{filtered.length} product{filtered.length !== 1 ? "s" : ""}</p>
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
          <div className="flex items-center gap-4">
            {isAdmin && (
              <button
                onClick={() => router.push("/store/admin")}
                className="flex cursor-pointer items-center gap-1 text-sm font-bold text-paw-trust transition-colors hover:text-paw-trust-hover"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Manage catalog
              </button>
            )}
            <button
              onClick={() => router.push("/store/orders")}
              className="flex cursor-pointer items-center gap-1 text-sm font-bold text-paw-primary transition-colors hover:text-paw-primary-hover"
            >
              My Orders <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={addToCart} />
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
      <motion.button
        onClick={() => setCartOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-8 z-40 flex h-16 w-16 cursor-pointer items-center justify-center rounded-paw-lg bg-paw-primary text-white shadow-paw-action transition-colors hover:bg-paw-primary-hover"
        aria-label="Open cart"
      >
        <ShoppingCart className="h-6 w-6" />
        {totalItems > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-paw-sm bg-paw-danger text-xs font-extrabold text-white"
          >
            {totalItems}
          </motion.span>
        )}
      </motion.button>

      {/* ===== CART DRAWER ===== */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdate={updateQuantity}
        onRemove={removeItem}
        onCheckout={() => {
          setCartOpen(false);
          router.push("/store/checkout");
        }}
      />

      {/* ===== ADD-TO-CART TOAST ===== */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-28 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-paw-lg bg-paw-ink px-6 py-3 text-sm font-bold text-white shadow-paw-panel"
          >
            <span className="text-base text-paw-success">🛒</span>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
