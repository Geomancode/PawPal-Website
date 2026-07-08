import { defaultLocale, type Locale } from "../locales";
import { deMessages } from "./de";
import { enMessages, type WebsiteMessages } from "./en";
import { frMessages } from "./fr";
import { nlMessages } from "./nl";
import { zhMessages } from "./zh";

export { enMessages };
export type { MessageKey, WebsiteMessages } from "./en";

const localeOverrides = {
  de: deMessages,
  en: enMessages,
  fr: frMessages,
  nl: nlMessages,
  zh: zhMessages,
} satisfies Record<Locale, Partial<WebsiteMessages>>;

export function resolveMessages(locale: Locale): WebsiteMessages {
  if (locale === defaultLocale) return enMessages;
  return {
    ...enMessages,
    ...localeOverrides[locale],
  };
}

