import type { ReactNode } from "react";
import { cn } from "@/lib/ui";

type ProfileStatProps = {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export default function ProfileStat({
  label,
  value,
  helper,
  icon,
  className,
}: ProfileStatProps) {
  return (
    <div
      className={cn(
        "rounded-paw-md border border-paw-border bg-paw-panel-subtle p-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wide text-paw-muted">
            {label}
          </p>
          <div className="mt-1 text-xl font-extrabold leading-7 text-paw-ink">
            {value}
          </div>
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-paw-sm bg-paw-primary-soft text-paw-primary">
            {icon}
          </div>
        )}
      </div>
      {helper && <p className="mt-2 text-sm leading-6 text-paw-body">{helper}</p>}
    </div>
  );
}
