"use client";

import { useEffect } from "react";
import type { Locale } from "./locales";
import type { WebsiteMessages } from "./messages/en";

export type TranslatedLocale = Exclude<Locale, "en">;

type RouteCatalogLoaderProps = {
  locale: TranslatedLocale;
  onLoad: (locale: TranslatedLocale, messages: WebsiteMessages) => void;
};

const catalogPromises: Partial<
  Record<TranslatedLocale, Promise<WebsiteMessages>>
> = {};

function loadCatalog(locale: TranslatedLocale): Promise<WebsiteMessages> {
  const cachedPromise = catalogPromises[locale];
  if (cachedPromise) return cachedPromise;

  let promise: Promise<WebsiteMessages>;
  switch (locale) {
    case "de":
      promise = import("./messages/de").then(({ deMessages }) => deMessages);
      break;
    case "fr":
      promise = import("./messages/fr").then(({ frMessages }) => frMessages);
      break;
    case "nl":
      promise = import("./messages/nl").then(({ nlMessages }) => nlMessages);
      break;
    case "zh":
      promise = import("./messages/zh").then(({ zhMessages }) => zhMessages);
      break;
  }

  const retryablePromise = promise.catch((error: unknown) => {
    delete catalogPromises[locale];
    throw error;
  });
  catalogPromises[locale] = retryablePromise;
  return retryablePromise;
}

export function RouteCatalogLoader({
  locale,
  onLoad,
}: RouteCatalogLoaderProps) {
  useEffect(() => {
    let active = true;
    void loadCatalog(locale)
      .then((messages) => {
        if (active) onLoad(locale, messages);
      })
      .catch(() => {
        // Keep the server-rendered English fallback when a locale chunk fails.
      });

    return () => {
      active = false;
    };
  }, [locale, onLoad]);

  return null;
}
