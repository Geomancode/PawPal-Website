"use client";

import Link from "next/link";
import PawIcon from "./icons/PawIcon";
import PawPalLogo from "./PawPalLogo";
import styles from "./Footer.module.css";
import { siteConfig } from "@/lib/site";
import { useI18n } from "@/i18n/I18nProvider";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";

export default function Footer() {
  const { path } = useI18n();
  const { loader, t } = useRouteTranslations();
  const footerNav = {
    [t("footerProductHeading")]: [
      { label: t("footerGlobeMap"), href: "/globe" },
      { label: t("footerNfcSafetyTag"), href: "/store" },
      { label: t("footerAiAssistant"), href: "/globe" },
      { label: t("footerCommunity"), href: "/globe" },
    ],
    [t("footerCompanyHeading")]: [
      { label: t("navAboutUs"), href: "/about" },
      { label: t("navStore"), href: "/store" },
      { label: t("footerHelpCenter"), href: "/help" },
    ],
    [t("footerSupportHeading")]: [
      { label: t("footerPrivacyPolicy"), href: "/privacy" },
      { label: t("footerTermsOfService"), href: "/terms" },
      { label: t("footerCommunityGuidelines"), href: "/guidelines" },
      { label: t("footerContact"), href: `mailto:${siteConfig.email}` },
    ],
  };

  return (
    <footer aria-labelledby="footer-heading" className={`${styles.visual} border-t border-paw-border text-paw-body`}>
      {loader}
      <h2 id="footer-heading" className="sr-only">
        {t("footerHeading")}
      </h2>

      <div className={`${styles.main} mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.65fr)_minmax(15rem,0.72fr)] lg:gap-10 lg:px-8`}>
        <div>
          <PawPalLogo iconSize={30} fontSize={22} variant="adaptive" />
          <p className="mt-5 max-w-xs text-paw-type-body leading-7 text-paw-body">
            {t("footerTagline")}
          </p>
          <a
            href={`mailto:${siteConfig.email}`}
            className={`${styles.emailLink} mt-6 inline-flex items-center gap-2 rounded-paw-sm border border-paw-border bg-paw-panel px-4 text-paw-type-body font-bold text-paw-ink shadow-paw-control transition hover:border-paw-primary hover:text-paw-primary`}
          >
            <PawIcon name="mail" className="h-4 w-4" aria-hidden="true" />
            {siteConfig.email}
          </a>
        </div>

        <nav className="grid gap-7 sm:grid-cols-3" aria-label={t("footerNavLabel")}>
          {Object.entries(footerNav).map(([title, links]) => (
            <div key={title}>
              <h3 className={`${styles.navHeading} mb-3 text-paw-type-caption font-black uppercase text-paw-ink`}>{title}</h3>
              <ul className={styles.linkList}>
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={path(link.href)} className={`${styles.link} text-paw-type-body font-medium text-paw-body transition`}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className={styles.contactBlock}>
          <h3 className={`${styles.navHeading} mb-3 text-paw-type-caption font-black uppercase text-paw-ink`}>{t("footerPilotHeading")}</h3>
          <p className="text-paw-type-body leading-6 text-paw-body">
            {t("footerPilotCopy")}
          </p>
          <a
            href={`mailto:${siteConfig.email}?subject=PawPal%20partnership`}
            className={`${styles.actionLink} mt-5 inline-flex items-center gap-2 rounded-paw-sm bg-paw-primary px-4 text-paw-type-caption font-bold text-paw-on-primary transition hover:bg-paw-primary-hover`}
          >
            {t("footerContactPawPal")}
            <PawIcon name="forward" className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className={`${styles.bottom} border-t border-paw-border`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-paw-type-caption font-medium text-paw-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} PawPal. {t("footerRights")}</p>
          <p>{t("footerMadeInBelgiumEnglish")}</p>
        </div>
      </div>
    </footer>
  );
}
