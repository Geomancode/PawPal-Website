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
        "rounded-paw-next-card border bg-paw-panel-low p-paw-lg shadow-paw-strong",
        active || complete ? "border-paw-primary/30" : "border-paw-outline-variant",
        className,
      )}
    >
      <div className="flex items-center gap-paw-sm">
        <span
          className={cn(
            "flex h-paw-min-tap w-paw-min-tap shrink-0 items-center justify-center rounded-paw-pill text-sm font-black",
            complete
              ? "bg-paw-success text-paw-on-success"
              : active
                ? "bg-paw-primary text-paw-on-primary"
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
