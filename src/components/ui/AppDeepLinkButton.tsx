"use client";

import Link from "next/link";
import { useState } from "react";
import PawIcon from "@/components/icons/PawIcon";
import { cn } from "@/lib/ui";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";
import { buttonClassName } from "./Button";

type AppDeepLinkButtonProps = {
  href: string;
  fallbackHref?: string;
  children?: React.ReactNode;
  className?: string;
  fallbackLabel?: string;
};

export default function AppDeepLinkButton({
  href,
  fallbackHref = "/",
  children,
  className,
  fallbackLabel,
}: AppDeepLinkButtonProps) {
  const { loader, t } = useRouteTranslations();
  const [showFallback, setShowFallback] = useState(false);
  const buttonLabel = children === undefined ? t("appDeepLinkOpenInApp") : children;
  const webFallbackLabel =
    fallbackLabel === undefined ? t("appDeepLinkContinueOnWeb") : fallbackLabel;

  return (
    <div className="grid gap-2">
      {loader}
      <a
        href={href}
        onClick={() => {
          window.setTimeout(() => setShowFallback(true), 900);
        }}
        className={cn(buttonClassName({ size: "lg" }), className)}
      >
        <PawIcon name="appLink" className="h-4 w-4" aria-hidden="true" />
        {buttonLabel}
      </a>
      {showFallback && (
        <div className="rounded-paw-xl border border-paw-outline-variant bg-paw-panel-subtle px-paw-sm py-paw-xs text-paw-type-caption leading-5 text-paw-body shadow-paw-panel">
          {t("appDeepLinkFallbackDescription")} {" "}
          <Link
            href={fallbackHref}
            className="mt-2 inline-flex items-center gap-1 font-extrabold text-paw-on-primary-soft hover:underline"
          >
            {webFallbackLabel}
            <PawIcon name="forward" className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  );
}
