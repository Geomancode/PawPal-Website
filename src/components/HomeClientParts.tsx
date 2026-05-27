"use client";

import { motion, useMotionValue, useTransform, useSpring, useScroll, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Globe from "@/components/Globe";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Bot,
  Languages,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Navigation,
  Route,
  ScanLine,
  ShieldCheck,
  Globe as GlobeIcon,
  Users,
  Sparkles,
  Smartphone,
  Store,
  Trophy,
  Download,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ReactNode, useRef, useEffect, useState, useCallback, MouseEvent as ReactMouseEvent } from "react";

/* ═══════════════════════════════════════════════════════════════
   PHASE 1 — Effect #1: Animated Text Reveal (word-by-word)
   ═══════════════════════════════════════════════════════════════ */

const wordVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay: 0.3 + i * 0.08,
      duration: 0.5,
      ease: "easeOut" as const,
    },
  }),
};

export function AnimatedHeadline() {
  const lines = ["Every Moment", "with Your Pet", "Made Smarter"];
  let wordIndex = 0;

  return (
    <h1
      aria-label={lines.join(" ")}
      className="hero-headline font-brand text-6xl font-bold leading-none text-black lg:text-7xl 2xl:text-8xl"
    >
      {lines.map((line, lineIndex) => (
        <span
          key={line}
          className={`hero-headline-line hero-headline-line-${lineIndex + 1}`}
        >
          {line.split(" ").map((word, wordOffset, words) => {
            const idx = wordIndex++;
            return (
              <motion.span
                key={`${line}-${wordOffset}`}
                custom={idx}
                initial="hidden"
                animate="visible"
                variants={wordVariants}
                className={`hero-headline-word inline-block ${lineIndex === 2 ? "hero-headline-word-gradient text-gradient-animated" : ""} ${wordOffset < words.length - 1 ? "mr-[0.3em]" : ""}`}
              >
                {word}
              </motion.span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

export function HeroDescription() {
  const lines = [
    "PawPal enhances the bond between you and ",
    "your pet — with gamified walks, fog-of-war maps, ",
    "NFC safety tags, an AI assistant, and a trusted ",
    "local community — all built for pet lovers.",
  ];

  return (
    <motion.p
      className="hero-copy-description text-lg leading-relaxed text-[#8F6A56]/75 lg:text-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {lines.map((line, index) => (
        <span key={line} className={`hero-description-line hero-description-line-${index + 1}`}>
          {line}
        </span>
      ))}
    </motion.p>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 1 — Effect #2: Animated Counter (count up on scroll)
   ═══════════════════════════════════════════════════════════════ */

function parseStatValue(value: string): { prefix: string; num: number; suffix: string } {
  const match = value.match(/^([^\d]*)([\d.]+)(.*)$/);
  if (match) return { prefix: match[1], num: parseFloat(match[2]), suffix: match[3] };
  return { prefix: "", num: 0, suffix: value };
}

export function AnimatedCounter({ value, label, delay = 0 }: { value: string; label: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const { prefix, num, suffix } = parseStatValue(value);
  const [displayNum, setDisplayNum] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 1800; // ms
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayNum(eased * num);
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, num]);

  const displayedValue = (() => {
    if (!isInView) return 0;
    if (num === 0) return 0;
    if (num % 1 !== 0) return displayNum.toFixed(1);
    if (num <= 5) return Math.min(num, Math.max(1, Math.round(displayNum)));
    return Math.floor(displayNum);
  })();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="relative"
    >
      <div className="text-3xl md:text-4xl font-extrabold text-gradient-animated font-brand tabular-nums">
        {isInView ? (
          <>{prefix}{displayedValue}{suffix}</>
        ) : (
          <>{prefix}0{suffix}</>
        )}
      </div>
      <div className="mt-1 text-sm font-medium text-paw-muted">{label}</div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 1 — Effect #3: Spotlight Card (cursor-following glow)
   ═══════════════════════════════════════════════════════════════ */

export function SpotlightCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Spotlight gradient overlay */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) =>
              `radial-gradient(400px circle at ${x}px ${y}px, rgba(74, 144, 217, 0.08), transparent 60%)`
          ),
        }}
      />
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 1 — Effect #4: Scroll Progress Bar
   ═══════════════════════════════════════════════════════════════ */

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      className="scroll-progress"
      style={{ scaleX }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 1 — Effect #5: Breathing Background Blobs
   ═══════════════════════════════════════════════════════════════ */

export function HeroBlobs() {
  return (
    <div className="home-hero-field absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-paw-page to-transparent" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Existing components — Updated with brand enhancements
   ═══════════════════════════════════════════════════════════════ */

/* ── Animated wrapper (client-only) ── */
export function FadeIn({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
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
      transition={{ delay, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Hero CTA buttons — with hover micro-animation ── */
export function HeroCTA() {
  return (
    <motion.div
      className="hero-cta flex flex-col sm:flex-row gap-4 pt-2"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0, duration: 0.6 }}
    >
      <motion.div
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <Link
          href="/auth"
          className="flex items-center justify-center gap-2 whitespace-nowrap rounded-paw-lg bg-paw-primary px-8 py-4 text-lg font-bold text-white shadow-paw-action transition-colors hover:bg-paw-primary-hover"
        >
          Download App
          <Download className="w-5 h-5" />
        </Link>
      </motion.div>
      <motion.div
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <Link
          href="/globe"
          className="flex items-center justify-center gap-2 whitespace-nowrap rounded-paw-lg border border-[#76C7B8]/30 bg-[#76C7B8]/75 px-8 py-4 text-lg font-bold text-white transition-colors hover:border-[#76C7B8]/50 hover:bg-[#76C7B8]"
        >
          <GlobeIcon className="w-5 h-5" />
          Explore Globe
        </Link>
      </motion.div>
    </motion.div>
  );
}

/* ── Hero trust badges — staggered entry ── */
export function HeroBadges() {
  const badges = [
    { icon: MapPin, color: "text-paw-primary", label: "Gamified Walks" },
    { icon: Bot, color: "text-paw-primary", label: "AI Pet Assistant" },
    { icon: ShieldCheck, color: "text-paw-primary", label: "NFC Safety Tags" },
  ];

  return (
    <motion.div
      className="hero-trust-badges flex flex-wrap items-center gap-x-7 gap-y-3 pt-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.3, duration: 0.6 }}
    >
      {badges.map((t, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-2 whitespace-nowrap text-[#8F6A56]"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.4 + i * 0.12 }}
        >
          <t.icon className={`w-5 h-5 ${t.color}`} />
          <span className="text-sm font-medium">{t.label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ── Globe section with animation ── */
export function GlobeSection() {
  return (
    <motion.div
      className="hero-orbit-globe relative flex h-[420px] w-full items-center justify-center overflow-visible"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="hero-globe-shell pointer-events-auto absolute inset-0 flex items-center justify-center">
        <Globe />
      </div>
      <motion.div
        className="hero-globe-hint glass pointer-events-none absolute whitespace-nowrap rounded-paw-md px-4 py-1.5 text-xs font-medium text-paw-trust"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0.6, 1] }}
        transition={{ delay: 1.5, duration: 3, repeat: Infinity, repeatDelay: 4 }}
      >
        Drag to spin - click to explore
      </motion.div>
    </motion.div>
  );
}

/* ── Bottom CTA section — with hover animations ── */
export function BottomCTA() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <MagneticButton>
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            href="/globe"
            className="inline-flex items-center justify-center gap-2 rounded-paw-lg bg-paw-primary px-8 py-4 text-lg font-bold text-white shadow-paw-action transition-colors hover:bg-paw-primary-hover"
          >
            Open the Globe
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </MagneticButton>
      <MagneticButton>
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            href="/store"
            className="glass inline-flex items-center justify-center gap-2 rounded-paw-lg border border-paw-trust/20 px-8 py-4 text-lg font-bold text-paw-trust transition-colors hover:border-paw-trust/40 hover:bg-white/70"
          >
            <Store className="h-5 w-5" />
            View NFC Tags
          </Link>
        </motion.div>
      </MagneticButton>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 2 — Effect #6: Bento Feature Grid
   ═══════════════════════════════════════════════════════════════ */

export function BentoFeatureGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-[minmax(180px,auto)]">
      {/* Card 1: Fog-of-war map */}
      <SpotlightCard className="glass rounded-2xl border border-paw-border transition-all duration-300 hover:border-paw-trust/30 hover:shadow-xl group cursor-default bento-glow lg:row-span-2 p-8 flex flex-col justify-between">
        <div>
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-paw-sm bg-paw-trust-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-paw-trust">Solo Mode</div>
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-paw-lg bg-paw-trust-soft text-paw-trust transition-transform duration-300 group-hover:scale-110">
            <GlobeIcon className="w-7 h-7" />
          </div>
          <h3 className="mb-3 text-xl font-bold text-paw-ink">Fog-of-War Map</h3>
          <p className="text-sm leading-relaxed text-paw-body">
            Every walk reveals new map tiles, creates route history, and turns daily exercise into visible progress for owners and pets.
          </p>
        </div>
        {/* Hex grid visual */}
        <div className="relative mt-6 flex h-32 items-center justify-center overflow-hidden rounded-paw-md bg-gradient-to-br from-paw-trust-soft to-paw-success-soft">
          <div className="grid grid-cols-5 gap-1">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-sm transition-all duration-500 ${
                  i % 3 === 0 ? "bg-paw-primary/30" : i % 4 === 0 ? "bg-paw-trust/20" : "bg-paw-ink/8"
                }`}
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <div className="absolute bottom-2 right-3 text-[10px] font-bold text-paw-trust/70">Route progress</div>
        </div>
      </SpotlightCard>

      {/* Card 2: NFC safety tags */}
      <SpotlightCard className="glass rounded-2xl border border-paw-border transition-all duration-300 hover:border-paw-primary/30 hover:shadow-xl group cursor-default bento-glow p-7 flex flex-col justify-between">
        <div>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-paw-md bg-paw-primary-soft text-paw-primary transition-transform duration-300 group-hover:scale-110">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-paw-ink">NFC Safety Tags</h3>
          <p className="text-sm leading-relaxed text-paw-body">
            A smart collar tag opens a secure pet profile in the browser. Finders do not need the app, and owner contact details stay controlled until lost mode.
          </p>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-paw-sm bg-paw-primary-soft px-3 py-2 text-xs font-medium text-paw-primary">
          <ScanLine className="h-4 w-4" />
          Scan at pawpal.be/tag - no install needed
        </div>
      </SpotlightCard>

      {/* Card 3: Local Community */}
      <SpotlightCard className="glass rounded-2xl border border-paw-border transition-all duration-300 hover:border-paw-success/30 hover:shadow-xl group cursor-default bento-glow p-7 flex flex-col justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-paw-success-soft text-[10px] font-bold text-paw-success uppercase tracking-wider mb-4">Community Mode</div>
          <div className="w-12 h-12 rounded-paw-md flex items-center justify-center bg-paw-success-soft text-paw-success mb-4 group-hover:scale-105 transition-transform duration-300">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-paw-ink">Local Pet Network</h3>
          <p className="text-sm leading-relaxed text-paw-body">
            Coordinate walks, local tips, help requests, and lost-pet alerts through a trusted map-first neighborhood layer.
          </p>
        </div>
        {/* User stack */}
        <div className="flex -space-x-2 mt-4">
          {["var(--color-paw-primary)", "var(--color-paw-trust)", "var(--color-paw-success)", "var(--color-paw-warning)", "var(--color-paw-danger)"].map((c, i) => (
            <div
              key={i}
              className="w-9 h-9 rounded-full border-2 border-paw-panel flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: c, zIndex: 5 - i }}
            >
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
      </SpotlightCard>

      {/* Card 4: PawPoints + AI — wide spanning 2 cols */}
      <SpotlightCard className="glass rounded-2xl border border-paw-border transition-all duration-300 hover:border-paw-primary/30 hover:shadow-xl group cursor-default bento-glow lg:col-span-2 p-7 flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-paw-md bg-paw-primary-soft text-paw-primary transition-transform duration-300 group-hover:scale-110">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-paw-ink">PawPoints & AI Assistant</h3>
          <p className="text-sm leading-relaxed text-paw-body">
            Reward progress, summarize care questions, identify breeds, and surface useful next actions from one assistant instead of scattered pet tools.
          </p>
        </div>
        {/* Points visual */}
        <div className="relative flex h-28 w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-paw-md bg-gradient-to-br from-paw-primary-soft to-paw-trust-soft md:w-48">
          <Trophy className="h-8 w-8 text-paw-warning" />
          <div className="text-lg font-bold text-paw-primary">+150 pts</div>
          <div className="text-[10px] text-paw-muted">Daily walk completed</div>
          <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-paw-primary/40 to-transparent blob-animate-1" style={{ bottom: "20%" }} />
        </div>
      </SpotlightCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 2 — Effect #7: Trust Marquee (infinite scroll)
   ═══════════════════════════════════════════════════════════════ */

const TRUST_ITEMS: Array<{ icon: LucideIcon; label: string; color: string }> = [
  { icon: BadgeCheck, label: "Built in Ghent, Belgium", color: "text-paw-primary" },
  { icon: LockKeyhole, label: "GDPR-first design", color: "text-paw-trust" },
  { icon: Bot, label: "AI care assistant", color: "text-paw-primary" },
  { icon: Navigation, label: "Walk route tracking", color: "text-paw-trust" },
  { icon: GlobeIcon, label: "Fog-of-war map engine", color: "text-paw-primary" },
  { icon: Award, label: "PawPoints rewards", color: "text-paw-warning" },
  { icon: ScanLine, label: "NFC smart tags", color: "text-paw-trust" },
  { icon: Languages, label: "5 languages supported", color: "text-paw-primary" },
];

export function TrustMarquee() {
  return (
    <div className="relative overflow-hidden py-6">
      {/* Fade edges */}
      <div className="absolute bottom-0 left-0 top-0 z-10 w-20 bg-gradient-to-r from-paw-panel-subtle to-transparent" />
      <div className="absolute bottom-0 right-0 top-0 z-10 w-20 bg-gradient-to-l from-paw-panel-subtle to-transparent" />

      <div className="flex marquee-track" style={{ width: "max-content" }}>
        {/* Duplicate items for seamless loop */}
        {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
          <div
            key={i}
            className="glass mx-2 flex items-center gap-2.5 whitespace-nowrap rounded-paw-lg border border-paw-border px-6 py-3 transition-all hover:border-paw-primary/25 hover:shadow-sm"
          >
            <item.icon className={`h-4 w-4 ${item.color}`} />
            <span className="text-sm font-medium text-paw-ink">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Product workflow section
   ═══════════════════════════════════════════════════════════════ */

const FLOW_STEPS: Array<{
  icon: LucideIcon;
  kicker: string;
  title: string;
  copy: string;
  color: string;
  surface: string;
}> = [
  {
    icon: Route,
    kicker: "Walk",
    title: "Reveal the places you actually use",
    copy: "Track a route, uncover map tiles, save history, and make daily walks feel purposeful without adding more admin.",
    color: "text-paw-primary",
    surface: "bg-paw-primary-soft",
  },
  {
    icon: ScanLine,
    kicker: "Safety",
    title: "Make the collar useful in a real rescue",
    copy: "A finder scans the tag, sees the public pet profile, and can reach the owner through controlled lost-mode details.",
    color: "text-paw-trust",
    surface: "bg-paw-trust-soft",
  },
  {
    icon: MessageCircle,
    kicker: "Community",
    title: "Turn local pet knowledge into action",
    copy: "Nearby places, alerts, missions, and help requests live around the map instead of disappearing in separate chats.",
    color: "text-paw-accent",
    surface: "bg-paw-accent-soft",
  },
];

export function ProductFlow() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {FLOW_STEPS.map((step, i) => (
        <FadeInView key={step.title} delay={i * 0.12}>
          <div className="group h-full rounded-paw-lg border border-paw-border bg-paw-panel p-6 shadow-paw-panel transition-all duration-300 hover:-translate-y-1 hover:border-paw-primary/30">
            <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-paw-md ${step.surface} ${step.color}`}>
              <step.icon className="h-6 w-6" />
            </div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-paw-muted">{step.kicker}</div>
            <h3 className="mb-3 text-xl font-bold text-paw-ink">{step.title}</h3>
            <p className="text-sm leading-relaxed text-paw-body">{step.copy}</p>
          </div>
        </FadeInView>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 2 — Effect #8: App Screenshot Showcase
   ═══════════════════════════════════════════════════════════════ */

export function AppShowcase() {
  const features = [
    { icon: MapPin, title: "Walk Tracking", desc: "Routes, fog tiles, and progress", color: "bg-paw-primary-soft text-paw-primary" },
    { icon: ShieldCheck, title: "NFC Safety", desc: "Browser-first rescue profiles", color: "bg-paw-trust-soft text-paw-trust" },
    { icon: Sparkles, title: "AI Assistant", desc: "Breed, care, and behavior help", color: "bg-paw-success-soft text-paw-success" },
    { icon: Users, title: "Community", desc: "Local places, alerts, and help", color: "bg-paw-accent-soft text-paw-accent" },
  ];

  const thoughtfulFeatures = [
    {
      title: "Walk & Explore",
      desc: "Gamified walks with fog-of-war maps, real-time tracking, route history, and PawPoints rewards.",
      mockups: ["/images/mockup-walk.png", "/images/app-mockup.png"],
      iconColor: "text-paw-primary",
      bgColor: "bg-paw-primary-soft",
      borderColor: "border-paw-primary/20",
    },
    {
      title: "Smart Safety",
      desc: "NFC tags turn any collar into a smart ID. Finders scan without installing the app, while owner details stay privacy-controlled.",
      mockups: ["/images/mockup-nfc.png", "/images/mockup-profile.png"],
      iconColor: "text-paw-trust",
      bgColor: "bg-paw-trust-soft",
      borderColor: "border-paw-trust/20",
    },
    {
      title: "AI & Community",
      desc: "AI-powered breed ID, care advice, and behavior analysis sit beside a local network for walks, sitting, and urgent alerts.",
      mockups: ["/images/mockup-ai.png", "/images/mockup-community.png"],
      iconColor: "text-paw-success",
      bgColor: "bg-paw-success-soft",
      borderColor: "border-paw-success/20",
    },
  ];

  return (
    <div className="space-y-20">
      {/* ══════ SECTION 1: Hero App Overview ══════ */}
      <FadeInView>
        <div className="relative overflow-hidden rounded-paw-lg border border-paw-primary/20 bg-gradient-to-br from-paw-primary-soft via-paw-panel-subtle to-paw-trust-soft shadow-paw-panel">
          {/* Decorative sparkle elements */}
          <svg className="absolute top-6 left-8 hidden h-10 w-10 text-paw-primary/25 lg:block" viewBox="0 0 40 40" fill="none">
            <path d="M20 2v8M20 30v8M2 20h8M30 20h8M8 8l5 5M27 27l5 5M8 32l5-5M27 13l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <svg className="absolute top-12 left-20 hidden h-5 w-5 text-paw-primary/30 lg:block" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 0l2.5 7.5H20l-6 4.5 2.5 7.5L10 15l-6.5 4.5L6 12 0 7.5h7.5z"/>
          </svg>

          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-0">
            {/* Left: Text content */}
            <div className="flex-1 p-8 lg:p-12 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-paw-md bg-paw-primary-soft px-3 py-1.5 text-sm font-semibold text-paw-primary">
                <Smartphone className="w-4 h-4" />
                PawPal app ecosystem
              </div>
              <h2 className="font-brand text-3xl font-bold leading-tight text-paw-ink md:text-4xl">
                The daily pet workflow,{" "}
                <span className="text-gradient-animated">kept in sync</span>
              </h2>
              <p className="max-w-md text-lg leading-relaxed text-paw-body">
                The website introduces the public map, NFC profiles, and store; the app keeps owners moving, caring, and coordinating day to day.
              </p>

              {/* Feature chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {features.map((f, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 rounded-paw-lg bg-paw-panel/70 backdrop-blur-sm border border-paw-border hover:shadow-md transition-all"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                  >
                    <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center shrink-0`}>
                      <f.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-paw-ink">{f.title}</div>
                      <div className="text-xs text-paw-muted">{f.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Download CTA */}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <motion.a
                  href="/globe"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 rounded-paw-md bg-paw-primary px-6 py-3 text-sm font-bold text-white shadow-paw-action transition-colors hover:bg-paw-primary-hover"
                >
                  <GlobeIcon className="w-4 h-4" /> Explore Globe
                </motion.a>
                <motion.a
                  href="/store"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 rounded-paw-md border border-paw-border bg-paw-panel px-6 py-3 text-sm font-bold text-paw-ink transition-colors hover:border-paw-primary"
                >
                  <ShieldCheck className="w-4 h-4" /> View NFC Tags
                </motion.a>
              </div>
            </div>

            {/* Right: App mockup image */}
            <div className="relative flex-1 flex items-center justify-center p-4 lg:p-8">
              <motion.div
                className="relative z-10"
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Image
                  src="/images/app-mockup.png"
                  alt="PawPal App Interface"
                  width={300}
                  height={620}
                  sizes="(min-width: 1024px) 300px, 260px"
                  className="w-[260px] lg:w-[300px] h-auto drop-shadow-2xl"
                />
              </motion.div>

              {/* Floating badges */}
              <motion.div
                className="absolute right-4 top-8 z-20 flex items-center gap-2 rounded-paw-lg border border-paw-border bg-paw-panel/90 px-3 py-2 text-xs font-semibold text-paw-ink shadow-lg backdrop-blur-sm lg:right-8"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-paw-success" />
                GPS Active
              </motion.div>
              <motion.div
                className="absolute bottom-12 left-2 z-20 flex items-center gap-2 rounded-paw-lg border border-paw-border bg-paw-panel/90 px-3 py-2 text-xs font-semibold text-paw-ink shadow-lg backdrop-blur-sm lg:left-4"
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <Route className="h-3.5 w-3.5 text-paw-primary" />
                3.2km walked today
              </motion.div>
            </div>
          </div>
        </div>
      </FadeInView>

      {/* ══════ SECTION 2: 3 Powerful Features — PawView-inspired ══════ */}
      <div>
        <FadeInView>
          <div className="text-center mb-12">
            <h2 className="mb-3 font-brand text-3xl font-bold text-paw-ink md:text-4xl">
              Three moments that matter
            </h2>
            <p className="mx-auto max-w-lg text-paw-body">
              PawPal focuses on the jobs owners understand immediately: walks, safety, and trusted local help.
            </p>
          </div>
        </FadeInView>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {thoughtfulFeatures.map((feature, i) => (
            <FadeInView key={i} delay={i * 0.15}>
              <div className={`relative rounded-paw-lg ${feature.bgColor} border ${feature.borderColor} p-6 pb-4 overflow-hidden h-full flex flex-col`}>
                {/* Phone mockups */}
                <div className="flex justify-center gap-3 mb-6">
                  {feature.mockups.map((src, j) => (
                    <motion.div
                      key={j}
                      className="relative h-[160px] w-[120px] overflow-hidden rounded-paw-md shadow-lg md:h-[148px] md:w-[110px] lg:h-[174px] lg:w-[130px]"
                      style={{ marginTop: j % 2 === 1 ? "16px" : "0px" }}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: j % 2 === 1 ? 16 : 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + j * 0.1 }}
                      whileHover={{ y: (j % 2 === 1 ? 16 : 0) - 6, scale: 1.03 }}
                    >
                      <Image
                        src={src}
                        alt={`${feature.title} screenshot ${j + 1}`}
                        fill
                        sizes="(min-width: 1024px) 130px, (min-width: 768px) 110px, 120px"
                        className="object-cover"
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Text */}
                <div className="text-center mt-auto">
                  <h3 className="mb-2 text-lg font-bold text-paw-ink">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-paw-body">{feature.desc}</p>
                </div>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 3 — Effect #11: Floating Particles
   ═══════════════════════════════════════════════════════════════ */

export function FloatingParticles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${5 + (i * 5.2) % 90}%`,
    size: 3 + (i % 4) * 1.5,
    delay: i * 0.8,
    duration: 6 + (i % 5) * 2,
    color: i % 3 === 0
      ? "rgba(245, 158, 11, 0.5)"
      : i % 3 === 1
        ? "rgba(74, 144, 217, 0.4)"
        : "rgba(16, 185, 129, 0.35)",
    alt: i % 2 === 0,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            bottom: `${10 + (p.id * 7) % 40}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `${p.alt ? "float-particle-alt" : "float-particle"} ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 3 — Effect #13: Magnetic Button
   ═══════════════════════════════════════════════════════════════ */

export function MagneticButton({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distX = (e.clientX - centerX) * 0.15;
    const distY = (e.clientY - centerY) * 0.15;
    x.set(distX);
    y.set(distY);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}
