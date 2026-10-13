import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { sitePageRoutes as defaultUiRoutes } from "./src/lib/siteRouteRegistry";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/en", destination: "/", permanent: true },
      { source: "/en/:path+", destination: "/:path+", permanent: true },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: defaultUiRoutes.map((source) => ({
        source,
        destination: source === "/" ? "/en" : `/en${source}`,
      })),
      afterFiles: [],
      fallback: [],
    };
  },
};

export default withSentryConfig(nextConfig, {
  org: "pawpal-30",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
