"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, X, Plus, Minus, Trash2, Star, ArrowRight,
  Package, Search, SlidersHorizontal, ChevronRight,
} from "lucide-react";
import {
  PRODUCTS, CATEGORIES, Product, CartItem, Category,
  loadCart, saveCart,
} from "./storeData";
import { DoodleBowl, DoodlePaw, DoodleBone } from "@/components/PetDoodles";

// ─── Product Card ──────────────────────────────────────
function ProductCard({
  product, onAdd,
}: {
  product: Product;
  onAdd: (p: Product) => void;
}) {
  const badgeColor: Record<string, string> = {
    New: "bg-emerald-500",
    "Best Seller": "bg-[#F5A623]",
    Sale: "bg-rose-500",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -8 }}
      className="group relative bg-[#F9FAFB]/80 backdrop-blur-sm rounded-[24px] border border-[#F5E6D3]/50 hover:border-[#F5A623]/30 overflow-hidden transition-all duration-300 hover:shadow-[0_12px_40px_rgba(245,166,35,0.12)]"
    >
      {product.badge && (
        <span className={`absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-xs font-bold text-white shadow-md ${badgeColor[product.badge]}`}>
          {product.badge}
        </span>
      )}

      {/* Image area — PawView inspired: larger, warm gradient, hover color shift */}
      <div className="relative h-56 flex items-center justify-center bg-gradient-to-b from-[#FFF4E8]/60 via-white to-[#F9FAFB] group-hover:from-[#FFF4E8] group-hover:via-[#F7F8FA] transition-colors duration-500">
        <span className="text-8xl group-hover:scale-110 transition-transform duration-500 ease-out drop-shadow-sm">{product.image}</span>
        {/* Subtle decorative circle behind product */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-32 h-32 rounded-full bg-[#F5A623]/[0.04] group-hover:bg-[#F5A623]/[0.08] group-hover:scale-110 transition-all duration-500" />
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
          ))}
          <span className="text-xs text-[#6B7B8D]/70 ml-1">({product.reviewCount})</span>
        </div>

        <h3 className="font-bold text-[#1E293B] mb-1 group-hover:text-[#E8824C] transition-colors">{product.name}</h3>
        <p className="text-sm text-[#6B7B8D] line-clamp-2 mb-4">{product.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-[#1E293B]">€{product.price.toFixed(2)}</span>
            {product.originalPrice && (
              <span className="text-sm text-[#6B7B8D]/70 line-through">€{product.originalPrice.toFixed(2)}</span>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onAdd(product)}
            className="flex items-center gap-1.5 bg-[#F5A623] hover:bg-[#E8824C] text-white px-5 py-2.5 rounded-full text-sm font-bold transition-colors shadow-lg shadow-[#F5A623]/15 hover:shadow-[#E8824C]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add
          </motion.button>
        </div>
      </div>
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
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#F5A623]" />
                Your Cart ({items.length})
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingCart className="w-16 h-16 text-gray-200 mb-4" />
                  <p className="text-[#6B7B8D]/70 font-medium">Your cart is empty</p>
                  <p className="text-sm text-gray-300 mt-1">Browse products and add items to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.product.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-4 p-3 rounded-xl bg-[#F7F8FA] border border-[#F5E6D3]/60"
                    >
                      <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center text-3xl shrink-0">
                        {item.product.image}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-[#1E293B] truncate">{item.product.name}</h4>
                        <p className="text-[#E8824C] font-bold text-sm mt-0.5">€{item.product.price.toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => onUpdate(item.product.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => onUpdate(item.product.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <button onClick={() => onRemove(item.product.id)} className="p-1 hover:bg-red-50 rounded-full text-gray-300 hover:text-red-500 transition-colors cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-bold text-gray-700">€{(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t px-6 py-5 space-y-3">
                <div className="flex justify-between text-sm text-[#6B7B8D]">
                  <span>Subtotal</span><span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-[#6B7B8D]">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? <span className="text-emerald-500 font-medium">Free</span> : `€${shipping.toFixed(2)}`}</span>
                </div>
                {subtotal < 50 && (
                  <p className="text-xs text-[#E8824C] bg-[#FFF4E8] px-3 py-2 rounded-lg">
                    🚚 Add €{(50 - subtotal).toFixed(2)} more for free shipping!
                  </p>
                )}
                <div className="flex justify-between text-lg font-extrabold pt-2 border-t">
                  <span>Total</span><span>€{total.toFixed(2)}</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onCheckout}
                  className="w-full bg-[#F5A623] hover:bg-[#E8824C] text-white py-3.5 rounded-full font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  Proceed to Checkout <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main Store Page ───────────────────────────────────
export default function StorePage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [category, setCategory] = useState<Category>("all");
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { setCart(loadCart()); }, []);
  useEffect(() => { saveCart(cart); }, [cart]);

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

  const filtered = PRODUCTS.filter((p) => {
    const matchCat = category === "all" || p.category === category;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="relative w-full min-h-screen bg-[#F7F8FA]">
      {/* ===== HERO ===== */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#FFF4E8]/50 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#E0F2FE]/40 blur-[100px]" />
        </div>
        {/* Pet doodles */}
        <div className="absolute top-[20%] right-[5%] w-20 h-12 text-[#F5A623]/12 doodle-float hidden lg:block"><DoodleBowl className="w-full h-full" /></div>
        <div className="absolute bottom-[10%] left-[3%] w-14 h-14 text-[#E8824C]/10 doodle-float-alt hidden lg:block" style={{ animationDelay: '2s' }}><DoodlePaw className="w-full h-full" /></div>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
          >
            <Package className="w-4 h-4 text-[#F5A623]" />
            <span className="text-sm font-medium text-[#E8824C]">PawPal Shop</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-[#1E293B] mb-4"
          >
            Everything Your Pet{" "}
            <span className="text-gradient">Needs</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-[#6B7B8D] max-w-xl mx-auto mb-8"
          >
            Premium food, toys, accessories, and health products — curated with love.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-lg mx-auto relative mb-4"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7B8D]/70" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-3.5 rounded-full bg-white/70 backdrop-blur-sm border border-[#F5E6D3]/60 focus:border-[#F5A623] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/20 transition-all text-[#1E293B] placeholder:text-[#6B7B8D]/50"
            />
          </motion.div>
        </div>
      </section>

      {/* ===== CATEGORY TABS + PRODUCT GRID ===== */}
      <section className="bg-[#FFF4E8]/30 py-8">
        <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-2">
          <SlidersHorizontal className="w-4 h-4 text-[#6B7B8D]/70" />
          <span className="text-sm font-medium text-[#6B7B8D]/70">Filter by category</span>
        </div>
        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCategory(cat.key)}
              className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all cursor-pointer ${
                category === cat.key
                  ? "bg-[#F5A623] text-white shadow-lg shadow-[#F5A623]/20"
                  : "bg-white/80 text-[#1E293B] hover:text-[#E8824C] border border-[#F5E6D3]/60 hover:border-[#F5A623]/40"
              }`}
            >
              {cat.icon} {cat.label}
            </motion.button>
          ))}
        </div>
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-[#6B7B8D]/70">{filtered.length} product{filtered.length !== 1 ? "s" : ""}</p>
          <button
            onClick={() => router.push("/store/orders")}
            className="flex items-center gap-1 text-sm text-[#E8824C] hover:text-amber-700 font-medium transition-colors cursor-pointer"
          >
            My Orders <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={addToCart} />
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-[#6B7B8D]/70 font-medium">No products found</p>
            <p className="text-sm text-gray-300 mt-1">Try adjusting your search or category filter</p>
          </div>
        )}
        </div>
      </section>

      {/* ===== FLOATING CART BUTTON ===== */}
      <motion.button
        onClick={() => setCartOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-8 z-40 bg-[#F5A623] hover:bg-[#E8824C] text-white w-16 h-16 rounded-full shadow-2xl shadow-amber-300/40 flex items-center justify-center transition-colors cursor-pointer"
      >
        <ShoppingCart className="w-6 h-6" />
        {totalItems > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
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
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl text-sm font-medium flex items-center gap-2"
          >
            <span className="text-emerald-400 text-base">🛒</span>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
