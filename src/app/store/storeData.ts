// ============================================================================
// PawPal Store — Data Types & Test Product Catalog
// ============================================================================

import { supabase } from "@/lib/supabase";

export type Category = "all" | "food" | "toys" | "accessories" | "health";
export type ProductBadge = "New" | "Best Seller" | "Sale";

export interface Product {
  id: string;
  slug?: string;
  sku?: string;
  name: string;
  description: string;
  details?: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  category: Category;
  image: string;       // emoji fallback when no product image URL exists
  imageUrl?: string;
  imageFit?: "cover" | "contain";
  detailImages?: ProductDetailImage[];
  rating: number;
  reviewCount: number;
  badge?: ProductBadge;
  inStock: boolean;
  stockQuantity?: number;
  published?: boolean;
  tags?: string[];
}

export type ProductDetailImage = {
  src: string;
  alt: string;
};

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

export type ProductRow = {
  id: string;
  slug?: string | null;
  sku?: string | null;
  name: string;
  description?: string | null;
  details?: string | null;
  price: number | string;
  original_price?: number | string | null;
  currency?: string | null;
  category: string;
  image_url?: string | null;
  rating?: number | string | null;
  review_count?: number | string | null;
  badge?: ProductBadge | null;
  in_stock?: boolean | null;
  stock_quantity?: number | null;
  published?: boolean | null;
  tags?: string[] | null;
};

export const PRODUCT_SELECT = [
  "id",
  "slug",
  "sku",
  "name",
  "description",
  "details",
  "price",
  "original_price",
  "currency",
  "category",
  "image_url",
  "rating",
  "review_count",
  "badge",
  "in_stock",
  "stock_quantity",
  "published",
  "tags",
  "sort_order",
  "created_at",
].join(",");

export function isCatalogImageUrl(value?: string | null): value is string {
  if (!value) return false;
  return /^(https?:\/\/|\/|data:image\/)/.test(value.trim());
}

export function productFromRow(row: ProductRow): Product {
  const image = row.image_url?.trim() || "📦";
  const hasImageUrl = isCatalogImageUrl(image);
  const category = CATEGORIES.some((item) => item.key === row.category)
    ? (row.category as Category)
    : "accessories";

  return withProductAssetOverrides({
    id: row.id,
    slug: row.slug ?? undefined,
    sku: row.sku ?? undefined,
    name: row.name,
    description: row.description ?? "",
    details: row.details ?? undefined,
    price: Number(row.price) || 0,
    originalPrice:
      row.original_price === null || row.original_price === undefined
        ? undefined
        : Number(row.original_price),
    currency: row.currency ?? "EUR",
    category,
    image: hasImageUrl ? "📦" : image,
    imageUrl: hasImageUrl ? image : undefined,
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    badge: row.badge ?? undefined,
    inStock: row.in_stock ?? true,
    stockQuantity: row.stock_quantity ?? undefined,
    published: row.published ?? true,
    tags: row.tags ?? [],
  });
}

const WATER_BOTTLE_DETAIL_IMAGES: ProductDetailImage[] = [
  {
    src: "/assets/store-products/current/water-bottle/details/portable-water-food-bottle.png",
    alt: "Portable pet water and food bottle with outdoor use cases.",
  },
  {
    src: "/assets/store-products/current/water-bottle/details/travel-design.jpg",
    alt: "Smart two-in-one travel design details for the PawPal water and food bottle.",
  },
  {
    src: "/assets/store-products/current/water-bottle/details/product-details.jpg",
    alt: "Product details for the PawPal water and food bottle.",
  },
];

const POOP_SCOOPER_DETAIL_IMAGES: ProductDetailImage[] = [
  {
    src: "/assets/store-products/current/poop-scooper/details/portable-poop-picker.png",
    alt: "Portable pet poop picker hero details.",
  },
  {
    src: "/assets/store-products/current/poop-scooper/details/smarter-cleanup.png",
    alt: "Smarter cleanup use cases for the PawPal poop picker.",
  },
  {
    src: "/assets/store-products/current/poop-scooper/details/product-details.png",
    alt: "Product details for the PawPal portable poop picker.",
  },
  {
    src: "/assets/store-products/current/poop-scooper/details/how-it-works.png",
    alt: "How the PawPal portable poop picker works.",
  },
];

function productKey(product: Product) {
  return `${product.slug ?? ""} ${product.sku ?? ""} ${product.name}`.toLowerCase();
}

export function withProductAssetOverrides(product: Product): Product {
  const key = productKey(product);

  if (key.includes("water") && (key.includes("bottle") || key.includes("feeder"))) {
    return {
      ...product,
      image: "📦",
      imageUrl: WATER_BOTTLE_DETAIL_IMAGES[0].src,
      imageFit: "contain",
      detailImages: WATER_BOTTLE_DETAIL_IMAGES,
    };
  }

  if (key.includes("poop") || key.includes("scooper") || key.includes("picker")) {
    return {
      ...product,
      image: "📦",
      imageUrl: POOP_SCOOPER_DETAIL_IMAGES[0].src,
      imageFit: "contain",
      detailImages: POOP_SCOOPER_DETAIL_IMAGES,
    };
  }

  return product;
}

export async function fetchCatalogProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => productFromRow(row as unknown as ProductRow));
}

export async function checkStoreAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_store_admin");
  if (error) return false;
  return Boolean(data);
}

export function formatPrice(product: Product): string {
  const symbol = product.currency === "EUR" || !product.currency ? "€" : `${product.currency} `;
  return `${symbol}${product.price.toFixed(2)}`;
}

export function formatOptionalPrice(product: Product): string | undefined {
  if (typeof product.originalPrice !== "number") return undefined;
  const symbol = product.currency === "EUR" || !product.currency ? "€" : `${product.currency} `;
  return `${symbol}${product.originalPrice.toFixed(2)}`;
}

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
