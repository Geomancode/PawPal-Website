import "server-only";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./locales";
import type { WebsiteMessages } from "./messages/en";

const catalogs: Record<Locale, () => Promise<WebsiteMessages>> = {
  en: () => import("./messages/en").then(({ enMessages }) => enMessages),
  de: () => import("./messages/de").then(({ deMessages }) => deMessages),
  fr: () => import("./messages/fr").then(({ frMessages }) => frMessages),
  nl: () => import("./messages/nl").then(({ nlMessages }) => nlMessages),
  zh: () => import("./messages/zh").then(({ zhMessages }) => zhMessages),
};

export async function getServerMessages(value: string) {
  if (!isLocale(value)) notFound();
  return { locale: value, messages: await catalogs[value]() };
}
