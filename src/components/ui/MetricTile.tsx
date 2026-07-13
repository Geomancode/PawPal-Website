import Badge from "./Badge";
import { Card, CardContent } from "./Card";

type MetricTileProps = {
  label: string;
  value: number;
  tone: "primary" | "trust" | "warning" | "critical" | "success" | "neutral";
  className?: string;
};

export default function MetricTile({
  label,
  value,
  tone,
  className,
}: MetricTileProps) {
  return (
    <Card className={className}>
      <CardContent className="p-paw-md">
        <p className="text-paw-type-caption font-extrabold uppercase tracking-wide text-paw-muted">
          {label}
        </p>
        <div className="mt-paw-xs flex items-center justify-between gap-paw-sm">
          <p className="text-paw-type-h2 font-extrabold text-paw-ink">{value}</p>
          <Badge tone={tone}>{label}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
