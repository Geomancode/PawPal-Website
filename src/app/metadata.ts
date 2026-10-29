import type { Metadata } from "next";
import { enMessages } from "@/i18n/messages";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { localizedPath } from "@/i18n/routing";

export const PAWPAL_METADATA_BASE = "https://www.pawpal.be";
export const PAWPAL_OG_IMAGE_PATH = "/images/pawpal-og.jpg";

export const PAWPAL_OG_IMAGE = {
  url: PAWPAL_OG_IMAGE_PATH,
  width: 1200,
  height: 630,
  alt: enMessages.siteOgImageAlt,
};

export function openGraphLocale(locale: Locale) {
  const values: Record<Locale, string> = {
    en: "en_BE", de: "de_DE", fr: "fr_FR", nl: "nl_NL", zh: "zh_CN",
  };
  return values[locale];
}

type PublicPageMetadata = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  locale?: Locale;
  imageAlt?: string;
};

type PrivatePageMetadata = {
  locale?: Locale;
  title: string;
  description: string;
  path: string;
};

export function metadataUrl(path: string) {
  return new URL(path, PAWPAL_METADATA_BASE).toString();
}

export function socialTitle(title: string) {
  const normalized = title.trim();
  return normalized.includes("PawPal") ? normalized : `${normalized} | PawPal`;
}

export function publicPageMetadata({
  title,
  description,
  path,
  type = "website",
  locale = defaultLocale,
  imageAlt = PAWPAL_OG_IMAGE.alt,
}: PublicPageMetadata): Metadata {
  const publicPath = localizedPath(path, locale);
  return {
    title,
    description,
    alternates: {
      canonical: publicPath,
    },
    openGraph: {
      type,
      url: metadataUrl(publicPath),
      siteName: "PawPal",
      title: socialTitle(title),
      description,
      locale: openGraphLocale(locale),
      images: [{ ...PAWPAL_OG_IMAGE, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle(title),
      description,
      images: [PAWPAL_OG_IMAGE_PATH],
    },
  };
}

export function privatePageMetadata({
  title,
  description,
  path,
  locale = defaultLocale,
}: PrivatePageMetadata): Metadata {
  const publicPath = localizedPath(path, locale);
  return {
    title,
    description,
    alternates: {
      canonical: publicPath,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}
