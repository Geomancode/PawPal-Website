import { defaultLocale, isLocale, type Locale } from "../i18n/locales";
import publicAssetPaths from "./publicAssetPaths.json";
import { developmentOnlyPageRoutes, sitePageRoutes } from "./siteRouteRegistry";

type PageRequestPolicy =
  | { kind: "pass"; reason: "api" | "framework" | "asset" | "metadata" | "page" }
  | { kind: "not-found"; locale: Locale };

const assets = new Set<string>(publicAssetPaths);
const metadataPaths = new Set(["/robots.txt", "/sitemap.xml"]);

/** Validate each segment once; never turn an encoded separator into route structure. */
function safeSegments(segments: string[]) {
  return segments.every((segment) => {
    if (!segment) return false;
    try {
      const decoded = decodeURIComponent(segment);
      return decoded !== "." && decoded !== ".." &&
        !/[\\/\u0000-\u001f\u007f]/.test(decoded);
    } catch {
      return false;
    }
  });
}

/** Input is URL.pathname, never a full URL, query, decoded path or redirect target. */
export function classifyPageRequest(pathname: string, development = false): PageRequestPolicy {
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return { kind: "pass", reason: "api" };
  }
  if (pathname === "/_next" || pathname.startsWith("/_next/")) {
    return { kind: "pass", reason: "framework" };
  }
  if (assets.has(pathname)) return { kind: "pass", reason: "asset" };
  if (metadataPaths.has(pathname)) return { kind: "pass", reason: "metadata" };

  const path = pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const segments = path === "/" ? [] : path.slice(1).split("/");
  const locale = isLocale(segments[0]) ? segments.shift() as Locale : defaultLocale;
  const missing: PageRequestPolicy = { kind: "not-found", locale };
  if (!pathname.startsWith("/") || pathname.includes("?") || pathname.includes("#") || !safeSegments(segments)) {
    return missing;
  }
  for (const pattern of sitePageRoutes) {
    const parts = pattern === "/" ? [] : pattern.slice(1).split("/");
    if (parts.length !== segments.length) continue;
    if (!parts.every((part, index) => part === ":id" || part === segments[index])) continue;
    if (!development && developmentOnlyPageRoutes.includes(pattern)) return missing;
    return { kind: "pass", reason: "page" };
  }
  return missing;
}
