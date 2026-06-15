import type { ReactNode } from "react";
import { AlertTriangle, HeartPulse, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/ui";
import Badge from "./Badge";
import { Card, CardContent } from "./Card";

type NfcIdentityCardProps = {
  name: string;
  avatar?: ReactNode;
  subtitle?: ReactNode;
  status?: "safe" | "attention" | "urgent";
  facts?: Array<{ label: string; value: ReactNode; tone?: "neutral" | "urgent" }>;
  notes?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

const statusConfig = {
  safe: {
    label: "Verified identity",
    icon: ShieldCheck,
    tone: "success" as const,
  },
  attention: {
    label: "Needs attention",
    icon: HeartPulse,
    tone: "warning" as const,
  },
  urgent: {
    label: "Emergency details",
    icon: AlertTriangle,
    tone: "accent" as const,
  },
};

export default function NfcIdentityCard({
  name,
  avatar,
  subtitle,
  status = "safe",
  facts = [],
  notes,
  actions,
  className,
}: NfcIdentityCardProps) {
  const current = statusConfig[status];
  const StatusIcon = current.icon;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="bg-paw-primary px-5 py-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-paw-lg border border-white/30 bg-white/20 text-2xl font-extrabold">
              {avatar ?? name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-extrabold leading-8">
                {name}
              </h2>
              {subtitle && <p className="mt-1 text-sm text-white/80">{subtitle}</p>}
            </div>
          </div>
          <Badge tone={current.tone} className="shrink-0 border-white/20 bg-white/15 text-white">
            <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {current.label}
          </Badge>
        </div>
      </div>
      <CardContent className="space-y-5">
        {facts.length > 0 && (
          <dl className="grid grid-cols-2 gap-3">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className={cn(
                  "rounded-paw-md border p-3",
                  fact.tone === "urgent"
                    ? "border-paw-danger/20 bg-paw-danger-soft"
                    : "border-paw-border bg-paw-panel-subtle",
                )}
              >
                <dt className="text-xs font-extrabold uppercase tracking-wide text-paw-muted">
                  {fact.label}
                </dt>
                <dd className="mt-1 text-sm font-extrabold text-paw-ink">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {notes && (
          <div className="rounded-paw-md border border-paw-warning/25 bg-paw-warning-soft p-4 text-sm leading-6 text-paw-body">
            {notes}
          </div>
        )}
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </CardContent>
    </Card>
  );
}
