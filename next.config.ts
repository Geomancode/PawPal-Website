import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import { sitePageRoutes as defaultUiRoutes } from "./src/lib/siteRouteRegistry";

const nextConfig: NextConfig = {
  // Preserve the project-owned agent instructions when running Next.js locally.
  agentRules: false,
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
  webpack: {
    // Omit SDK debug messages from production bundles; error capture stays on.
    treeshake: {
      removeDebugLogging: true,
      // All SDK initializers use tracesSampleRate: 0. Remove this option before
      // enabling tracing or adding manual spans; error capture and Logs remain.
      removeTracing: true,
    },
  },
});
