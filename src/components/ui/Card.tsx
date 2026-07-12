import type { HTMLAttributes } from "react";
import { cn } from "@/lib/ui";

export type CardVariant = "compact" | "panel" | "hero" | "sheet";
export type CardTone =
  | "surface"
  | "subtle"
  | "primary"
  | "trust"
  | "success"
  | "warning";
export type CardElevation = "none" | "subtle" | "raised" | "floating";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  tone?: CardTone;
  elevation?: CardElevation;
  selected?: boolean;
  disabled?: boolean;
};

const variantClasses: Record<CardVariant, string> = {
  compact: "rounded-paw-card",
  panel: "rounded-paw-panel",
  hero: "rounded-paw-xl",
  sheet: "rounded-paw-sheet",
};

const toneClasses: Record<CardTone, string> = {
  surface: "border-paw-outline-variant bg-paw-panel-low text-paw-ink",
  subtle: "border-paw-outline-variant bg-paw-panel-subtle text-paw-ink",
  primary: "border-paw-primary/20 bg-paw-primary-soft text-paw-on-primary-soft",
  trust: "border-paw-trust/20 bg-paw-trust-soft text-paw-on-trust-soft",
  success: "border-paw-success/20 bg-paw-success-soft text-paw-on-success-soft",
  warning: "border-paw-warning/20 bg-paw-warning-soft text-paw-on-warning-soft",
};

const elevationClasses: Record<CardElevation, string> = {
  none: "shadow-none",
  subtle: "shadow-paw-panel",
  raised: "shadow-paw-strong",
  floating: "shadow-paw-floating",
};

export function Card({
  variant = "panel",
  tone = "surface",
  elevation = "subtle",
  selected = false,
  disabled = false,
  className,
  ...props
}: CardProps) {
  const interactive = typeof props.onClick === "function";
  const ariaDisabled = disabled || props["aria-disabled"];

  return (
    <div
      {...props}
      aria-disabled={ariaDisabled}
      className={cn(
        "border",
        variantClasses[variant],
        toneClasses[tone],
        selected ? "border-paw-primary/45 ring-2 ring-paw-primary/15" : undefined,
        disabled ? "opacity-60" : undefined,
        interactive
          ? "cursor-pointer transition-[border-color,box-shadow,transform] duration-paw-fast ease-out [box-shadow:0_var(--depth-paw-raised)_0_var(--color-paw-outline-variant)] active:translate-y-[calc(var(--depth-paw-raised)-var(--depth-paw-pressed))] active:[box-shadow:0_var(--depth-paw-pressed)_0_var(--color-paw-outline-variant)]"
          : elevationClasses[elevation],
        className,
      )}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-paw-lg pb-paw-sm", className)} {...props} />;
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-paw-lg", className)} {...props} />;
}
