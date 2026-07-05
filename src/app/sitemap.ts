import type { MetadataRoute } from "next";
import { siteConfig, sitemapEntries } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const legalEntries = [
    { path: "/guidelines", priority: 0.35, changeFrequency: "yearly" as const },
  ];

  return [...sitemapEntries, ...legalEntries].map((entry) => ({
    url: `${siteConfig.url}${entry.path}`,
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
