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
      <div className="bg-paw-primary px-paw-lg py-paw-xl text-paw-on-primary">
        <div className="flex items-start justify-between gap-paw-md">
          <div className="flex min-w-0 items-center gap-paw-md">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-paw-xl border border-paw-on-primary/20 bg-paw-panel/20 text-paw-type-h2 font-extrabold">
              {avatar ?? name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-paw-type-h2 font-extrabold leading-8">
                {name}
              </h2>
              {subtitle && <p className="mt-1 text-paw-type-body text-paw-on-primary/75">{subtitle}</p>}
            </div>
          </div>
          <Badge
            tone={current.tone}
            className="shrink-0 border-paw-on-primary/20 bg-paw-panel/20 text-paw-on-primary"
          >
            <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {current.label}
          </Badge>
        </div>
      </div>
      <CardContent className="space-y-paw-lg">
        {facts.length > 0 && (
          <dl className="grid grid-cols-2 gap-paw-sm">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className={cn(
                  "rounded-paw-xl border p-paw-sm",
                  fact.tone === "urgent"
                    ? "border-paw-critical/20 bg-paw-critical-soft text-paw-on-critical-soft"
                    : "border-paw-outline-variant bg-paw-panel-subtle text-paw-body",
                )}
              >
                <dt
                  className={cn(
                    "text-paw-type-caption font-extrabold uppercase",
                    fact.tone === "urgent"
                      ? "text-paw-on-critical-soft"
                      : "text-paw-muted",
                  )}
                >
                  {fact.label}
                </dt>
                <dd
                  className={cn(
                    "mt-1 text-paw-type-body font-extrabold",
                    fact.tone === "urgent"
                      ? "text-paw-on-critical-soft"
                      : "text-paw-ink",
                  )}
                >
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {notes && (
          <div className="rounded-paw-xl border border-paw-warning/25 bg-paw-warning-soft p-paw-md text-paw-type-body leading-6 text-paw-on-warning-soft">
            {notes}
          </div>
        )}
        {actions && <div className="flex flex-wrap gap-paw-sm">{actions}</div>}
      </CardContent>
    </Card>
  );
}
