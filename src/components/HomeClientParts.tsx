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
      initial={false}
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
      <span className="block text-paw-primary">PetCompass for every walk</span>
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
      Built from Belgium outward, PetCompass brings your pet profile, the live map context,
      and smart-tag recovery handoff into one calm PawPal app.
    </motion.p>
  );
}

export function HeroMobileProof() {
  const shouldReduceMotion = useHydratedReducedMotion();
  const proofs = [
    {
      title: "App proof",
      label: "Profile + map",
      src: "/images/app-mockup.png",
      alt: "PawPal app interface preview",
    },
    {
      title: "Tag proof",
      label: "Smart Tag",
      src: "/assets/store-products/current/smart-tag/hero.webp",
      alt: "PawPal smart tag product",
    },
  ];

  return (
    <motion.div
      className="grid gap-2 sm:hidden"
      {...enterMotion(shouldReduceMotion, 12, 0.22)}
      aria-label="PawPal app and smart tag proof"
    >
      <div className="grid grid-cols-2 gap-2">
        {proofs.map((proof) => (
          <div
            key={proof.title}
            className="grid min-h-[5.6rem] grid-cols-[4rem_minmax(0,1fr)] items-center gap-2 rounded-paw-sm border border-paw-border bg-paw-panel/90 p-2 shadow-sm"
          >
            <span className="relative block h-16 overflow-hidden rounded-paw-sm bg-paw-panel-subtle">
              <Image
                src={proof.src}
                alt={proof.alt}
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            </span>
            <span className="min-w-0 text-xs leading-4">
              <span className="block font-extrabold text-paw-ink">{proof.title}</span>
              <span className="block font-semibold text-paw-muted">{proof.label}</span>
            </span>
          </div>
        ))}
      </div>
    </motion.div>
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
        Open Live Map
        <Footprints className="h-4 w-4" />
      </Link>
      <Link
        href="/store"
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-paw-sm border border-b-4 border-paw-border-strong bg-paw-panel px-6 text-sm font-bold text-paw-ink transition hover:border-paw-primary hover:bg-paw-primary-soft hover:text-paw-primary active:translate-y-0.5 active:border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw-primary sm:w-auto"
      >
        Shop Smart Tags
        <Store className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}

export function HeroSignalRail() {
  const shouldReduceMotion = useHydratedReducedMotion();
  const signals = [
    { label: "Pet identity", value: "Profile", icon: ShieldCheck },
    { label: "Live context", value: "Map + walk", icon: Route },
    { label: "Trusted action", value: "Tag + help", icon: HeartHandshake },
  ];

  return (
    <div className="hidden sm:block">
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
    </div>
  );
}

export function HeroNextHint() {
  const shouldReduceMotion = useHydratedReducedMotion();

  return (
    <motion.div
      className="inline-flex max-w-full items-center gap-2 rounded-paw-sm border border-paw-border bg-paw-panel/82 px-3 py-2 text-xs font-extrabold text-paw-muted shadow-sm backdrop-blur"
      {...enterMotion(shouldReduceMotion, 10, 0.44)}
      aria-label="Next section previews the PetCompass product loop"
    >
      <Route className="h-4 w-4 shrink-0 text-paw-primary" aria-hidden="true" />
      <span className="min-w-0">Next: pet identity -&gt; live context -&gt; trusted action</span>
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
      style={{ minHeight: "clamp(340px, 54vw, 580px)" }}
      initial={false}
      animate={{ opacity: 1, x: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.14, duration: 0.7, ease }}
      aria-label="PawPal PetCompass product proof with app, map, and smart tag"
    >
      <div className="hero-globe-orbit-ring" aria-hidden="true" />

      <div className="hero-globe-shell-upgraded pointer-events-auto relative z-10">
        <Globe />
      </div>

      <div className="pointer-events-none absolute left-0 top-6 z-30 w-[7.2rem] sm:left-4 sm:top-12 sm:w-[8.8rem] md:w-[9.8rem]">
        <div className="overflow-hidden rounded-paw-md border border-paw-border bg-paw-panel/92 p-1 shadow-paw-panel backdrop-blur">
          <Image
            src="/images/app-mockup.png"
            alt="PawPal app interface preview"
            width={1024}
            height={1024}
            sizes="(min-width: 768px) 156px, 116px"
            className="h-auto w-full rounded-paw-sm"
          />
        </div>
        <div className="mt-2 rounded-paw-sm border border-paw-border bg-paw-panel/88 px-2 py-1 text-[11px] font-extrabold leading-4 text-paw-ink shadow-sm backdrop-blur">
          PawPal app
          <span className="block font-semibold text-paw-muted">Profile + map</span>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 right-0 z-30 w-[9.4rem] sm:bottom-7 sm:right-4 sm:w-[11.5rem] md:w-[12.5rem]">
        <div className="overflow-hidden rounded-paw-md border border-paw-border bg-paw-panel/94 p-2 shadow-paw-panel backdrop-blur">
          <Image
            src="/assets/store-products/current/smart-tag/hero.webp"
            alt="PawPal smart tag product"
            width={520}
            height={360}
            sizes="(min-width: 768px) 200px, 150px"
            className="h-auto w-full rounded-paw-sm object-contain"
          />
        </div>
        <div className="mt-2 rounded-paw-sm border border-paw-border bg-paw-panel/88 px-2 py-1 text-[11px] font-extrabold leading-4 text-paw-ink shadow-sm backdrop-blur">
          Smart Tag
          <span className="block font-semibold text-paw-muted">NFC public profile</span>
        </div>
      </div>

      <div className="hero-product-tag" aria-hidden="true">
        <span className="hero-product-tag-mark">
          <ScanLine className="h-5 w-5" />
        </span>
        <span className="mt-1 text-center font-brand text-[0.68rem] font-black leading-tight text-paw-primary sm:text-sm">PetCompass</span>
      </div>
    </motion.div>
  );
}

const proofItems: Array<{ icon: LucideIcon; title: string; copy: string; color: string }> = [
  { icon: ShieldCheck, title: "Pet identity first", copy: "A public profile and tag context explain who needs help.", color: "text-paw-primary" },
  { icon: Map, title: "Live context next", copy: "The map keeps walk, place, and recovery context close.", color: "text-paw-trust" },
  { icon: Store, title: "Action stays clear", copy: "Open the app map or shop the smart tag from the same proof flow.", color: "text-paw-accent" },
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
    icon: ShieldCheck,
    number: "01",
    title: "Pet identity",
    copy: "Start with the pet profile, public recovery details, and the smart-tag relationship that belongs to that pet.",
    color: "text-paw-primary",
    surface: "bg-paw-primary-soft",
  },
  {
    icon: Map,
    number: "02",
    title: "Live context",
    copy: "Bring the map, walk route, and nearby place context forward so the next step is grounded in where the pet is.",
    color: "text-paw-trust",
    surface: "bg-paw-trust-soft",
  },
  {
    icon: HeartHandshake,
    number: "03",
    title: "Trusted action",
    copy: "Open the live map, move into finder-safe profile help, or shop the tag without losing the PawPal flow.",
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
            App, map, and tag proof in one calm place.
          </h2>
          <p className="mt-4 max-w-lg text-base leading-7 text-paw-body md:text-lg md:leading-8">
            The website now mirrors the product rhythm: identify the pet, understand the context, then choose a trusted action.
          </p>
          <div className="homepage-showcase-list">
            {[
              { icon: ShieldCheck, title: "Pet profile", copy: "Keep identity, public profile, and privacy context together.", color: "text-paw-primary" },
              { icon: Map, title: "Map context", copy: "Use the globe and walk surfaces as spatial product proof.", color: "text-paw-trust" },
              { icon: ScanLine, title: "Smart tag", copy: "Send shoppers toward the real tag path and finder-safe profile value.", color: "text-paw-accent" },
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
        Open Live Map
        <Footprints className="h-4 w-4" />
      </Link>
      <Link
        href="/store"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-paw-sm border border-b-4 border-paw-border-strong bg-paw-panel px-6 text-sm font-bold text-paw-ink transition hover:border-paw-primary hover:bg-paw-primary-soft hover:text-paw-primary active:translate-y-0.5 active:border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw-primary"
      >
        Shop Smart Tags
        <Store className="h-4 w-4" />
      </Link>
    </div>
  );
}
