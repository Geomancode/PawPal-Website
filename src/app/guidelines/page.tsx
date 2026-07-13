"use client";

import PawIcon from "@/components/icons/PawIcon";
import {
  Badge,
  PageShell,
  buttonClassName,
} from "@/components/ui";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";

const GUIDELINE_DEFINITIONS = [
  {
    id: "guidelines-respect",
    icon: "partnership",
    titleKey: "guidelinesRespectTitle",
    textKey: "guidelinesRespectText",
    signalKey: "guidelinesRespectSignal",
  },
  {
    id: "guidelines-prohibited-content",
    icon: "ban",
    titleKey: "guidelinesContentTitle",
    textKey: "guidelinesContentText",
    signalKey: "guidelinesContentSignal",
  },
  {
    id: "guidelines-location-privacy",
    icon: "hide",
    titleKey: "guidelinesPrivacyTitle",
    textKey: "guidelinesPrivacyText",
    signalKey: "guidelinesPrivacySignal",
  },
  {
    id: "guidelines-reporting",
    icon: "flag",
    titleKey: "guidelinesModerationTitle",
    textKey: "guidelinesModerationText",
    signalKey: "guidelinesModerationSignal",
  },
  {
    id: "guidelines-appeals",
    icon: "mail",
    titleKey: "guidelinesAppealsTitle",
    textKey: "guidelinesAppealsText",
    signalKey: "guidelinesAppealsSignal",
  },
] as const;

export default function GuidelinesPage() {
  const { loader, t } = useRouteTranslations();

  return (
    <PageShell className="legal-page-shell pt-28 sm:pt-32" contentClassName="space-y-paw-xl">
      {loader}
      <section className="legal-hero-panel">
        <div className="grid gap-paw-xl lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center">
          <div>
            <Badge tone="primary" className="mb-paw-lg">
              <PawIcon name="commentWarning" className="h-4 w-4" aria-hidden="true" />
              {t("guidelinesBadge")}
            </Badge>
            <h1 className="max-w-3xl font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">
              {t("guidelinesHeroTitle")}
            </h1>
            <p className="mt-paw-md max-w-2xl text-paw-type-body text-paw-body sm:text-paw-type-body">
              {t("guidelinesHeroCopy")}
            </p>
          </div>

          <aside className="grid gap-paw-sm">
            {[
              { icon: "shield" as const, label: t("guidelinesTrustRespectLabel"), value: t("guidelinesTrustRespectValue") },
              { icon: "flag" as const, label: t("guidelinesTrustReportLabel"), value: t("guidelinesTrustReportValue") },
              { icon: "legal" as const, label: t("guidelinesTrustModerationLabel"), value: t("guidelinesTrustModerationValue") },
            ].map((item) => (
              <div
                key={item.label}
                className="legal-trust-row"
              >
                <PawIcon name={item.icon} className="h-4 w-4 text-paw-on-primary-soft" aria-hidden="true" />
                <div>
                  <p className="text-paw-type-body font-extrabold text-paw-ink">{item.label}</p>
                  <p className="mt-paw-xxs text-paw-type-caption leading-5 text-paw-body">{item.value}</p>
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
                <PawIcon name={section.icon} className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="text-paw-type-h2 font-black text-paw-ink">
                {t(section.titleKey)}
              </h2>
              <p className="mt-paw-sm text-paw-type-body leading-6 text-paw-body">{t(section.textKey)}</p>
              <p className="mt-paw-md text-paw-type-caption font-black uppercase text-paw-on-primary-soft">
                {t(section.signalKey)}
              </p>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
