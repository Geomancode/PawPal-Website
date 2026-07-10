"use client";

import {
  CheckCircle2,
  Cookie,
  Database,
  Eye,
  LockKeyhole,
  MapPinned,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  Badge,
  PageShell,
  buttonClassName,
} from "@/components/ui";
import { resolveMessages, type MessageKey } from "@/i18n/messages";
import { localeFromPath } from "@/i18n/routing";

type PrivacySection = {
  id: string;
  icon: LucideIcon;
  titleKey: MessageKey;
  textKey: MessageKey;
  signalKey: MessageKey;
  items?: Array<{
    labelKey: MessageKey;
    textKey: MessageKey;
  }>;
};

const PRIVACY_DEFINITIONS: PrivacySection[] = [
  {
    id: "privacy-data",
    icon: Database,
    titleKey: "privacyDataTitle",
    textKey: "privacyDataText",
    signalKey: "privacyDataSignal",
  },
  {
    id: "privacy-location",
    icon: MapPinned,
    titleKey: "privacyLocationTitle",
    textKey: "privacyLocationText",
    signalKey: "privacyLocationSignal",
  },
  {
    id: "privacy-choices",
    icon: SlidersHorizontal,
    titleKey: "privacyChoicesTitle",
    textKey: "privacyChoicesText",
    signalKey: "privacyChoicesSignal",
  },
  {
    id: "privacy-cookies",
    icon: Cookie,
    titleKey: "privacyCookiesTitle",
    textKey: "privacyCookiesText",
    signalKey: "privacyCookiesSignal",
    items: [
      {
        labelKey: "privacyCookieAuthLabel",
        textKey: "privacyCookieAuthText",
      },
      {
        labelKey: "privacyCookieCheckoutLabel",
        textKey: "privacyCookieCheckoutText",
      },
      {
        labelKey: "privacyCookiePreferencesLabel",
        textKey: "privacyCookiePreferencesText",
      },
    ],
  },
];

export default function PrivacyPage() {
  const pathname = usePathname();
  const messages = resolveMessages(localeFromPath(pathname));
  const t = (key: MessageKey) => messages[key];

  return (
    <PageShell className="legal-page-shell pt-28 sm:pt-32" contentClassName="space-y-paw-xl">
      <section className="legal-hero-panel">
        <div className="grid gap-paw-xl lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center">
          <div>
            <Badge tone="primary" className="mb-paw-lg">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {t("privacyBadge")}
            </Badge>
            <h1 className="max-w-3xl font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">
              {t("privacyHeroTitle")}
            </h1>
            <p className="mt-paw-md max-w-2xl text-paw-type-body text-paw-body sm:text-base">
              {t("privacyHeroCopy")}
            </p>
          </div>

          <aside className="grid gap-paw-sm">
            {[
              { icon: LockKeyhole, label: t("privacyTrustOwnerLabel"), value: t("privacyTrustOwnerValue") },
              { icon: Eye, label: t("privacyTrustFinderLabel"), value: t("privacyTrustFinderValue") },
              { icon: CheckCircle2, label: t("privacyTrustRequestsLabel"), value: t("privacyTrustRequestsValue") },
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

      <nav className="legal-section-nav" aria-label={t("privacySectionsAriaLabel")}>
        {PRIVACY_DEFINITIONS.map((section) => (
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
        {PRIVACY_DEFINITIONS.map((section) => (
          <section key={section.titleKey} id={section.id} className="legal-prose-section">
              <div className="legal-info-icon">
                <section.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="text-paw-type-h2 font-black text-paw-ink">
                {t(section.titleKey)}
              </h2>
              <p className="mt-paw-sm text-sm leading-6 text-paw-body">{t(section.textKey)}</p>
              {section.items ? (
                <ul className="mt-paw-md space-y-paw-sm text-sm leading-6 text-paw-body">
                  {section.items.map((item) => (
                    <li key={item.labelKey}>
                      <span className="font-extrabold text-paw-ink">
                        {t(item.labelKey)}:
                      </span>{" "}
                      {t(item.textKey)}
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-paw-md text-xs font-black uppercase text-paw-on-primary-soft">
                {t(section.signalKey)}
              </p>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
