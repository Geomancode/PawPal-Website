import type { Locale } from "../locales";
import { enMessages, type WebsiteMessages } from "./en";

export { enMessages };
export type { MessageKey, WebsiteMessages } from "./en";

export function resolveMessages(locale: Locale): WebsiteMessages {
  // Synchronous callers render the English SSR fallback. Client routes load
  // non-default catalogs after hydration without adding them to initial JS.
  void locale;
  return enMessages;
}
