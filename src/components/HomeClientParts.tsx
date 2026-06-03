"use client";

import { motion, useInView, useScroll, useSpring } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Globe from "@/components/Globe";
import {
  ArrowRight,
  Bot,
  Download,
  Globe as GlobeIcon,
  Languages,
  LockKeyhole,
  Map,
  MapPin,
  Navigation,
  Radio,
  Route,
  ScanLine,
  ShieldCheck,
  Star,
  Store,
  Users,
  Watch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease }}
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay, duration: 0.58, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return <motion.div className="scroll-progress" style={{ scaleX }} />;
}

export function HeroBlobs() {
  return (
    <div className="home-hero-field absolute inset-0 -z-10" aria-hidden="true">
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}

export function AnimatedHeadline() {
  return (
    <h1 className="hero-headline max-w-3xl font-brand text-[3.1rem] font-extrabold leading-[1.02] tracking-normal text-paw-ink sm:text-6xl lg:text-[4.45rem] xl:text-[4.8rem]">
      <span className="block sm:whitespace-nowrap">Every pet moment,</span>
      <span className="block text-paw-primary">mapped and protected</span>
    </h1>
  );
}

export function HeroDescription() {
  return (
    <motion.p
      className="max-w-xl break-words text-lg leading-8 text-paw-body lg:text-xl lg:leading-9"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.55, ease }}
    >
      PawPal brings gamified walks, fog-of-war maps, NFC safety profiles,
      AI care help, and a trusted local pet community into one calm product
      surface.
    </motion.p>
  );
}

export function HeroCTA() {
  return (
    <motion.div
      className="flex w-full max-w-[calc(100vw-2.5rem)] flex-col gap-3 pt-2 sm:max-w-none sm:flex-row"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28, duration: 0.55, ease }}
    >
      <Link
        href="/globe"
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-paw-sm bg-paw-primary px-6 text-sm font-bold text-white shadow-paw-action transition hover:bg-paw-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw-primary sm:w-auto"
      >
        Explore Globe
        <ArrowRight className="h-4 w-4" />
      </Link>
      <Link
        href="/store"
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-paw-sm border border-paw-border-strong bg-white px-6 text-sm font-bold text-paw-ink transition hover:border-paw-primary hover:text-paw-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw-primary sm:w-auto"
      >
        Shop NFC Tags
        <Store className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}

export function HeroBadges() {
  const petInitials = ["L", "M", "B", "N", "K"];

  return (
    <motion.div
      className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.42, duration: 0.5 }}
    >
      <div className="flex -space-x-2">
        {petInitials.map((initial, index) => (
          <span
            key={initial}
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-black text-white shadow-sm"
            style={{
              backgroundColor: ["#4A90D9", "#76C7B8", "#F28C44", "#FFCD38", "#3A2F2A"][index],
            }}
          >
            {initial}
          </span>
        ))}
      </div>
      <div>
        <div className="mb-1 flex gap-0.5 text-paw-yellow" aria-label="Five star rating">
          {[...Array(5)].map((_, index) => (
            <Star key={index} className="h-4 w-4 fill-current" />
          ))}
        </div>
        <p className="text-sm font-medium text-paw-muted">
          Trusted by pet parents across Belgium and the EU
        </p>
      </div>
    </motion.div>
  );
}

