"use client";

import { useEffect } from "react";
import PawIcon from "@/components/icons/PawIcon";

import { Button, StatusMessage } from "@/components/ui";
import { reportError } from "@/lib/errorReporting";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";
import type { MessageKey } from "@/i18n/messages/en";

const RESOURCE_KEYS: Record<PublicRouteErrorProps["resourceName"], MessageKey> = {
  post: "publicRouteErrorPost",
  group: "publicRouteErrorGroup",
  profile: "publicRouteErrorProfile",
  tag: "publicRouteErrorTag",
};

type PublicRouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
  resourceName: "post" | "group" | "profile" | "tag";
};

export default function PublicRouteError({
  error,
  reset,
  resourceName,
}: PublicRouteErrorProps) {
  const { loader, t } = useRouteTranslations();

  useEffect(() => {
    reportError(error, {
      source: "public-route-error-boundary",
      resource: resourceName,
      digest: error.digest,
    });
  }, [error, resourceName]);

  return (
    <section
      className="deep-page-shell flex min-h-[100dvh] items-center justify-center bg-paw-page px-paw-md py-28 text-paw-ink sm:px-paw-xl lg:px-paw-xxl"
      data-testid="public-route-error"
    >
      {loader}
      <div className="mx-auto w-full max-w-xl">
        <h1 className="font-brand text-paw-type-h1 font-extrabold leading-tight sm:text-paw-type-display">
          {t("publicRouteErrorTitle").replace(
            "{resourceName}",
            t(RESOURCE_KEYS[resourceName]),
          )}
        </h1>
        <StatusMessage tone="critical" className="mt-4">
          {t("publicRouteErrorMessage")}
        </StatusMessage>
        <Button
          type="button"
          size="lg"
          className="mt-5"
          data-testid="public-route-retry"
          onClick={reset}
        >
          <PawIcon name="retry" className="h-4 w-4" aria-hidden="true" />
          {t("publicRouteErrorRetry")}
        </Button>
      </div>
    </section>
  );
}
