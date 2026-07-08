import { defaultLocale, isLocale, type Locale } from "./locales";

export function localeFromPath(pathname: string): Locale {
  const [, maybeLocale] = pathname.split("/");
  return isLocale(maybeLocale) ? maybeLocale : defaultLocale;
}

export function stripLocalePrefix(pathname: string) {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];
  if (!isLocale(maybeLocale) || maybeLocale === defaultLocale) {
    return pathname;
  }

  const stripped = `/${segments.slice(2).join("/")}`;
  return stripped === "/" ? stripped : stripped.replace(/\/+$/, "") || "/";
}

export function localizedPath(path: string, locale: Locale) {
  if (
    locale === defaultLocale ||
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("mailto:") ||
    path.startsWith("#")
  ) {
    return path;
  }

  const [pathnameWithSearch, hash = ""] = path.split("#");
  const [pathname, search = ""] = pathnameWithSearch.split("?");
  const normalizedPathname = pathname === "/" ? "" : pathname;
  const localized = `/${locale}${normalizedPathname}`;
  return `${localized}${search ? `?${search}` : ""}${hash ? `#${hash}` : ""}`;
}