export function GlobeSection() {
  return (
    <motion.div
      className="hero-globe-upgrade relative mx-auto flex min-h-[500px] w-full max-w-[calc(100vw-2.5rem)] items-center justify-center overflow-visible sm:max-w-[650px] lg:min-h-[610px]"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.14, duration: 0.7, ease }}
    >
      <div className="hero-globe-orbit-ring" aria-hidden="true" />

      <div className="hero-globe-shell-upgraded pointer-events-auto relative z-10">
        <Globe />
      </div>

      <div className="hero-globe-card hero-globe-card-live left-0 top-14">
        <span className="flex h-10 w-10 items-center justify-center rounded-paw-sm bg-paw-primary text-white">
          <GlobeIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-paw-muted">Live Globe</p>
          <p className="mt-0.5 text-sm font-extrabold text-paw-ink">Fog map active</p>
        </div>
      </div>

      <div className="hero-globe-card hero-globe-card-place right-0 top-28 hidden sm:flex">
        <span className="flex h-10 w-10 items-center justify-center rounded-paw-sm bg-paw-trust-soft text-paw-trust">
          <MapPin className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-paw-muted">Ghent Pilot</p>
          <p className="mt-0.5 text-sm font-extrabold text-paw-ink">EU-ready pet map</p>
        </div>
      </div>

      <div className="hero-globe-card hero-globe-card-route bottom-16 left-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-paw-sm bg-paw-accent-soft text-paw-accent">
          <Route className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-paw-muted">Today&apos;s route</p>
          <p className="mt-0.5 text-sm font-extrabold text-paw-ink">2.43 km revealed</p>
        </div>
      </div>

      <div className="hero-globe-card hero-globe-card-safety bottom-8 right-3 hidden sm:flex">
        <span className="flex h-10 w-10 items-center justify-center rounded-paw-sm bg-paw-primary-soft text-paw-primary">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-paw-muted">NFC Safety</p>
          <p className="mt-0.5 text-sm font-extrabold text-paw-ink">Finder-ready profile</p>
        </div>
      </div>

      <motion.div
        className="hero-globe-hint-upgraded"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0.65, 1] }}
        transition={{ delay: 1.2, duration: 3.2, repeat: Infinity, repeatDelay: 4 }}
      >
        Drag to spin
      </motion.div>
    </motion.div>
  );
}

const proofItems: Array<{ icon: LucideIcon; title: string; copy: string; color: string }> = [
  { icon: ShieldCheck, title: "NFC Safety", copy: "Instant ID access anytime", color: "text-paw-primary" },
  { icon: LockKeyhole, title: "Privacy First", copy: "Owner details stay controlled", color: "text-paw-ink" },
  { icon: Languages, title: "EU Ready", copy: "Built for multilingual owners", color: "text-paw-primary" },
  { icon: Users, title: "Local Network", copy: "Community help around the map", color: "text-paw-accent" },
  { icon: Star, title: "4.9 / 5", copy: "Early app experience target", color: "text-paw-ink" },
];

