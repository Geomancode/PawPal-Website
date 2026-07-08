export const locales = ["de", "en", "fr", "nl", "zh"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const nonDefaultLocales = locales.filter(
  (locale): locale is Exclude<Locale, "en"> => locale !== defaultLocale,
);

const localeSet = new Set<string>(locales);

export function isLocale(value: string | undefined | null): value is Locale {
  return Boolean(value && localeSet.has(value));
}

