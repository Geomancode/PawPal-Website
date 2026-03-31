// ============================================================================
// PawPal Store — Data Types & Test Product Catalog
// ============================================================================

export type Category = "all" | "food" | "toys" | "accessories" | "health";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: Category;
  image: string;       // emoji for demo
  rating: number;
  reviewCount: number;
  badge?: "New" | "Best Seller" | "Sale";
  inStock: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ShippingInfo {
  fullName: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface PaymentInfo {
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvv: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  shipping: ShippingInfo;
  payment: { last4: string; brand: string };
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  status: "processing" | "shipped" | "delivered";
  createdAt: string;
}

export const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: "all", label: "All Products", icon: "🛍️" },
  { key: "food", label: "Food & Treats", icon: "🦴" },
  { key: "toys", label: "Toys & Play", icon: "🎾" },
  { key: "accessories", label: "Accessories", icon: "🎀" },
  { key: "health", label: "Health & Care", icon: "💊" },
];

export const PRODUCTS: Product[] = [
  // ── Food & Treats ─────────────────────────────────────
  {
    id: "f1",
    name: "Organic Salmon Bites",
    description: "Wild-caught salmon treats packed with Omega-3 for a shiny coat. Grain-free, single ingredient.",
    price: 14.99,
    category: "food",
    image: "🐟",
    rating: 4.8,
    reviewCount: 342,
    badge: "Best Seller",
    inStock: true,
  },
  {
    id: "f2",
    name: "Premium Chicken Kibble",
    description: "Vet-approved dry food with real chicken, brown rice, and sweet potato. All life stages.",
    price: 39.99,
    originalPrice: 49.99,
    category: "food",
    image: "🐔",
    rating: 4.6,
    reviewCount: 218,
    badge: "Sale",
    inStock: true,
  },
  {
    id: "f3",
    name: "Kitty Tuna Pâté",
    description: "Smooth tuna pâté with added taurine for heart health. 12-pack variety box.",
    price: 24.99,
    category: "food",
    image: "🐱",
    rating: 4.7,
    reviewCount: 156,
    inStock: true,
  },

  // ── Toys & Play ───────────────────────────────────────
  {
    id: "t1",
    name: "Smart Treat Ball",
    description: "Interactive puzzle ball that dispenses treats as your pet plays. Adjustable difficulty levels.",
    price: 19.99,
    category: "toys",
    image: "⚽",
    rating: 4.9,
    reviewCount: 487,
    badge: "Best Seller",
    inStock: true,
  },
  {
    id: "t2",
    name: "Laser Chase Toy",
    description: "Automatic laser pointer with random patterns. Keeps cats entertained for hours.",
    price: 29.99,
    category: "toys",
    image: "🔴",
    rating: 4.5,
    reviewCount: 203,
    badge: "New",
    inStock: true,
  },
  {
    id: "t3",
    name: "Indestructible Chew Bone",
    description: "Ultra-durable nylon bone with bacon flavor. Designed for aggressive chewers.",
    price: 12.99,
    category: "toys",
    image: "🦴",
    rating: 4.4,
    reviewCount: 312,
    inStock: true,
  },

  // ── Accessories ───────────────────────────────────────
  {
    id: "a1",
    name: "LED Safety Collar",
    description: "USB rechargeable LED collar with 3 glow modes. Visible up to 500m at night.",
    price: 22.99,
    category: "accessories",
    image: "✨",
    rating: 4.7,
    reviewCount: 189,
    badge: "New",
    inStock: true,
  },
  {
    id: "a2",
    name: "Adventure Harness",
    description: "No-pull padded harness with reflective strips. Ideal for hikes and walks.",
    price: 34.99,
    category: "accessories",
    image: "🐕",
    rating: 4.8,
    reviewCount: 267,
    badge: "Best Seller",
    inStock: true,
  },
  {
    id: "a3",
    name: "Personalized Pet Tag",
    description: "Stainless steel tag with custom engraving. Comes with silencer ring.",
    price: 9.99,
    category: "accessories",
    image: "🏷️",
    rating: 4.9,
    reviewCount: 534,
    inStock: true,
  },

  // ── Health & Care ─────────────────────────────────────
  {
    id: "h1",
    name: "Oatmeal Soothing Shampoo",
    description: "Hypoallergenic shampoo with colloidal oatmeal and aloe vera. Relieves itchy skin.",
    price: 16.99,
    category: "health",
    image: "🧴",
    rating: 4.6,
    reviewCount: 298,
    inStock: true,
  },
  {
    id: "h2",
    name: "Joint Health Supplements",
    description: "Glucosamine & chondroitin chewable tablets. Supports mobility in senior pets.",
    price: 27.99,
    originalPrice: 34.99,
    category: "health",
    image: "💪",
    rating: 4.7,
    reviewCount: 176,
    badge: "Sale",
    inStock: true,
  },
  {
    id: "h3",
    name: "Pet First-Aid Kit",
    description: "Complete emergency kit with bandages, antiseptic, tick remover, and guide booklet.",
    price: 32.99,
    category: "health",
    image: "🩺",
    rating: 4.8,
    reviewCount: 142,
    badge: "New",
    inStock: true,
  },
];

// ── localStorage helpers ─────────────────────────────────
const CART_KEY = "pawpal_cart";
const ORDERS_KEY = "pawpal_orders";

export function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function loadOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveOrder(order: Order) {
  const orders = loadOrders();
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function generateOrderId(): string {
  return "PP-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
}
