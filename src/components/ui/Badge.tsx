import type { HTMLAttributes } from "react";
import { cn } from "@/lib/ui";

type BadgeTone = "primary" | "accent" | "success" | "warning" | "neutral";

const tones: Record<BadgeTone, string> = {
  primary: "bg-paw-primary-soft text-paw-primary border-paw-primary/20",
  accent: "bg-paw-accent-soft text-paw-accent border-paw-accent/20",
  success: "bg-paw-success-soft text-paw-success border-paw-success/20",
  warning: "bg-paw-warning-soft text-amber-700 border-paw-warning/20",
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function Badge({
  tone = "primary",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-paw-sm border px-2.5 py-1 text-xs font-bold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
