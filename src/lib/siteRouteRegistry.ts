/** Keep these page shapes in sync with src/app/[locale]; checked by contract. */
export const sitePageRoutes = [
  "/", "/about", "/admin/park-risks", "/admin/reports", "/auth", "/companion",
  "/dev/state-panel", "/globe", "/group/:id", "/guidelines", "/help",
  "/pet/:id", "/post/:id", "/privacy", "/profile", "/store",
  "/store/admin", "/store/checkout", "/store/orders", "/store/success",
  "/tag/:id", "/terms", "/user/:id",
] as const;

export const developmentOnlyPageRoutes: readonly string[] = ["/dev/state-panel"];
