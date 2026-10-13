import type { Locale } from "../i18n/locales";
import type { WebsiteMessages } from "../i18n/messages/en";

const catalogs = {
  en: () => import("../i18n/messages/en").then((module) => module.enMessages),
  de: () => import("../i18n/messages/de").then((module) => module.deMessages),
  fr: () => import("../i18n/messages/fr").then((module) => module.frMessages),
  nl: () => import("../i18n/messages/nl").then((module) => module.nlMessages),
  zh: () => import("../i18n/messages/zh").then((module) => module.zhMessages),
} satisfies Record<Locale, () => Promise<WebsiteMessages>>;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

/** Trusted locale + existing dictionary only. Never accepts request path/query text. */
export function renderNotFoundDocument(locale: Locale, messages: WebsiteMessages) {
  const text = (key: keyof WebsiteMessages) => escapeHtml(messages[key]);
  const home = locale === "en" ? "/" : `/${locale}`;
  const store = locale === "en" ? "/store" : `/${locale}/store`;
  return `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${text("notFoundTitle")} | PawPal</title><meta name="description" content="${text("notFoundDescription")}">
<meta name="robots" content="noindex, nofollow"><link rel="stylesheet" href="/pawpal-not-found.css"></head>
<body><main class="error-page"><div class="error-copy">
<img class="brand" src="/pawpal_logo_horizontal.svg" alt="PawPal" width="164" height="44">
<p class="eyebrow">${text("notFoundEyebrow")}</p><h1>${text("notFoundTitle")}</h1>
<p class="description">${text("notFoundDescription")}</p>
<nav class="actions"><a class="button primary" href="${home}">${text("notFoundBackHome")}</a><a class="button secondary" href="${store}">${text("notFoundShopSmartTags")}</a></nav>
</div><aside class="help-panel"><section><h2>${text("notFoundScannedTagTitle")}</h2><p>${text("notFoundScannedTagCopy")}</p></section><section><h2>${text("notFoundLocalHelpTitle")}</h2><p>${text("notFoundLocalHelpCopy")}</p></section></aside>
</main></body></html>`;
}

export async function getNotFoundDocument(locale: Locale) {
  return renderNotFoundDocument(locale, await catalogs[locale]());
}

export const notFoundHeaders = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
};
