"use client";

import { createElement, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useI18n } from "./I18nProvider";
import type { Locale } from "./locales";
import type { MessageKey, WebsiteMessages } from "./messages/en";
import type { TranslatedLocale } from "./RouteCatalogLoader";
import { localeFromPath } from "./routing";

type RouteCatalogLoaderProps = {
  locale: TranslatedLocale;
  onLoad: (locale: TranslatedLocale, messages: WebsiteMessages) => void;
};

const DeferredRouteCatalogLoader = dynamic<RouteCatalogLoaderProps>(
  () =>
    import("./RouteCatalogLoader").then(
      ({ RouteCatalogLoader }) => RouteCatalogLoader,
    ),
  { ssr: false },
);

export function useRouteTranslations() {
  const pathname = usePathname();
  const { messages: englishMessages } = useI18n();
  const locale = localeFromPath(pathname);
  const [loadedCatalog, setLoadedCatalog] = useState<{
    locale: Locale;
    messages: WebsiteMessages;
  } | null>(null);

  const handleCatalogLoad = useCallback(
    (loadedLocale: TranslatedLocale, messages: WebsiteMessages) => {
      setLoadedCatalog({ locale: loadedLocale, messages });
    },
    [],
  );

  const messages =
    loadedCatalog?.locale === locale ? loadedCatalog.messages : englishMessages;
  const t = useCallback((key: MessageKey) => messages[key], [messages]);
  const loader =
    locale === "en"
      ? null
      : createElement(DeferredRouteCatalogLoader, {
          locale,
          onLoad: handleCatalogLoad,
        });

  return { loader, t };
}
