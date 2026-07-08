"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { defaultLocale, type Locale } from "./locales";
import { localizedPath } from "./routing";
import type { MessageKey, WebsiteMessages } from "./messages";

type I18nContextValue = {
  locale: Locale;
  messages: WebsiteMessages;
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
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      messages,
      t: (key) => messages[key],
      path: (href) => localizedPath(href, locale),
    }),
    [locale, messages],
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
