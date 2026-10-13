"use client";

import { useEffect } from "react";
import PawIcon from "@/components/icons/PawIcon";
import { Button, StatePanel } from "@/components/ui";
import { reportError } from "@/lib/errorReporting";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { loader, t } = useRouteTranslations();

  useEffect(() => {
    reportError(error, {
      source: "app-error-boundary",
      digest: error.digest,
    });
  }, [error]);

  return (
    <>
      {loader}
      <StatePanel
        state="error"
        title={t("rootErrorPageTitle")}
        body={error.message || t("rootErrorFallbackDescription")}
        action={
          <Button type="button" size="lg" onClick={reset}>
            <PawIcon name="retry" className="h-4 w-4" aria-hidden="true" />
            {t("rootErrorTryAgain")}
          </Button>
        }
      />
    </>
  );
}
