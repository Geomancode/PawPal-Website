"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Globe from "@/components/Globe";
import { ArrowRight, MapPin, Search, ShieldCheck } from "lucide-react";
import { ReactNode } from "react";
import Badge from "@/components/ui/Badge";
import { buttonClassName } from "@/components/ui/Button";

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
      <button className={buttonClassName({ variant: "primary", size: "lg", className: "w-full sm:w-auto" })}>
        Download App
        <ArrowRight className="w-5 h-5" />
      </button>
      <button
        onClick={() => router.push("/globe")}
        className={buttonClassName({ variant: "secondary", size: "lg", className: "w-full sm:w-auto" })}
      >
        Explore Globe
      </button>
    </div>
  );
}

/* ── Hero trust badges ── */
export function HeroBadges() {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      {[
        { icon: MapPin, tone: "accent" as const, label: "Live Missions" },
        { icon: Search, tone: "success" as const, label: "AI Pet ID" },
        { icon: ShieldCheck, tone: "primary" as const, label: "Safe Network" },
      ].map((t, i) => (
        <Badge key={i} tone={t.tone} className="py-1.5">
          <t.icon className="w-4 h-4" />
          {t.label}
        </Badge>
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
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass px-4 py-1.5 rounded-paw-md text-xs text-paw-primary pointer-events-none font-bold">
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
      <button className={buttonClassName({ variant: "primary", size: "lg" })}>
        Get PawPal Free
      </button>
      <button
        onClick={() => router.push("/globe")}
        className={buttonClassName({ variant: "secondary", size: "lg" })}
      >
        Explore the Globe
      </button>
    </div>
  );
}
