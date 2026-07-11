"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import StatusMessage from "@/components/ui/StatusMessage";
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
    <section className="deep-page-shell flex min-h-[100dvh] items-center justify-center bg-paw-page px-5 py-28 text-paw-ink">
      {loader}
      <div className="mx-auto w-full max-w-xl">
        <StatusMessage tone="danger" title={t("rootErrorPageTitle")}>
          {error.message || t("rootErrorFallbackDescription")}
        </StatusMessage>
        <Button type="button" size="lg" onClick={reset} className="mt-5">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {t("rootErrorTryAgain")}
        </Button>
      </div>
    </section>
  );
}
