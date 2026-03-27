"use client";

import { motion } from "framer-motion";
import { ShoppingBag, Star, Tag, Truck, ShieldCheck, ArrowRight } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

/* ── Product Data ── */
const CATEGORIES = ["All", "Accessories", "Tech", "Apparel", "Care"] as const;

interface Product {
  id: number;
  name: string;
  desc: string;
  price: string;
  oldPrice?: string;
  category: string;
  badge?: string;
  rating: number;
  reviews: number;
  image: string;
}

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "PawPal NFC Smart Tag",
    desc: "Lost pet? One tap reveals your contact info. GPS-free, battery-free, works forever.",
    price: "€14.99",
    oldPrice: "€19.99",
    category: "Tech",
    badge: "Best Seller",
    rating: 4.9,
    reviews: 342,
    image: "https://images.unsplash.com/photo-1583337130417-13104dec14a3?w=400&h=400&fit=crop",
  },
  {
    id: 2,
    name: "Reflective Adventure Harness",
    desc: "Ergonomic no-pull harness with 3M reflective strips. Perfect for night walks.",
    price: "€34.99",
    category: "Accessories",
    rating: 4.7,
    reviews: 189,
    image: "https://images.unsplash.com/photo-1601758124277-f0086d5ab253?w=400&h=400&fit=crop",
  },
  {
    id: 3,
    name: "PawPal Bandana Pack (3x)",
    desc: "Stylish snap-on bandanas in amber, emerald & sky blue. Machine washable.",
    price: "€12.99",
    category: "Apparel",
    badge: "New",
    rating: 4.8,
    reviews: 97,
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop",
  },
  {
    id: 4,
    name: "Natural Paw Balm",
    desc: "Organic shea butter balm for cracked paws. Vet-approved, lick-safe formula.",
    price: "€9.99",
    category: "Care",
    rating: 4.6,
    reviews: 214,
    image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop",
  },
  {
    id: 5,
    name: "GPS Walk Tracker Clip",
    desc: "Attach to any collar. Syncs walks, calories, and routes to the PawPal app.",
    price: "€39.99",
    oldPrice: "€49.99",
    category: "Tech",
    badge: "20% Off",
    rating: 4.5,
    reviews: 128,
    image: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&h=400&fit=crop",
  },
  {
    id: 6,
    name: "Eco Travel Water Bottle",
    desc: "Collapsible silicone bowl + 500ml BPA-free bottle. One-hand operation.",
    price: "€16.99",
    category: "Accessories",
    rating: 4.8,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=400&h=400&fit=crop",
  },
  {
    id: 7,
    name: "PawPal Hoodie — Human Edition",
    desc: "Premium cotton blend hoodie with embroidered paw logo. Unisex fit.",
    price: "€44.99",
    category: "Apparel",
    rating: 4.9,
    reviews: 73,
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
  },
  {
    id: 8,
    name: "Calming Anxiety Wrap",
    desc: "Gentle compression vest for thunder, fireworks & travel stress. Sizes XS–XL.",
    price: "€24.99",
    category: "Care",
    badge: "Popular",
    rating: 4.7,
    reviews: 201,
    image: "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400&h=400&fit=crop",
  },
];

/* ── Stars component ── */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-200"}`}
        />
      ))}
    </div>
  );
}

/* ── Page ── */
export default function StorePage() {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered = activeCategory === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#fffdf9]">
      {/* Hero */}
      <section className="relative pt-28 pb-16 px-4 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-[-5%] right-[-5%] w-[35%] h-[35%] rounded-full bg-amber-100/60 blur-[100px]" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] rounded-full bg-emerald-100/40 blur-[100px]" />
        </div>

        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur border border-amber-200/50 mb-6">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-600">PawPal Store</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
              Gear Up for <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Adventure</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
              Premium pet essentials designed by the PawPal community. Every purchase supports animal shelters worldwide.
            </p>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            className="flex flex-wrap justify-center gap-6 text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {[
              { icon: Truck, text: "Free Shipping 50€+" },
              { icon: ShieldCheck, text: "30-Day Returns" },
              { icon: Tag, text: "Shelter Donations" },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <t.icon className="w-4 h-4 text-amber-500" />
                <span className="font-medium">{t.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="max-w-6xl mx-auto px-4 mb-10">
        <div className="flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                activeCategory === cat
                  ? "bg-amber-500 text-white shadow-[0_4px_15px_rgba(245,158,11,0.35)]"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-amber-300 hover:text-amber-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Product Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-amber-200/60 transition-all duration-300"
            >
              {/* Image */}
              <div className="relative aspect-square bg-gray-50 overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                {product.badge && (
                  <span className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    {product.badge}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-gray-800 text-sm mb-1 group-hover:text-amber-600 transition-colors">{product.name}</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">{product.desc}</p>

                <div className="flex items-center gap-2 mb-3">
                  <Stars rating={product.rating} />
                  <span className="text-[10px] text-gray-400">({product.reviews})</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-extrabold text-gray-900">{product.price}</span>
                    {product.oldPrice && (
                      <span className="text-xs text-gray-400 line-through">{product.oldPrice}</span>
                    )}
                  </div>
                  <button className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95">
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No products in this category yet</p>
          </div>
        )}
      </section>

      {/* Newsletter CTA */}
      <section className="bg-gradient-to-r from-amber-50 to-emerald-50 py-16">
        <div className="max-w-2xl mx-auto text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Get Early Access & Deals</h2>
            <p className="text-gray-500 mb-6">Join our pack. Be first to know about new drops and exclusive discounts.</p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-5 py-3 rounded-full bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
              <button className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-[0_4px_15px_rgba(245,158,11,0.35)] hover:-translate-y-0.5">
                Subscribe
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
