"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Globe from "@/components/Globe";
import { ArrowRight, MapPin, Search, ShieldCheck } from "lucide-react";
import { ReactNode } from "react";

/* ── Animated wrapper (client-only) ── */
export function FadeIn({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInView({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Hero CTA buttons (need useRouter) ── */
export function HeroCTA() {
  const router = useRouter();
  return (
    <div className="flex flex-col sm:flex-row gap-4 pt-2">
      <button className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-[0_4px_20px_rgba(245,158,11,0.35)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.5)] hover:-translate-y-0.5">
        Download App
        <ArrowRight className="w-5 h-5" />
      </button>
      <button
        onClick={() => router.push("/globe")}
        className="flex items-center justify-center gap-2 glass hover:bg-white/70 text-amber-700 px-8 py-4 rounded-full font-bold text-lg transition-all border border-amber-200"
      >
        Explore Globe
      </button>
    </div>
  );
}

/* ── Hero trust badges ── */
export function HeroBadges() {
  return (
    <div className="flex items-center gap-8 pt-4">
      {[
        { icon: MapPin, color: "text-amber-500", label: "Live Missions" },
        { icon: Search, color: "text-emerald-500", label: "AI Pet ID" },
        { icon: ShieldCheck, color: "text-blue-500", label: "Safe Network" },
      ].map((t, i) => (
        <div key={i} className="flex items-center gap-2 text-gray-500">
          <t.icon className={`w-5 h-5 ${t.color}`} />
          <span className="text-sm font-medium">{t.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Globe section with animation ── */
export function GlobeSection() {
  return (
    <motion.div
      className="w-full lg:w-1/2 flex justify-center items-center h-[420px] lg:h-[700px] relative"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.15 }}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        <Globe />
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass px-4 py-1.5 rounded-full text-xs text-amber-600 animate-pulse pointer-events-none font-medium">
        Drag to spin · Click a label to explore
      </div>
    </motion.div>
  );
}

/* ── Bottom CTA section ── */
export function BottomCTA() {
  const router = useRouter();
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <button className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-[0_4px_20px_rgba(245,158,11,0.35)] hover:-translate-y-0.5">
        Get PawPal Free
      </button>
      <button
        onClick={() => router.push("/globe")}
        className="glass hover:bg-white/70 text-amber-700 px-8 py-4 rounded-full font-bold text-lg transition-all border border-amber-200"
      >
        Explore the Globe →
      </button>
    </div>
  );
}
