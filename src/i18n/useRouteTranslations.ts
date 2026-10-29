"use client";

import {
  createElement,
  useCallback,
  useState,
  useSyncExternalStore,
} from "react";
import dynamic from "next/dynamic";
import { useI18n } from "./I18nProvider";
import type { Locale } from "./locales";
import type { MessageKey, WebsiteMessages } from "./messages/en";
import type { TranslatedLocale } from "./RouteCatalogLoader";

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

const subscribeToHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

export function useRouteTranslations() {
  const { locale, messages: serverMessages, messagesLocale } = useI18n();
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
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
    messagesLocale === locale
      ? serverMessages
      : loadedCatalog?.locale === locale ? loadedCatalog.messages : serverMessages;
  const t = useCallback((key: MessageKey) => messages[key], [messages]);
  const loader =
    !hydrated || locale === "en" || messagesLocale === locale
      ? null
      : createElement(DeferredRouteCatalogLoader, {
          locale,
          onLoad: handleCatalogLoad,
        });

  return { loader, t };
}
