"use client";

import {
  CheckCircle2,
  FileText,
  Handshake,
  MessageSquareWarning,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import {
  Badge,
  PageShell,
  buttonClassName,
} from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";

const TERMS = [
  {
    id: "terms-responsible-use",
    icon: Handshake,
    titleKey: "termsResponsibleTitle",
    textKey: "termsResponsibleText",
    signalKey: "termsResponsibleSignal",
  },
  {
    id: "terms-store",
    icon: ShoppingBag,
    titleKey: "termsStoreTitle",
    textKey: "termsStoreText",
    signalKey: "termsStoreSignal",
  },
  {
    id: "terms-community",
    icon: MessageSquareWarning,
    titleKey: "termsCommunityTitle",
    textKey: "termsCommunityText",
    signalKey: "termsCommunitySignal",
  },
] as const;

export default function TermsPage() {
  const { t } = useI18n();

  return (
    <PageShell className="legal-page-shell pt-28 sm:pt-32" contentClassName="space-y-paw-xl">
      <section className="legal-hero-panel">
        <div className="grid gap-paw-xl lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center">
          <div>
            <Badge tone="primary" className="mb-paw-lg">
              <FileText className="h-4 w-4" aria-hidden="true" />
              {t("termsBadge")}
            </Badge>
            <h1 className="max-w-3xl font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">
              {t("termsHeroTitle")}
            </h1>
            <p className="mt-paw-md max-w-2xl text-paw-type-body text-paw-body sm:text-base">
              {t("termsHeroCopy")}
            </p>
          </div>

          <aside className="grid gap-paw-sm">
            {[
              { icon: ShieldCheck, label: t("termsTrustSafetyLabel"), value: t("termsTrustSafetyValue") },
              { icon: ReceiptText, label: t("termsTrustPurchaseLabel"), value: t("termsTrustPurchaseValue") },
              { icon: CheckCircle2, label: t("termsTrustRespectLabel"), value: t("termsTrustRespectValue") },
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

      <nav className="legal-section-nav" aria-label={t("termsSectionsAriaLabel")}>
        {TERMS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className={buttonClassName({ variant: "secondary", size: "sm" })}
          >
            {t(section.titleKey)}
          </a>
        ))}
      </nav>

      <div className="legal-prose-grid legal-prose-grid-compact">
        {TERMS.map((section) => (
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
