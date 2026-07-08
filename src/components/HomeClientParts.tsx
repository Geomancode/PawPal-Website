"use client";

import { motion, useInView, useScroll, useSpring } from "framer-motion";
import Globe from "@/components/Globe";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
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
import { Card, CardContent, buttonClassName } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";

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
  const { t } = useI18n();

  return (
    <h1
      aria-label={t("homeHeroAriaLabel")}
      className="homepage-hero-headline max-w-3xl font-brand text-[3.15rem] font-extrabold leading-[1.02] tracking-normal text-paw-ink sm:text-6xl lg:text-[4.45rem] xl:text-[4.65rem]"
    >
      <span className="block sm:whitespace-nowrap">{t("homeHeroLineOne")}</span>
      {" "}
      <span className="block text-paw-primary">{t("homeHeroLineTwo")}</span>
    </h1>
  );
}

export function HeroDescription() {
  const { t } = useI18n();
  const shouldReduceMotion = useHydratedReducedMotion();

  return (
    <motion.p
      className="max-w-xl break-words text-base leading-7 text-paw-body sm:text-lg sm:leading-8"
      {...enterMotion(shouldReduceMotion, 18, 0.18)}
    >
      {t("homeHeroDescription")}
    </motion.p>
  );
}

export function HeroCTA() {
  const { path, t } = useI18n();
  const shouldReduceMotion = useHydratedReducedMotion();

  return (
    <motion.div
      className="flex w-full max-w-[calc(100vw-2.5rem)] flex-col gap-3 pt-2 sm:max-w-none sm:flex-row"
      {...enterMotion(shouldReduceMotion, 14, 0.28)}
    >
      <Link
        href={path("/globe")}
        className={buttonClassName({ size: "lg", className: "w-full sm:w-auto" })}
      >
        {t("homeCtaOpenLiveMap")}
        <ArrowRight className="h-4 w-4" />
      </Link>
      <Link
        href={path("/store")}
        className={buttonClassName({
          variant: "secondary",
          size: "lg",
          className: "w-full sm:w-auto",
        })}
      >
        {t("homeCtaShopSmartTags")}
        <Store className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}

export function HeroSignalRail() {
  const { t } = useI18n();
  const shouldReduceMotion = useHydratedReducedMotion();
  const signals = [
    { label: t("homeSignalFinderPageLabel"), value: t("homeSignalFinderPageValue"), icon: ScanLine },
    { label: t("homeSignalWalkRevealLabel"), value: t("homeSignalWalkRevealValue"), icon: Route },
    { label: t("homeSignalLocalHelpLabel"), value: t("homeSignalLocalHelpValue"), icon: HeartHandshake },
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
  const { t } = useI18n();
  const shouldReduceMotion = useHydratedReducedMotion();
  const badges = [
    {
      icon: ShieldCheck,
      label: t("homeBadgeFinderReadyLabel"),
      copy: t("homeBadgeFinderReadyCopy"),
      tone: "bg-paw-primary-soft text-paw-on-primary-soft",
    },
    {
      icon: LockKeyhole,
      label: t("homeBadgePrivacyFirstLabel"),
      copy: t("homeBadgePrivacyFirstCopy"),
      tone: "bg-paw-trust-soft text-paw-on-trust-soft",
    },
    {
      icon: Languages,
      label: t("homeBadgeEuReadyLabel"),
      copy: t("homeBadgeEuReadyCopy"),
      tone: "bg-paw-accent-soft text-paw-on-accent-soft",
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
          className="flex min-w-0 items-center gap-3 rounded-paw-card border border-paw-outline-variant bg-paw-panel-low p-paw-sm shadow-paw-panel"
        >
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-paw-control ${badge.tone}`}>
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

export function TrustMarquee() {
  const { t } = useI18n();
  const proofItems: Array<{ icon: LucideIcon; title: string; copy: string; tone: string }> = [
    {
      icon: Map,
      title: t("homeProofWalkMapTitle"),
      copy: t("homeProofWalkMapCopy"),
      tone: "bg-paw-primary-soft text-paw-on-primary-soft",
    },
    {
      icon: ScanLine,
      title: t("homeProofSmartTagTitle"),
      copy: t("homeProofSmartTagCopy"),
      tone: "bg-paw-trust-soft text-paw-on-trust-soft",
    },
    {
      icon: HeartHandshake,
      title: t("homeProofLocalHelpTitle"),
      copy: t("homeProofLocalHelpCopy"),
      tone: "bg-paw-accent-soft text-paw-on-accent-soft",
    },
  ];

  return (
    <div className="grid gap-paw-sm px-paw-md py-paw-lg sm:grid-cols-3 sm:px-paw-lg">
      {proofItems.map((item) => (
        <Card
          key={item.title}
          className="flex min-h-full items-center gap-paw-md p-paw-lg shadow-paw-panel"
        >
          <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-paw-pill ${item.tone}`}>
            <item.icon className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-paw-ink">{item.title}</h3>
            <p className="mt-1 text-xs leading-5 text-paw-muted">{item.copy}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function LaunchReadinessPanel() {
  const { t } = useI18n();
  const readinessItems: Array<{ icon: LucideIcon; value: string; label: string; copy: string }> = [
    {
      icon: ScanLine,
      value: t("homeReadinessNfcValue"),
      label: t("homeReadinessNfcLabel"),
      copy: t("homeReadinessNfcCopy"),
    },
    {
      icon: Navigation,
      value: t("homeReadinessH3Value"),
      label: t("homeReadinessH3Label"),
      copy: t("homeReadinessH3Copy"),
    },
    {
      icon: Bot,
      value: t("homeReadinessAiValue"),
      label: t("homeReadinessAiLabel"),
      copy: t("homeReadinessAiCopy"),
    },
    {
      icon: Users,
      value: t("homeReadinessEuValue"),
      label: t("homeReadinessEuLabel"),
      copy: t("homeReadinessEuCopy"),
    },
  ];

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
                  <span className="flex h-11 w-11 items-center justify-center rounded-paw-sm bg-paw-primary-soft text-paw-on-primary-soft">
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

export function ProductFlow() {
  const { t } = useI18n();
  const flowSteps: Array<{
    icon: LucideIcon;
    title: string;
    copy: string;
    color: string;
    surface: string;
  }> = [
    {
      icon: Footprints,
      title: t("homeFlowWalkTitle"),
      copy: t("homeFlowWalkCopy"),
      color: "text-paw-primary",
      surface: "bg-paw-primary-soft",
    },
    {
      icon: ShieldCheck,
      title: t("homeFlowProtectTitle"),
      copy: t("homeFlowProtectCopy"),
      color: "text-paw-trust",
      surface: "bg-paw-trust-soft",
    },
    {
      icon: Users,
      title: t("homeFlowCommunityTitle"),
      copy: t("homeFlowCommunityCopy"),
      color: "text-paw-accent",
      surface: "bg-paw-accent-soft",
    },
  ];

  return (
    <div className="grid gap-paw-md md:grid-cols-3">
      {flowSteps.map((step, index) => (
        <FadeInView key={step.title} delay={index * 0.08}>
          <Card className="h-full shadow-paw-panel">
            <CardContent className="grid h-full grid-cols-[auto_minmax(0,1fr)] items-start gap-paw-md">
              <div className="grid justify-items-center gap-paw-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-paw-pill bg-paw-primary-soft text-sm font-black text-paw-on-primary-soft">
                {index + 1}
              </span>
              <span className={`flex h-14 w-14 items-center justify-center rounded-paw-pill ${step.surface} ${step.color}`}>
                <step.icon className="h-5 w-5" />
              </span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-paw-ink">{step.title}</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-paw-body">{step.copy}</p>
            </div>
            </CardContent>
          </Card>
        </FadeInView>
      ))}
    </div>
  );
}

export function BentoFeatureGrid() {
  const { t } = useI18n();
  const shouldReduceMotion = useHydratedReducedMotion();
  const featureRows: Array<{ icon: LucideIcon; title: string; copy: string; color: string; surface: string }> = [
    {
      icon: Map,
      title: t("homeFeatureFogTitle"),
      copy: t("homeFeatureFogCopy"),
      color: "text-paw-primary",
      surface: "bg-paw-primary",
    },
    {
      icon: ScanLine,
      title: t("homeFeatureNfcTitle"),
      copy: t("homeFeatureNfcCopy"),
      color: "text-paw-trust",
      surface: "bg-paw-trust",
    },
    {
      icon: Bot,
      title: t("homeFeatureAiTitle"),
      copy: t("homeFeatureAiCopy"),
      color: "text-paw-accent",
      surface: "bg-paw-accent",
    },
    {
      icon: Users,
      title: t("homeFeatureCommunityTitle"),
      copy: t("homeFeatureCommunityCopy"),
      color: "text-paw-primary",
      surface: "bg-paw-primary",
    },
  ];
  const showcaseImages = [
    { src: "/images/mockup-profile.png", alt: t("homeShowcaseProfileAlt"), title: t("homeShowcaseProfileTitle") },
    { src: "/images/mockup-nfc.png", alt: t("homeShowcaseNfcAlt"), title: t("homeShowcaseNfcTitle") },
    { src: "/images/mockup-ai.png", alt: t("homeShowcaseAiAlt"), title: t("homeShowcaseAiTitle") },
    { src: "/images/mockup-community.png", alt: t("homeShowcaseCommunityAlt"), title: t("homeShowcaseCommunityTitle") },
  ];

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
      <FadeInView>
        <div>
          <h2 className="font-brand text-3xl font-extrabold leading-tight text-paw-ink md:text-5xl">
            {t("homeBentoTitle")}
          </h2>
          <div className="mt-8 space-y-6">
            {featureRows.map((feature) => (
              <div key={feature.title} className="grid grid-cols-[48px_1fr] gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-paw-control ${feature.surface} text-paw-on-primary shadow-paw-control`}>
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
            <span>{t("homeShowcaseProfileTitle")}</span>
            <span>{t("homeShowcaseNfcTitle")}</span>
            <span>{t("homeShowcaseAiTitle")}</span>
            <span>{t("homeShowcaseCommunityTitle")}</span>
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-4 sm:flex sm:items-end sm:justify-center sm:gap-5">
            {showcaseImages.map((image, index) => (
              <motion.div
                key={image.src}
                className="phone-screen-card relative aspect-[9/16] overflow-hidden rounded-paw-sheet border border-paw-outline-variant bg-paw-panel-low shadow-paw-strong sm:w-[135px] lg:w-[158px]"
                style={{ marginTop: index % 2 === 0 ? 0 : 36 }}
                whileHover={shouldReduceMotion ? undefined : { y: -8 }}
                transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 18 }}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1024px) 158px, 45vw"
                  loading="lazy"
                  className="object-cover"
                />
                <span className="absolute left-3 top-3 rounded-paw-control bg-paw-panel-low px-2 py-1 text-[10px] font-black text-paw-ink shadow-paw-control">
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
  const { t } = useI18n();
  const showcaseItems = [
    { icon: Map, title: t("homeShowcaseLiveMapTitle"), copy: t("homeShowcaseLiveMapCopy"), color: "text-paw-primary" },
    { icon: ScanLine, title: t("homeShowcaseFinderTitle"), copy: t("homeShowcaseFinderCopy"), color: "text-paw-trust" },
    { icon: HeartHandshake, title: t("homeShowcaseLocalHelpTitle"), copy: t("homeShowcaseLocalHelpCopy"), color: "text-paw-accent" },
  ];

  return (
    <div className="homepage-showcase">
      <FadeInView delay={0.08}>
        <div className="homepage-showcase-visual">
          <div className="homepage-showcase-grid" aria-hidden="true" />
          <div className="homepage-phone-frame">
            <Image
              src="/images/app-mockup.png"
              alt={t("homeAppMockupAlt")}
              width={1024}
              height={1024}
              sizes="(min-width: 1024px) 250px, 58vw"
              priority
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
            {t("homeShowcaseTitle")}
          </h2>
          <p className="mt-4 max-w-lg text-base leading-7 text-paw-body md:text-lg md:leading-8">
            {t("homeShowcaseCopy")}
          </p>
          <div className="homepage-showcase-list">
            {showcaseItems.map((item) => (
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
  const { path, t } = useI18n();

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link
        href={path("/globe")}
        className={buttonClassName({ size: "lg" })}
      >
        {t("homeCtaOpenLiveMap")}
        <ArrowRight className="h-4 w-4" />
      </Link>
      <Link
        href={path("/store")}
        className={buttonClassName({ variant: "secondary", size: "lg" })}
      >
        {t("homeCtaShopSmartTags")}
        <Store className="h-4 w-4" />
      </Link>
    </div>
  );
}
