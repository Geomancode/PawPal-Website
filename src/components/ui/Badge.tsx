import type { HTMLAttributes } from "react";
import { cn } from "@/lib/ui";

type BadgeTone =
  | "primary"
  | "blue"
  | "green"
  | "trust"
  | "mint"
  | "accent"
  | "coral"
  | "success"
  | "warning"
  | "yellow"
  | "danger"
  | "critical"
  | "neutral";

const tones: Record<BadgeTone, string> = {
  primary: "bg-paw-primary-soft text-paw-on-primary-soft border-paw-primary/20",
  blue: "bg-paw-primary-soft text-paw-on-primary-soft border-paw-primary/20",
  green: "bg-paw-green-soft text-paw-on-green-soft border-paw-green/20",
  trust: "bg-paw-trust-soft text-paw-on-trust-soft border-paw-trust/20",
  mint: "bg-paw-trust-soft text-paw-on-trust-soft border-paw-trust/20",
  accent: "bg-paw-accent-soft text-paw-on-accent-soft border-paw-accent/20",
  coral: "bg-paw-accent-soft text-paw-on-accent-soft border-paw-accent/20",
  success: "bg-paw-success-soft text-paw-on-success-soft border-paw-success/20",
  warning: "bg-paw-warning-soft text-paw-on-warning-soft border-paw-warning/20",
  yellow: "bg-paw-warning-soft text-paw-on-warning-soft border-paw-warning/20",
  danger: "bg-paw-critical-soft text-paw-on-critical-soft border-paw-critical/20",
  critical: "bg-paw-critical-soft text-paw-on-critical-soft border-paw-critical/20",
  neutral: "bg-paw-panel-low text-paw-body border-paw-outline-variant",
};

export default function Badge({
  tone = "primary",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-[38px] items-center gap-paw-xs rounded-paw-pill border px-paw-sm py-paw-xs text-xs font-black leading-none",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
