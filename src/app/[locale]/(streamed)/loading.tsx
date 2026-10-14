"use client";

import { StatePanel } from "@/components/ui";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";

export default function Loading() {
  const { loader, t } = useRouteTranslations();

  return (
    <>
      {loader}
      <StatePanel state="loading" title={t("pwaLoadingLabel")} />
    </>
  );
}
