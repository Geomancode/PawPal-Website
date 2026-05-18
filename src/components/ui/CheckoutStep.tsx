import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/ui";

type CheckoutStepProps = {
  index: number;
  label: string;
  active?: boolean;
  complete?: boolean;
  children?: ReactNode;
  className?: string;
};

export default function CheckoutStep({
  index,
  label,
  active = false,
  complete = false,
  children,
  className,
}: CheckoutStepProps) {
  return (
    <section
      className={cn(
        "rounded-paw-lg border bg-paw-panel p-5 shadow-paw-panel",
        active || complete ? "border-paw-primary/30" : "border-paw-border",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-paw-sm text-sm font-extrabold",
            complete
              ? "bg-paw-success text-white"
              : active
                ? "bg-paw-primary text-white"
                : "bg-paw-panel-subtle text-paw-muted",
          )}
        >
          {complete ? <Check className="h-4 w-4" aria-hidden="true" /> : index}
        </span>
        <h2 className="text-base font-extrabold text-paw-ink">{label}</h2>
      </div>
      {children && <div className="mt-5">{children}</div>}
    </section>
  );
}
