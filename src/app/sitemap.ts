import type { MetadataRoute } from "next";
import { siteConfig, sitemapEntries } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return sitemapEntries.map((entry) => ({
    url: `${siteConfig.url}${entry.path}`,
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}

