"use client";

import Link from "next/link";
import PawIcon, { type PawIconName } from "@/components/icons/PawIcon";
import PawPalLogo from "@/components/PawPalLogo";
import { buttonClassName } from "@/components/ui";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";

export default function NotFound() {
  const { loader, t } = useRouteTranslations();

  return (
    <section className="deep-page-shell min-h-[100dvh] bg-paw-page px-paw-md py-28 text-paw-ink sm:px-paw-xl lg:px-paw-xxl">
      {loader}
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <PawPalLogo iconSize={44} fontSize={28} variant="light" />
          <p className="mt-8 text-paw-type-caption font-black uppercase tracking-[0.18em] text-paw-on-primary-soft">
            {t("notFoundEyebrow")}
          </p>
          <h1 className="mt-3 max-w-xl font-brand text-paw-type-display font-extrabold leading-tight text-paw-ink">
            {t("notFoundTitle")}
          </h1>
          <p className="mt-5 max-w-lg text-paw-type-body leading-8 text-paw-body">
            {t("notFoundDescription")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className={buttonClassName({ variant: "primary", size: "lg" })}
            >
              <PawIcon name="home" className="h-4 w-4" aria-hidden="true" />
              {t("notFoundBackHome")}
            </Link>
            <Link
              href="/store"
              className={buttonClassName({ variant: "secondary", size: "lg" })}
            >
              {t("notFoundShopSmartTags")}
              <PawIcon name="forward" className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <aside className="not-found-panel">
          <div className="hero-map-grid absolute inset-0 opacity-35" aria-hidden="true" />
          <div className="relative z-10 space-y-4">
            {([
              {
                icon: "nfcScan",
                title: t("notFoundScannedTagTitle"),
                copy: t("notFoundScannedTagCopy"),
              },
              {
                icon: "map",
                title: t("notFoundLocalHelpTitle"),
                copy: t("notFoundLocalHelpCopy"),
              },
            ] satisfies Array<{ icon: PawIconName; title: string; copy: string }>).map((item) => (
              <div key={item.title} className="not-found-row">
                <span className="not-found-icon">
                  <PawIcon name={item.icon} className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-paw-type-body font-extrabold text-paw-ink">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-paw-type-body leading-6 text-paw-body">
                    {item.copy}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
