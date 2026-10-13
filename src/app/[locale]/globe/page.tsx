"use client";

import dynamic from "next/dynamic";
import PawIcon from "@/components/icons/PawIcon";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";
import type { MessageKey } from "@/i18n/messages/en";

type GlobeTranslation = (key: MessageKey) => string;

function GlobeLoading() {
  const { loader, t } = useRouteTranslations();

  return (
    <div className="globe-loading-shell flex h-screen w-full items-center justify-center bg-paw-ink px-4">
      {loader}
      <div className="globe-loading-card">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-paw-lg bg-paw-panel/10 text-paw-trust">
          <PawIcon name="globe" className="h-8 w-8 animate-pulse" aria-hidden="true" />
        </div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-paw-panel/10">
          <div className="globe-loading-bar h-full rounded-full" />
        </div>
        <p className="mt-4 text-paw-type-body font-bold text-paw-page/70">
          {t("globePageLoadingTitle")}
        </p>
        <p className="mt-1 text-paw-type-caption text-paw-page/45">
          {t("globePageLoadingDescription")}
        </p>
      </div>
    </div>
  );
}

const MapGlobeComponent = dynamic<{ t: GlobeTranslation }>(() => import("@/components/GlobeFullPage"), {
  ssr: false,
  loading: GlobeLoading,
});

export default function GlobePage() {
  const { loader, t } = useRouteTranslations();

  return (
    <>
      {loader}
      <h1 className="sr-only">{t("globePageTitle")}</h1>
      <MapGlobeComponent t={t} />
    </>
  );
}
