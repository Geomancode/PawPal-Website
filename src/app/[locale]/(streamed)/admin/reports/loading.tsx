"use client";

import { Card, CardContent, PageShell } from "@/components/ui";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";

export default function AdminReportsLoading() {
  const { loader, t } = useRouteTranslations();

  return (
    <>
      {loader}
      <PageShell
        className="admin-page-shell min-h-screen pt-28"
        headerClassName="admin-shell-header"
        eyebrow={t("adminReportsEyebrow")}
        title={t("adminReportsTitle")}
        description={t("adminReportsLoadingDescription")}
      >
        <Card className="admin-card-upgraded">
          <CardContent className="space-y-5">
            <div className="h-5 w-44 animate-pulse rounded-paw-sm bg-paw-panel-subtle" />
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="rounded-paw-md border border-paw-border bg-paw-panel-subtle p-4"
              >
                <div className="h-4 w-32 animate-pulse rounded-paw-sm bg-paw-border" />
                <div className="mt-4 h-20 animate-pulse rounded-paw-md bg-paw-border/70" />
              </div>
            ))}
          </CardContent>
        </Card>
      </PageShell>
    </>
  );
}
