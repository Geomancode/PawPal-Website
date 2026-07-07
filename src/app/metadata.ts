import type { Metadata } from "next";

export const PAWPAL_METADATA_BASE = "https://www.pawpal.be";
export const PAWPAL_OG_IMAGE_PATH = "/images/pawpal-og.jpg";

export const PAWPAL_OG_IMAGE = {
  url: PAWPAL_OG_IMAGE_PATH,
  width: 1200,
  height: 630,
  alt: "PawPal pet safety map, smart tags, and local pet community",
};

type PublicPageMetadata = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
};

type PrivatePageMetadata = {
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
}: PublicPageMetadata): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type,
      url: metadataUrl(path),
      siteName: "PawPal",
      title: socialTitle(title),
      description,
      locale: "en_BE",
      images: [PAWPAL_OG_IMAGE],
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
}: PrivatePageMetadata): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}
