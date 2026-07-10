"use client";

import dynamic from "next/dynamic";
import GlobeStaticPreview from "./GlobeStaticPreview";
import { useI18n } from "@/i18n/I18nProvider";

function HomeGlobeLoadingPreview() {
  const { t } = useI18n();
  return (
    <GlobeStaticPreview
      className="home-globe-static-preview"
      statusLabel={t("homeGlobeLoadingPreviewLabel")}
      ariaLabel={t("homeGlobeLoadingPreviewLabel")}
    />
  );
}

const HomeGlobe = dynamic(() => import("./GlobeComponent"), {
  ssr: false,
  loading: () => <HomeGlobeLoadingPreview />,
});

export default function Globe() {
  return <HomeGlobe />;
}
