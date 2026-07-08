import { enMessages } from "@/i18n/messages";

export const SITE_URL = "https://pawpal.be";

export const siteConfig = {
  name: "PawPal",
  url: SITE_URL,
  title: enMessages.siteTitle,
  description: enMessages.siteDescription,
  keywords: [
    "PawPal",
    "pet safety",
    "NFC pet tag",
    "dog walking app",
    "pet community",
    "Belgium pets",
    "lost pet profile",
    "AI pet care",
  ],
  email: "hello@pawpal.be",
  locale: "en_BE",
};

export const sitemapEntries = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/globe", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/store", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.75, changeFrequency: "monthly" as const },
  { path: "/help", priority: 0.65, changeFrequency: "monthly" as const },
  { path: "/privacy", priority: 0.35, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.35, changeFrequency: "yearly" as const },
];
