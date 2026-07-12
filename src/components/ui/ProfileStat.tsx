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
        "rounded-paw-xl border border-paw-outline-variant bg-paw-panel-subtle p-paw-md shadow-paw-panel",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-paw-sm">
        <div className="min-w-0">
          <p className="text-paw-type-caption font-extrabold uppercase text-paw-muted">
            {label}
          </p>
          <div className="mt-1 text-paw-type-h2 font-extrabold leading-7 text-paw-ink">
            {value}
          </div>
        </div>
        {icon && (
          <div className="flex h-paw-min-tap w-paw-min-tap shrink-0 items-center justify-center rounded-paw-lg bg-paw-primary-soft text-paw-on-primary-soft">
            {icon}
          </div>
        )}
      </div>
      {helper && <p className="mt-2 text-paw-type-body leading-6 text-paw-body">{helper}</p>}
    </div>
  );
}
