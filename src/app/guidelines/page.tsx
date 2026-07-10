"use client";

import {
  Ban,
  EyeOff,
  Flag,
  Handshake,
  Mail,
  MessageSquareWarning,
  Scale,
  ShieldCheck,
} from "lucide-react";
import {
  Badge,
  PageShell,
  buttonClassName,
} from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";

const GUIDELINE_DEFINITIONS = [
  {
    id: "guidelines-respect",
    icon: Handshake,
    titleKey: "guidelinesRespectTitle",
    textKey: "guidelinesRespectText",
    signalKey: "guidelinesRespectSignal",
  },
  {
    id: "guidelines-prohibited-content",
    icon: Ban,
    titleKey: "guidelinesContentTitle",
    textKey: "guidelinesContentText",
    signalKey: "guidelinesContentSignal",
  },
  {
    id: "guidelines-location-privacy",
    icon: EyeOff,
    titleKey: "guidelinesPrivacyTitle",
    textKey: "guidelinesPrivacyText",
    signalKey: "guidelinesPrivacySignal",
  },
  {
    id: "guidelines-reporting",
    icon: Flag,
    titleKey: "guidelinesModerationTitle",
    textKey: "guidelinesModerationText",
    signalKey: "guidelinesModerationSignal",
  },
  {
    id: "guidelines-appeals",
    icon: Mail,
    titleKey: "guidelinesAppealsTitle",
    textKey: "guidelinesAppealsText",
    signalKey: "guidelinesAppealsSignal",
  },
] as const;

export default function GuidelinesPage() {
  const { t } = useI18n();

  return (
    <PageShell className="legal-page-shell pt-28 sm:pt-32" contentClassName="space-y-paw-xl">
      <section className="legal-hero-panel">
        <div className="grid gap-paw-xl lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center">
          <div>
            <Badge tone="primary" className="mb-paw-lg">
              <MessageSquareWarning className="h-4 w-4" aria-hidden="true" />
              {t("guidelinesBadge")}
            </Badge>
            <h1 className="max-w-3xl font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">
              {t("guidelinesHeroTitle")}
            </h1>
            <p className="mt-paw-md max-w-2xl text-paw-type-body text-paw-body sm:text-base">
              {t("guidelinesHeroCopy")}
            </p>
          </div>

          <aside className="grid gap-paw-sm">
            {[
              { icon: ShieldCheck, label: t("guidelinesTrustRespectLabel"), value: t("guidelinesTrustRespectValue") },
              { icon: Flag, label: t("guidelinesTrustReportLabel"), value: t("guidelinesTrustReportValue") },
              { icon: Scale, label: t("guidelinesTrustModerationLabel"), value: t("guidelinesTrustModerationValue") },
            ].map((item) => (
              <div
                key={item.label}
                className="legal-trust-row"
              >
                <item.icon className="h-4 w-4 text-paw-on-primary-soft" aria-hidden="true" />
                <div>
                  <p className="text-sm font-extrabold text-paw-ink">{item.label}</p>
                  <p className="mt-paw-xxs text-xs leading-5 text-paw-body">{item.value}</p>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </section>

      <nav className="legal-section-nav" aria-label={t("guidelinesSectionsAriaLabel")}>
        {GUIDELINE_DEFINITIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className={buttonClassName({ variant: "secondary", size: "sm" })}
          >
            {t(section.titleKey)}
          </a>
        ))}
      </nav>

      <div className="legal-prose-grid">
        {GUIDELINE_DEFINITIONS.map((section) => (
          <section key={section.titleKey} id={section.id} className="legal-prose-section">
              <div className="legal-info-icon">
                <section.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="text-paw-type-h2 font-black text-paw-ink">
                {t(section.titleKey)}
              </h2>
              <p className="mt-paw-sm text-sm leading-6 text-paw-body">{t(section.textKey)}</p>
              <p className="mt-paw-md text-xs font-black uppercase text-paw-on-primary-soft">
                {t(section.signalKey)}
              </p>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