export function TrustMarquee() {
  return (
    <div className="grid gap-px bg-paw-border sm:grid-cols-2 lg:grid-cols-5">
      {proofItems.map((item) => (
        <div key={item.title} className="flex min-h-28 items-center gap-4 bg-white px-5 py-5">
          <item.icon className={`h-8 w-8 shrink-0 ${item.color}`} />
          <div>
            <h3 className="text-sm font-extrabold text-paw-ink">{item.title}</h3>
            <p className="mt-1 text-xs leading-5 text-paw-muted">{item.copy}</p>
          </div>
        </div>
      ))}
    </div>
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
  const { prefix, num, suffix } = parseStatValue(value);
  const [displayNum, setDisplayNum] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const duration = 1300;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayNum(eased * num);
      if (progress >= 1) window.clearInterval(timer);
    }, 16);

    return () => window.clearInterval(timer);
  }, [isInView, num]);

  const displayedValue = num % 1 === 0 ? Math.round(displayNum) : displayNum.toFixed(1);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.45, ease }}
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
    icon: Navigation,
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
    <div className="grid gap-8 lg:grid-cols-3">
      {flowSteps.map((step, index) => (
        <FadeInView key={step.title} delay={index * 0.08}>
          <article className="workflow-step relative h-full border-t border-paw-border pt-8">
            <div className="mb-6 flex items-center gap-5">
              <span className={`font-brand text-5xl font-light ${step.color}`}>{step.number}</span>
              <span className={`flex h-16 w-16 items-center justify-center rounded-full ${step.surface} ${step.color}`}>
                <step.icon className="h-7 w-7" />
              </span>
            </div>
            <h3 className="mb-3 text-xl font-extrabold text-paw-ink">{step.title}</h3>
            <p className="max-w-sm text-sm leading-7 text-paw-body">{step.copy}</p>
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
    copy: "Reveal streets, parks, trails, and new local places through daily movement.",
    color: "text-paw-primary",
    surface: "bg-paw-primary",
  },
  {
    icon: ScanLine,
    title: "NFC Safety Tag",
    copy: "One tap for instant ID, owner contact, care notes, and lost-mode details.",
    color: "text-paw-trust",
    surface: "bg-paw-trust",
  },
  {
    icon: Bot,
    title: "AI Pet Assistant",
    copy: "Get care guidance for health, behavior, nutrition, breed traits, and training.",
    color: "text-paw-accent",
    surface: "bg-paw-accent",
  },
  {
    icon: Users,
    title: "Local Community",
    copy: "Find nearby pet parents, events, groups, trusted services, and urgent help.",
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
  return (
    <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
      <FadeInView>
        <div>
          <h2 className="font-brand text-3xl font-extrabold leading-tight text-paw-ink md:text-5xl">
            Everything you need, in one place.
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
        <div className="relative min-h-[430px] overflow-hidden rounded-paw-md border border-paw-border bg-gradient-to-br from-paw-panel-subtle to-white px-4 pb-8 pt-8 shadow-paw-panel sm:min-h-[540px] sm:px-8">
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
          <div className="grid grid-cols-2 gap-4 sm:flex sm:items-end sm:justify-center sm:gap-5">
            {showcaseImages.map((image, index) => (
              <motion.div
                key={image.src}
                className="relative aspect-[9/16] overflow-hidden rounded-[1.25rem] border border-white bg-white shadow-[0_20px_45px_rgba(36,60,84,0.18)] sm:w-[135px] lg:w-[158px]"
                style={{ marginTop: index % 2 === 0 ? 0 : 36 }}
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 180, damping: 18 }}
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

const ecosystemItems: Array<{ icon: LucideIcon; title: string; copy: string }> = [
  { icon: Download, title: "iOS & Android", copy: "Mobile app" },
  { icon: Radio, title: "NFC Tag", copy: "Tap to connect" },
  { icon: Watch, title: "Real-time Sync", copy: "Across devices" },
  { icon: LockKeyhole, title: "Secure & Private", copy: "By design" },
];

export function AppShowcase() {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
      <FadeInView>
        <div>
          <h2 className="font-brand text-3xl font-extrabold leading-tight text-paw-ink md:text-5xl">
            Your pet life, seamlessly connected.
          </h2>
          <p className="mt-4 max-w-lg text-lg leading-8 text-paw-body">
            PawPal works across the website, mobile app, NFC tag, and future
            wearable moments so the product feels continuous.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-2">
            {ecosystemItems.map((item) => (
              <div key={item.title}>
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-paw-primary-soft text-paw-primary">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="text-sm font-extrabold text-paw-ink">{item.title}</h3>
                <p className="mt-1 text-xs font-medium text-paw-muted">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeInView>

      <FadeInView delay={0.08}>
        <div className="relative min-h-[420px] overflow-hidden rounded-paw-md border border-paw-border bg-white shadow-paw-panel">
          <div className="hero-map-grid absolute inset-0 opacity-80" />
          <div className="absolute left-8 top-8 w-[210px] sm:left-16 sm:w-[260px]">
            <Image
              src="/images/app-mockup.png"
              alt="PawPal main app screen"
              width={1024}
              height={1024}
              sizes="(min-width: 1024px) 260px, 55vw"
              className="h-auto w-full drop-shadow-[0_24px_44px_rgba(31,52,74,0.22)]"
            />
          </div>
          <div className="absolute bottom-16 right-28 hidden h-36 w-28 rounded-[2rem] bg-[#20262d] p-3 text-white shadow-[0_22px_38px_rgba(18,24,31,0.28)] sm:block">
            <div className="text-[10px] font-bold text-white/55">PawPal</div>
            <div className="mt-8 text-2xl font-black">2.43</div>
            <div className="text-xs text-white/50">km this walk</div>
            <div className="mt-4 h-1 rounded-full bg-white/15">
              <div className="h-full w-[62%] rounded-full bg-paw-trust" />
            </div>
          </div>
          <div className="hero-nfc-tag absolute bottom-12 right-8 flex h-28 w-28 flex-col items-center justify-center rounded-full bg-[#232629] text-white shadow-[0_22px_38px_rgba(18,24,31,0.26)]">
            <span className="text-lg font-black text-white/75">PawPal</span>
            <Radio className="mt-1 h-5 w-5 text-white/45" />
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
        className="inline-flex h-12 items-center justify-center gap-2 rounded-paw-sm bg-paw-primary px-6 text-sm font-bold text-white shadow-paw-action transition hover:bg-paw-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw-primary"
      >
        Explore Globe
        <ArrowRight className="h-4 w-4" />
      </Link>
      <Link
        href="/store"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-paw-sm border border-paw-border-strong bg-white px-6 text-sm font-bold text-paw-ink transition hover:border-paw-primary hover:text-paw-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw-primary"
      >
        Shop NFC Tags
        <Store className="h-4 w-4" />
      </Link>
    </div>
  );
}
