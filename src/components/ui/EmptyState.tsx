import type { ReactNode } from "react";
import type { PawIconComponent } from "@/components/icons/PawIcon";
import { cn } from "@/lib/ui";
import { Card } from "./Card";

type EmptyStateProps = {
  icon?: PawIconComponent;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card
      variant="hero"
      tone="subtle"
      className={cn(
        "flex min-h-56 flex-col items-center justify-center border-dashed px-paw-xl py-paw-xxxl text-center",
        className,
      )}
    >
      {Icon && (
        <div className="mb-paw-md flex h-12 w-12 items-center justify-center rounded-paw-pill bg-paw-primary-soft text-paw-on-primary-soft">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-paw-type-body font-extrabold text-paw-ink">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-paw-type-body leading-6 text-paw-body">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}
