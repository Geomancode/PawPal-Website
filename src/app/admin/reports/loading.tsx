import { Card, CardContent, PageShell } from "@/components/ui";

export default function AdminReportsLoading() {
  return (
    <PageShell
      className="admin-page-shell min-h-screen pt-28"
      headerClassName="admin-shell-header"
      eyebrow="PawPal admin"
      title="Moderation reports"
      description="Loading the pending report queue."
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
  );
}
