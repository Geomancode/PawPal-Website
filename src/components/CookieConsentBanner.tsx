"use client";

import Link from "next/link";
import PawIcon from "@/components/icons/PawIcon";
import { useState, useSyncExternalStore } from "react";
import Button from "@/components/ui/Button";
import {
  CONSENT_CHANGE_EVENT,
  getConsent,
  setConsent,
  type ConsentChoice,
} from "@/lib/consent";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";

function subscribeToConsentStore(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CONSENT_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CONSENT_CHANGE_EVENT, onStoreChange);
  };
}

function getBannerSnapshot() {
  return getConsent() === null;
}

function getServerBannerSnapshot() {
  return false;
}

export default function CookieConsentBanner() {
  const { loader, t } = useRouteTranslations();
  const shouldShowBanner = useSyncExternalStore(
    subscribeToConsentStore,
    getBannerSnapshot,
    getServerBannerSnapshot,
  );
  const [hasSessionChoice, setHasSessionChoice] = useState(false);

  function saveChoice(choice: ConsentChoice) {
    setConsent(choice);
    setHasSessionChoice(true);
  }

  if (!shouldShowBanner || hasSessionChoice) {
    return null;
  }

  return (
    <section
      aria-label={t("cookieConsentAriaLabel")}
      aria-describedby="cookie-consent-description"
      className="fixed inset-x-3 bottom-3 z-[10020] mx-auto max-w-5xl sm:inset-x-5 sm:bottom-5"
    >
      {loader}
      <div className="rounded-paw-lg border border-paw-border-strong bg-paw-panel/95 p-4 text-paw-ink shadow-paw-panel backdrop-blur sm:p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-paw-ink">
              {t("cookieConsentTitle")}
            </p>
            <p
              id="cookie-consent-description"
              className="mt-1 max-w-3xl text-xs leading-5 text-paw-body sm:text-sm sm:leading-6"
            >
              {t("cookieConsentDescription")} {" "}
              <Link
                href="/privacy"
                className="font-extrabold text-paw-primary underline-offset-4 hover:underline"
              >
                {t("cookieConsentPrivacyPolicy")}
              </Link>
            </p>
          </div>

          <div className="grid gap-2 sm:flex sm:justify-end">
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="w-full whitespace-nowrap sm:w-auto"
              onClick={() => saveChoice("all")}
            >
              <PawIcon name="success" className="h-4 w-4" aria-hidden="true" />
              {t("cookieConsentAcceptAll")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full whitespace-nowrap sm:w-auto"
              onClick={() => saveChoice("essential")}
            >
              <PawIcon name="shield" className="h-4 w-4" aria-hidden="true" />
              {t("cookieConsentEssentialOnly")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
