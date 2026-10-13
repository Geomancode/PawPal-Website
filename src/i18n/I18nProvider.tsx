"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { defaultLocale, type Locale } from "./locales";
import { localizedPath, localeFromPath } from "./routing";

const subscribe = () => () => {};
import type { MessageKey, WebsiteMessages } from "./messages";

type I18nContextValue = {
  locale: Locale;
  messages: WebsiteMessages;
  messagesLocale: Locale;
  t: (key: MessageKey) => string;
  path: (href: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  locale = defaultLocale,
  messages,
}: {
  children: ReactNode;
  locale?: Locale;
  messages: WebsiteMessages;
}) {
  const pathname = usePathname();
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const routeLocale = hydrated ? localeFromPath(pathname || "/") : locale;
  useEffect(() => { document.documentElement.lang = routeLocale; }, [routeLocale]);
  const value = useMemo<I18nContextValue>(
    () => ({
      locale: routeLocale,
      messages,
      messagesLocale: locale,
      t: (key) => messages[key],
      path: (href) => localizedPath(href, routeLocale),
    }),
    [routeLocale, messages, locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
