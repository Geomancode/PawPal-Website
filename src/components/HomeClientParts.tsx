"use client";

import { motion, useInView, useScroll, useSpring } from "framer-motion";
import Globe from "@/components/Globe";
import Image from "next/image";
import Link from "next/link";
import {
  Bot,
  Footprints,
  HeartHandshake,
  Languages,
  LockKeyhole,
  Map,
  Navigation,
  Route,
  ScanLine,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ReactNode, useEffect, useRef, useState, useSyncExternalStore } from "react";

const ease = [0.25, 0.46, 0.45, 0.94] as const;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function enterMotion(shouldReduceMotion: boolean | null, y = 18, delay = 0) {
  return {
    initial: shouldReduceMotion ? false : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: shouldReduceMotion
      ? { duration: 0 }
      : { delay, duration: 0.55, ease },
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

export function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const shouldReduceMotion = useHydratedReducedMotion();

  return (
    <motion.div
      {...enterMotion(shouldReduceMotion, 18, delay)}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInView({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const shouldReduceMotion = useHydratedReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={shouldReduceMotion ? { duration: 0 } : { delay, duration: 0.58, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScrollProgress() {
  const shouldReduceMotion = useHydratedReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return <motion.div className="scroll-progress" style={{ scaleX: shouldReduceMotion ? scrollYProgress : scaleX }} />;
}

export function HeroBlobs() {
  return (
    <div className="home-hero-field absolute inset-0 -z-10" aria-hidden="true">
      <div className="hero-map-grid absolute inset-0 opacity-[0.18]" />
      <div className="hero-safety-ribbon absolute inset-x-0 top-20 h-40" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-paw-page to-transparent" />
    </div>
  );
}

export function AnimatedHeadline() {
  return (
    <h1
      aria-label="PawPal pet safety for every walk"
      className="homepage-hero-headline max-w-3xl font-brand text-[3.15rem] font-extrabold leading-[1.02] tracking-normal text-paw-ink sm:text-6xl lg:text-[4.45rem] xl:text-[4.65rem]"
    >
      <span className="block sm:whitespace-nowrap">PawPal pet safety</span>
      {" "}
      <span className="block text-paw-primary">for every walk</span>
    </h1>
  );
}

export function HeroDescription() {
  const shouldReduceMotion = useHydratedReducedMotion();

  return (
    <motion.p
      className="max-w-xl break-words text-base leading-7 text-paw-body sm:text-lg sm:leading-8"
      {...enterMotion(shouldReduceMotion, 18, 0.18)}
    >
      Built in Belgium, PawPal turns every walk into a safer route with
      smart tags, finder profiles, and nearby pet help in one calm app.
    </motion.p>
  );
}

export function HeroCTA() {
  const shouldReduceMotion = useHydratedReducedMotion();

  return (
    <motion.div
      className="flex w-full max-w-[calc(100vw-2.5rem)] flex-col gap-3 pt-2 sm:max-w-none sm:flex-row"
      {...enterMotion(shouldReduceMotion, 14, 0.28)}
    >
      <Link
        href="/globe"
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-paw-sm border-b-4 border-paw-primary-contrast bg-paw-primary px-6 text-sm font-bold text-white shadow-paw-action transition hover:bg-paw-primary-hover active:translate-y-1 active:border-b-2 active:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw-primary sm:w-auto"
      >
        Start a safe walk
        <Footprints className="h-4 w-4" />
      </Link>
      <Link
        href="/store"
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-paw-sm border border-b-4 border-paw-border-strong bg-paw-panel px-6 text-sm font-bold text-paw-ink transition hover:border-paw-primary hover:bg-paw-primary-soft hover:text-paw-primary active:translate-y-0.5 active:border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw-primary sm:w-auto"
      >
        Get Smart Tag
        <Store className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}

export function HeroSignalRail() {
  const shouldReduceMotion = useHydratedReducedMotion();
  const signals = [
    { label: "Smart tag scan", value: "1 tap", icon: ScanLine },
    { label: "Route revealed", value: "2.43 km", icon: Route },
    { label: "Nearby helpers", value: "15 km", icon: HeartHandshake },
  ];

  return (
    <motion.div
      className="hero-signal-rail"
      {...enterMotion(shouldReduceMotion, 14, 0.36)}
      aria-label="PawPal product signals"
    >
      {signals.map((signal) => (
        <div key={signal.label} className="hero-signal-item">
          <span className="hero-signal-icon">
            <signal.icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-xs font-black text-paw-ink">{signal.value}</span>
            <span className="block text-[11px] font-semibold text-paw-muted">{signal.label}</span>
          </span>
        </div>
      ))}
    </motion.div>
  );
}

export function HeroBadges() {
  const shouldReduceMotion = useHydratedReducedMotion();
  const badges = [
    {
      icon: ShieldCheck,
      label: "Finder-ready",
      copy: "NFC safety profiles",
      tone: "bg-paw-primary-soft text-paw-primary",
    },
    {
      icon: LockKeyhole,
      label: "Privacy-first",
      copy: "Owner-controlled details",
      tone: "bg-paw-trust-soft text-paw-trust",
    },
    {
      icon: Languages,
      label: "EU-ready",
      copy: "5-language product base",
      tone: "bg-paw-accent-soft text-paw-accent",
    },
  ];

  return (
    <motion.div
      className="grid max-w-2xl gap-3 pt-2 sm:grid-cols-3"
      initial={false}
      animate={{ opacity: 1 }}
      transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.42, duration: 0.5 }}
    >
      {badges.map((badge) => (
        <div
          key={badge.label}
          className="flex min-w-0 items-center gap-3 rounded-paw-md border border-paw-border bg-paw-panel/82 p-3 shadow-[0_10px_24px_rgba(33,55,78,0.08)] backdrop-blur"
        >
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-paw-sm ${badge.tone}`}>
            <badge.icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-paw-ink">{badge.label}</p>
            <p className="truncate text-xs font-semibold text-paw-muted">{badge.copy}</p>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

export function GlobeSection() {
  const shouldReduceMotion = useHydratedReducedMotion();

  return (
    <motion.div
      className="hero-globe-upgrade relative mx-auto flex w-full max-w-[calc(100vw-2.5rem)] items-center justify-center overflow-hidden sm:max-w-[680px]"
      style={{ minHeight: "clamp(320px, 54vw, 560px)" }}
      initial={false}
      animate={{ opacity: 1, x: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.14, duration: 0.7, ease }}
    >
      <div className="hero-globe-orbit-ring" aria-hidden="true" />

      <div className="hero-globe-shell-upgraded pointer-events-auto relative z-10">
        <Globe />
      </div>

      <div className="hero-product-tag" aria-hidden="true">
        <span className="hero-product-tag-mark">
          <ScanLine className="h-5 w-5" />
        </span>
        <span className="mt-1 font-brand text-sm font-black text-paw-primary">PawPal</span>
      </div>
    </motion.div>
  );
}

const proofItems: Array<{ icon: LucideIcon; title: string; copy: string; color: string }> = [
  { icon: Map, title: "Walk map", copy: "See live walks and safe routes around you.", color: "text-paw-primary" },
  { icon: ScanLine, title: "Smart tag", copy: "NFC finder profiles help get your pet home safely.", color: "text-paw-trust" },
  { icon: HeartHandshake, title: "Local help", copy: "Connect with nearby helpers and trusted pet services.", color: "text-paw-accent" },
];

export function TrustMarquee() {
  return (
    <div className="homepage-proof-grid">
      {proofItems.map((item) => (
        <div key={item.title} className="homepage-proof-item">
          <span className={`homepage-proof-icon ${item.color}`}>
            <item.icon className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-paw-ink">{item.title}</h3>
            <p className="mt-1 text-xs leading-5 text-paw-muted">{item.copy}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const readinessItems: Array<{ icon: LucideIcon; value: string; label: string; copy: string }> = [
  {
    icon: ScanLine,
    value: "NFC",
    label: "Instant finder profile",
    copy: "Public pages are designed for quick owner contact without exposing private data by default.",
  },
  {
    icon: Navigation,
    value: "H3",
    label: "Fog-of-war walks",
    copy: "The mobile map turns daily routes into revealed places, route memory, and exploration rewards.",
  },
  {
    icon: Bot,
    value: "AI",
    label: "Care copilot",
    copy: "Breed, behavior, food safety, and local place help stay close to the walk and profile flows.",
  },
  {
    icon: Users,
    value: "EU",
    label: "Local community base",
    copy: "Built from Ghent outward with multilingual support and local pet parent coordination.",
  },
];

export function LaunchReadinessPanel() {
  return (
    <section className="relative overflow-hidden bg-paw-panel-subtle py-12">
      <div className="hero-map-grid absolute inset-0 opacity-[0.12]" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-3 md:grid-cols-4">
          {readinessItems.map((item) => (
            <FadeInView key={item.label}>
              <article className="readiness-card min-h-full">
                <div className="readiness-card-track" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-paw-sm bg-paw-primary-soft text-paw-primary">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-brand text-2xl font-black text-paw-primary">{item.value}</span>
                </div>
                <h2 className="text-base font-extrabold text-paw-ink">{item.label}</h2>
                <p className="mt-2 text-sm leading-6 text-paw-body">{item.copy}</p>
              </article>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
}

function parseStatValue(value: string): { prefix: string; num: number; suffix: string } {
  const match = value.match(/^([^\d]*)([\d.]+)(.*)$/);
  if (!match) return { prefix: "", num: 0, suffix: value };
  return { prefix: match[1], num: Number.parseFloat(match[2]), suffix: match[3] };
}

export function AnimatedCounter({ value, label, delay = 0 }: { value: string; label: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const shouldReduceMotion = useHydratedReducedMotion();
  const { prefix, num, suffix } = parseStatValue(value);
  const [displayNum, setDisplayNum] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!isInView) return;
    if (shouldReduceMotion) {
      queueMicrotask(() => {
        if (!cancelled) setDisplayNum(num);
      });
      return () => {
        cancelled = true;
      };
    }

    const duration = 1300;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayNum(eased * num);
      if (progress >= 1) window.clearInterval(timer);
    }, 16);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isInView, num, shouldReduceMotion]);

  const displayedValue = num % 1 === 0 ? Math.round(displayNum) : displayNum.toFixed(1);

  return (
    <motion.div
      ref={ref}
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={shouldReduceMotion ? { duration: 0 } : { delay, duration: 0.45, ease }}
    >
      <div className="font-brand text-3xl font-black text-paw-primary md:text-4xl">
        {isInView ? `${prefix}${displayedValue}${suffix}` : `${prefix}0${suffix}`}
      </div>
      <p className="mt-1 text-sm font-semibold text-paw-muted">{label}</p>
    </motion.div>
  );
}

const flowSteps: Array<{
  icon: LucideIcon;
  number: string;
  title: string;
  copy: string;
  color: string;
  surface: string;
}> = [
  {
    icon: Footprints,
    number: "01",
    title: "Walk & Explore",
    copy: "Reveal map places, route history, and PawPoints without turning the walk into admin.",
    color: "text-paw-primary",
    surface: "bg-paw-primary-soft",
  },
  {
    icon: ShieldCheck,
    number: "02",
    title: "Protect & Connect",
    copy: "A smart tag gives finders the right profile, while owners control sensitive details.",
    color: "text-paw-trust",
    surface: "bg-paw-trust-soft",
  },
  {
    icon: Users,
    number: "03",
    title: "Community & Care",
    copy: "Local pet parents, alerts, AI advice, and trusted services stay near the map.",
    color: "text-paw-accent",
    surface: "bg-paw-accent-soft",
  },
];

export function ProductFlow() {
  return (
    <div className="homepage-flow">
      {flowSteps.map((step, index) => (
        <FadeInView key={step.title} delay={index * 0.08}>
          <article className="homepage-flow-step">
            <div className="homepage-flow-marker">
              <span className="homepage-flow-number">{index + 1}</span>
              <span className={`homepage-flow-icon ${step.surface} ${step.color}`}>
                <step.icon className="h-5 w-5" />
              </span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-paw-ink">{step.title}</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-paw-body">{step.copy}</p>
            </div>
          </article>
        </FadeInView>
      ))}
    </div>
  );
}

const featureRows: Array<{ icon: LucideIcon; title: string; copy: string; color: string; surface: string }> = [
  {
    icon: Map,
    title: "Fog-of-War Globe",
    copy: "Reveal routes, pet-friendly places, and local context through daily movement.",
    color: "text-paw-primary",
    surface: "bg-paw-primary",
  },
  {
    icon: ScanLine,
    title: "NFC Safety Tag",
    copy: "One tap can open pet ID, care notes, owner contact rules, and lost-mode details.",
    color: "text-paw-trust",
    surface: "bg-paw-trust",
  },
  {
    icon: Bot,
    title: "AI Pet Assistant",
    copy: "Get clearly scoped care guidance for behavior, nutrition, breed traits, and training.",
    color: "text-paw-accent",
    surface: "bg-paw-accent",
  },
  {
    icon: Users,
    title: "Local Community",
    copy: "Find nearby pet parents, missions, groups, trusted services, and practical help.",
    color: "text-paw-primary",
    surface: "bg-paw-primary",
  },
];

const showcaseImages = [
  { src: "/images/mockup-profile.png", alt: "PawPal pet profile screen", title: "Profile" },
  { src: "/images/mockup-nfc.png", alt: "PawPal NFC safety screen", title: "NFC" },
  { src: "/images/mockup-ai.png", alt: "PawPal AI assistant screen", title: "AI" },
  { src: "/images/mockup-community.png", alt: "PawPal community screen", title: "Community" },
];

export function BentoFeatureGrid() {
  const shouldReduceMotion = useHydratedReducedMotion();

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
      <FadeInView>
        <div>
          <h2 className="font-brand text-3xl font-extrabold leading-tight text-paw-ink md:text-5xl">
            The daily pet stack, joined up.
          </h2>
          <div className="mt-8 space-y-6">
            {featureRows.map((feature) => (
              <div key={feature.title} className="grid grid-cols-[48px_1fr] gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-paw-sm ${feature.surface} text-white shadow-sm`}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-paw-ink">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-paw-body">{feature.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeInView>

      <FadeInView delay={0.08}>
        <div className="feature-showcase-stage relative min-h-[430px] overflow-hidden rounded-paw-md border border-paw-border bg-gradient-to-br from-paw-panel-subtle to-paw-panel px-4 pb-8 pt-8 shadow-paw-panel sm:min-h-[540px] sm:px-8">
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-paw-panel to-transparent" />
          <div className="feature-showcase-header" aria-hidden="true">
            <span>Profile</span>
            <span>NFC</span>
            <span>AI</span>
            <span>Community</span>
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-4 sm:flex sm:items-end sm:justify-center sm:gap-5">
            {showcaseImages.map((image, index) => (
              <motion.div
                key={image.src}
                className="phone-screen-card relative aspect-[9/16] overflow-hidden rounded-[1.25rem] border border-paw-border bg-paw-panel shadow-[0_20px_45px_rgba(36,60,84,0.18)] sm:w-[135px] lg:w-[158px]"
                style={{ marginTop: index % 2 === 0 ? 0 : 36 }}
                whileHover={shouldReduceMotion ? undefined : { y: -8 }}
                transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 18 }}
              >
                <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 158px, 45vw" className="object-cover" />
                <span className="absolute left-3 top-3 rounded-paw-sm bg-white/86 px-2 py-1 text-[10px] font-black text-paw-ink shadow-sm backdrop-blur">
                  {image.title}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </FadeInView>
    </div>
  );
}

export function AppShowcase() {
  return (
    <div className="homepage-showcase">
      <FadeInView delay={0.08}>
        <div className="homepage-showcase-visual">
          <div className="homepage-showcase-grid" aria-hidden="true" />
          <div className="homepage-phone-frame">
            <Image
              src="/images/app-mockup.png"
              alt="PawPal main app screen"
              width={1024}
              height={1024}
              sizes="(min-width: 1024px) 250px, 58vw"
              loading="eager"
              className="h-auto w-full"
            />
          </div>
          <div className="homepage-tag-disc" aria-hidden="true">
            <ScanLine className="h-6 w-6" />
            <span>PawPal</span>
          </div>
        </div>
      </FadeInView>

      <FadeInView>
        <div className="homepage-showcase-copy">
          <h2 className="font-brand text-3xl font-extrabold leading-tight text-paw-ink md:text-5xl">
            Everything you need, in one calm place.
          </h2>
          <p className="mt-4 max-w-lg text-base leading-7 text-paw-body md:text-lg md:leading-8">
            The map, finder profile, and local help stay connected without turning the Homepage into a control panel.
          </p>
          <div className="homepage-showcase-list">
            {[
              { icon: Map, title: "Live map", copy: "See walks and safer routes in your area.", color: "text-paw-primary" },
              { icon: ScanLine, title: "Finder profile", copy: "Share what matters, not everything.", color: "text-paw-trust" },
              { icon: HeartHandshake, title: "Local help", copy: "Find nearby helpers and trusted services.", color: "text-paw-accent" },
            ].map((item) => (
              <div key={item.title} className="homepage-showcase-row">
                <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-extrabold text-paw-ink">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-paw-body">{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeInView>
    </div>
  );
}

export function BottomCTA() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link
        href="/globe"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-paw-sm border-b-4 border-paw-primary-contrast bg-paw-primary px-6 text-sm font-bold text-white shadow-paw-action transition hover:bg-paw-primary-hover active:translate-y-1 active:border-b-2 active:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw-primary"
      >
        Start a safe walk
        <Footprints className="h-4 w-4" />
      </Link>
      <Link
        href="/store"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-paw-sm border border-b-4 border-paw-border-strong bg-paw-panel px-6 text-sm font-bold text-paw-ink transition hover:border-paw-primary hover:bg-paw-primary-soft hover:text-paw-primary active:translate-y-0.5 active:border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw-primary"
      >
        Get Smart Tag
        <Store className="h-4 w-4" />
      </Link>
    </div>
  );
}
