"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import PawIcon, { type PawIconName } from "@/components/icons/PawIcon";
import {
  Badge,
  Card,
  CardContent,
  PageShell,
  buttonClassName,
} from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";
import { siteConfig } from "@/lib/site";
import { useReducedMotionPreference } from "@/lib/useReducedMotionPreference";

/* ── Animation helpers ── */
const fadeUp = (shouldReduceMotion: boolean, delay = 0) => ({
  initial: { opacity: 1, y: 0 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: shouldReduceMotion
    ? { duration: 0, delay: 0 }
    : { duration: 0.6, delay },
});

/* ── Real Team Data ── */
const TEAM = [
  {
    name: "Alexie",
    roleKey: "aboutTeamAlexieRole",
    descKey: "aboutTeamAlexieDescription",
  },
  {
    name: "Neumann",
    roleKey: "aboutTeamNeumannRole",
    descKey: "aboutTeamNeumannDescription",
  },
  {
    name: "Carlo",
    roleKey: "aboutTeamCarloRole",
    descKey: "aboutTeamCarloDescription",
  },
] as const;

/* ── Product Ecosystem ── */
const ECOSYSTEM = [
  {
    icon: "appLink",
    titleKey: "aboutEcosystemAppTitle",
    descKey: "aboutEcosystemAppDescription",
    tone: "bg-paw-primary-soft text-paw-on-primary-soft",
  },
  {
    icon: "world",
    titleKey: "aboutEcosystemWebTitle",
    descKey: "aboutEcosystemWebDescription",
    tone: "bg-paw-trust-soft text-paw-on-trust-soft",
  },
  {
    icon: "nfc",
    titleKey: "aboutEcosystemTagsTitle",
    descKey: "aboutEcosystemTagsDescription",
    tone: "bg-paw-green-soft text-paw-on-green-soft",
  },
] as const;

/* ── Values ── */
const VALUES = [
  { icon: "heart", titleKey: "aboutValueEnhanceTitle", descKey: "aboutValueEnhanceDescription" },
  { icon: "safety", titleKey: "aboutValuePrivacyTitle", descKey: "aboutValuePrivacyDescription" },
  { icon: "community", titleKey: "aboutValueCommunityTitle", descKey: "aboutValueCommunityDescription" },
  { icon: "sparkle", titleKey: "aboutValueAiCareTitle", descKey: "aboutValueAiCareDescription" },
  { icon: "location", titleKey: "aboutValueBelgiumTitle", descKey: "aboutValueBelgiumDescription" },
  { icon: "map", titleKey: "aboutValueExplorationTitle", descKey: "aboutValueExplorationDescription" },
] as const;

/* ── Real Timeline ── */
const TIMELINE = [
  { year: "2024", eventKey: "aboutTimeline2024" },
  { year: "2025 Q1", eventKey: "aboutTimeline2025Q1" },
  { year: "2025 Q2", eventKey: "aboutTimeline2025Q2" },
  { year: "2025 H2", eventKey: "aboutTimeline2025H2" },
  { year: "2026", eventKey: "aboutTimeline2026" },
] as const;

const TEAM_STRENGTHS: ReadonlyArray<{ icon: PawIconName; textKey: "aboutStrengthGis" | "aboutStrengthMigrations" | "aboutStrengthLocales" | "aboutStrengthGhent" }> = [
  { icon: "education", textKey: "aboutStrengthGis" },
  { icon: "energy", textKey: "aboutStrengthMigrations" },
  { icon: "language", textKey: "aboutStrengthLocales" },
  { icon: "location", textKey: "aboutStrengthGhent" },
];

export default function About() {
  const { loader, t } = useRouteTranslations();
  const { path } = useI18n();
  const shouldReduceMotion = useReducedMotionPreference();

  return (
    <PageShell className="pt-28 sm:pt-32" contentClassName="space-y-paw-xxxl">
      {loader}
      {/* ===== HERO ===== */}
      <section className="grid gap-paw-xl lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)] lg:items-stretch">
        <div className="about-hero-copy">
          <motion.div {...fadeUp(shouldReduceMotion)}>
            <Badge tone="primary" className="mb-paw-lg">
              <PawIcon name="paw" className="h-4 w-4" aria-hidden="true" />
              {t("aboutBadge")}
            </Badge>
          </motion.div>

          <motion.h1
            {...fadeUp(shouldReduceMotion, 0.1)}
            className="max-w-3xl font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display"
          >
            {t("aboutHeroTitle")}
          </motion.h1>

          <motion.p
            {...fadeUp(shouldReduceMotion, 0.2)}
            className="mt-paw-md max-w-2xl text-paw-type-body text-paw-body sm:text-paw-type-body"
          >
            {t("aboutHeroCopy")}
          </motion.p>

          <motion.div {...fadeUp(shouldReduceMotion, 0.3)} className="mt-paw-xl flex flex-wrap gap-paw-sm">
            <Link href={path("/globe")} className={buttonClassName({ size: "lg" })}>
              {t("aboutExploreGlobe")}
              <PawIcon name="forward" className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href={path("/store")}
              className={buttonClassName({ variant: "secondary", size: "lg" })}
            >
              {t("aboutShopSmartTags")}
            </Link>
          </motion.div>
        </div>

        <motion.aside {...fadeUp(shouldReduceMotion, 0.18)}>
          <div className="about-system-panel relative overflow-hidden">
            <div className="hero-map-grid pointer-events-none absolute inset-0 opacity-35" />
            <div className="relative z-10">
              <p className="text-paw-type-caption font-black uppercase text-paw-muted">
                {t("aboutProductSystemEyebrow")}
              </p>
              <h2 className="mt-paw-xs text-paw-type-h2 font-black text-paw-ink">
                {t("aboutProductSystemTitle")}
              </h2>
              <div className="mt-paw-lg space-y-paw-sm">
                {[
                  { icon: "appLink" as const, label: t("aboutSystemDailyLabel"), copy: t("aboutSystemDailyCopy") },
                  { icon: "nfc" as const, label: t("aboutSystemPhysicalLabel"), copy: t("aboutSystemPhysicalCopy") },
                  { icon: "world" as const, label: t("aboutSystemLocalLabel"), copy: t("aboutSystemLocalCopy") },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="about-system-row"
                  >
                    <span className="about-system-icon">
                      <PawIcon name={item.icon} className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-paw-type-body font-extrabold text-paw-ink">{item.label}</p>
                      <p className="mt-paw-xxs text-paw-type-caption leading-5 text-paw-body">{item.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-paw-lg grid grid-cols-2 gap-paw-sm">
                {[
                  { value: t("aboutMetricFinderValue"), label: t("aboutMetricFinderLabel") },
                  { value: t("aboutMetricTagsValue"), label: t("aboutMetricTagsLabel") },
                  { value: t("aboutMetricStoreValue"), label: t("aboutMetricStoreLabel") },
                  { value: t("aboutMetricGlobeValue"), label: t("aboutMetricGlobeLabel") },
                ].map((s) => (
                  <div key={s.value} className="about-metric-tile text-center">
                    <div className="text-paw-type-body font-black leading-tight text-paw-on-primary-soft">
                      {s.value}
                    </div>
                    <div className="mt-paw-xxs text-paw-type-caption font-semibold text-paw-muted">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.aside>
      </section>

      {/* ===== MISSION STATEMENT ===== */}
      <section className="about-text-band">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div {...fadeUp(shouldReduceMotion)}>
            <p className="text-paw-type-h2 font-black leading-snug text-paw-ink sm:text-paw-type-h1">
              {t("aboutMissionPrefix")}
              <span className="text-paw-on-primary-soft">{t("aboutMissionHighlight")}</span>
              {t("aboutMissionSuffix")}
            </p>
            <p className="mt-paw-md text-paw-type-body font-semibold text-paw-muted">{t("aboutMissionAttribution")}</p>
          </motion.div>
        </div>
      </section>

      {/* ===== PRODUCT ECOSYSTEM ===== */}
      <section>
        <motion.div {...fadeUp(shouldReduceMotion)} className="mx-auto mb-paw-xxl max-w-2xl text-center">
          <h2 className="font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">{t("aboutEcosystemTitle")}</h2>
          <p className="mx-auto mt-paw-sm text-paw-body">{t("aboutEcosystemCopy")}</p>
        </motion.div>

        <div className="grid gap-paw-lg md:grid-cols-3">
          {ECOSYSTEM.map((item, i) => (
            <motion.div key={item.titleKey} {...fadeUp(shouldReduceMotion, i * 0.08)}>
              <Card className="h-full transition hover:-translate-y-1 hover:border-paw-primary/30 hover:shadow-paw-floating">
                <CardContent>
                  <div className={`mb-paw-lg flex h-14 w-14 items-center justify-center rounded-paw-panel ${item.tone}`}>
                    <PawIcon name={item.icon} className="h-7 w-7" />
                  </div>
                  <h3 className="text-paw-type-h3 font-black text-paw-ink">{t(item.titleKey)}</h3>
                  <p className="mt-paw-sm text-paw-type-body leading-6 text-paw-body">{t(item.descKey)}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== VALUES ===== */}
      <section>
        <motion.div {...fadeUp(shouldReduceMotion)} className="mx-auto mb-paw-xxl max-w-2xl text-center">
          <h2 className="font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">{t("aboutValuesTitle")}</h2>
          <p className="mx-auto mt-paw-sm text-paw-body">{t("aboutValuesCopy")}</p>
        </motion.div>

        <div className="grid gap-paw-md md:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((v, i) => (
            <motion.div key={v.titleKey} {...fadeUp(shouldReduceMotion, i * 0.06)}>
              <Card className="h-full transition hover:border-paw-primary/30 hover:shadow-paw-floating">
                <CardContent>
                  <span className="mb-paw-md flex h-11 w-11 items-center justify-center rounded-paw-control bg-paw-primary-soft text-paw-on-primary-soft">
                    <PawIcon name={v.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="text-paw-type-body font-black text-paw-ink">{t(v.titleKey)}</h3>
                  <p className="mt-paw-xs text-paw-type-body leading-6 text-paw-body">{t(v.descKey)}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== TEAM ===== */}
      <section className="mx-auto max-w-5xl">
        <motion.div {...fadeUp(shouldReduceMotion)} className="mx-auto mb-paw-xxl max-w-2xl text-center">
          <h2 className="font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">{t("aboutTeamTitle")}</h2>
          <p className="mx-auto mt-paw-sm text-paw-body">{t("aboutTeamCopy")}</p>
        </motion.div>

        <div className="grid gap-paw-lg md:grid-cols-3">
          {TEAM.map((member, i) => (
            <motion.div key={member.name} {...fadeUp(shouldReduceMotion, i * 0.1)}>
              <Card className="h-full text-center transition hover:-translate-y-1 hover:border-paw-primary/30 hover:shadow-paw-floating">
                <CardContent>
                  <div className="mx-auto mb-paw-md flex h-20 w-20 items-center justify-center rounded-paw-pill border border-paw-outline-variant bg-paw-primary-soft text-paw-type-h2 font-black text-paw-on-primary-soft shadow-paw-panel">
                    {member.name.slice(0, 1)}
                  </div>
                  <h3 className="text-paw-type-h3 font-black text-paw-ink">{member.name}</h3>
                  <p className="mb-paw-sm text-paw-type-caption font-black uppercase text-paw-on-primary-soft">{t(member.roleKey)}</p>
                  <p className="text-paw-type-body leading-6 text-paw-body">{t(member.descKey)}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Team strengths */}
        <motion.div {...fadeUp(shouldReduceMotion, 0.3)} className="mt-paw-xl grid gap-paw-sm sm:grid-cols-2 md:grid-cols-4">
          {TEAM_STRENGTHS.map((s) => (
            <Card key={s.textKey} className="shadow-paw-panel">
              <CardContent className="flex items-center gap-paw-sm p-paw-md">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-paw-control bg-paw-primary-soft text-paw-on-primary-soft">
                  <PawIcon name={s.icon} className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-paw-type-caption font-bold text-paw-body">{t(s.textKey)}</span>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </section>

      {/* ===== TIMELINE ===== */}
      <section className="mx-auto max-w-3xl">
        <motion.div {...fadeUp(shouldReduceMotion)} className="mb-paw-xxl text-center">
          <h2 className="font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">{t("aboutJourneyTitle")}</h2>
          <p className="mt-paw-sm text-paw-body">{t("aboutJourneyCopy")}</p>
        </motion.div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute bottom-0 left-[18px] top-0 w-0.5 bg-paw-outline-variant md:left-1/2 md:-translate-x-0.5" />

          {TIMELINE.map((item, i) => (
            <motion.div
              key={item.year}
              {...fadeUp(shouldReduceMotion, i * 0.08)}
              className={`relative mb-paw-xl flex items-start gap-paw-md md:mb-paw-xxl ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
            >
              {/* Dot */}
              <div className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-paw-pill border-4 border-paw-primary-soft bg-paw-primary md:absolute md:left-1/2 md:-translate-x-1/2">
                <PawIcon name="paw" className="h-3.5 w-3.5 text-paw-on-primary" />
              </div>
              {/* Card */}
              <Card className={`flex-1 p-paw-md shadow-paw-panel md:max-w-[45%] ${i % 2 === 0 ? "md:mr-auto" : "md:ml-auto"}`}>
                <span className="text-paw-type-caption font-black uppercase text-paw-on-primary-soft">{item.year}</span>
                <p className="mt-paw-xxs text-paw-type-body leading-6 text-paw-body">{t(item.eventKey)}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="about-text-band">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div {...fadeUp(shouldReduceMotion)}>
            <h2 className="font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">
              {t("aboutCtaTitle")}
            </h2>
            <p className="mx-auto mb-paw-xl mt-paw-md max-w-lg text-paw-type-body leading-7 text-paw-body">
              {t("aboutCtaCopy")}
            </p>
            <div className="flex flex-wrap justify-center gap-paw-sm">
              <a
                href="mailto:hello@pawpal.be"
                className={buttonClassName({ variant: "primary", size: "lg" })}
              >
                {t("aboutContactTeam")} <PawIcon name="mail" className="h-5 w-5" />
              </a>
              <Link
                href={path("/globe")}
                className={buttonClassName({ variant: "secondary", size: "lg" })}
              >
                {t("aboutExploreGlobe")}
              </Link>
            </div>
          </motion.div>

          {/* Contact line */}
          <motion.div {...fadeUp(shouldReduceMotion, 0.2)} className="mt-paw-xl flex items-center justify-center gap-paw-xs text-paw-muted">
            <PawIcon name="mail" className="h-4 w-4" />
            <span className="text-paw-type-body">{t("aboutContactPrompt")}<a href={`mailto:${siteConfig.email}`} className="about-inline-contact font-semibold text-paw-on-primary-soft hover:underline">{siteConfig.email}</a></span>
          </motion.div>
        </div>
      </section>
    </PageShell>
  );
}
