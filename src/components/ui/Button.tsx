import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/ui";

export type ButtonVariant =
  | "primary"
  | "energy"
  | "green"
  | "trust"
  | "accent"
  | "coral"
  | "neutral"
  | "secondary"
  | "ghost"
  | "text"
  | "critical";
export type ButtonSize = "sm" | "md" | "lg" | "icon";
export type ButtonShape = "control" | "compact" | "pill" | "circle";

const tactileDepth =
  "[box-shadow:0_var(--depth-paw-raised)_0_var(--paw-button-depth-color)] active:translate-y-[calc(var(--depth-paw-raised)-var(--depth-paw-pressed))] active:[box-shadow:0_var(--depth-paw-pressed)_0_var(--paw-button-depth-color)]";

const variants: Record<ButtonVariant, string> = {
  primary:
    `border-transparent bg-paw-primary text-paw-on-primary hover:bg-paw-primary-hover [--paw-button-depth-color:var(--color-paw-primary-hover)] ${tactileDepth}`,
  energy:
    `border-transparent bg-paw-accent text-paw-on-accent hover:bg-paw-accent-hover [--paw-button-depth-color:var(--color-paw-accent-hover)] ${tactileDepth}`,
  green:
    `border-transparent bg-paw-green text-paw-on-green hover:bg-paw-green/90 [--paw-button-depth-color:var(--color-paw-green)] ${tactileDepth}`,
  trust:
    `border-transparent bg-paw-trust text-paw-on-trust hover:bg-paw-trust-hover [--paw-button-depth-color:var(--color-paw-trust-hover)] ${tactileDepth}`,
  accent:
    `border-transparent bg-paw-accent text-paw-on-accent hover:bg-paw-accent-hover [--paw-button-depth-color:var(--color-paw-accent-hover)] ${tactileDepth}`,
  coral:
    `border-transparent bg-paw-coral text-paw-on-coral hover:bg-paw-accent-hover [--paw-button-depth-color:var(--color-paw-accent-hover)] ${tactileDepth}`,
  neutral:
    "border-paw-outline-variant bg-paw-panel-low text-paw-ink shadow-paw-control hover:border-paw-primary/40 hover:bg-paw-primary-soft active:translate-y-px active:shadow-none",
  secondary:
    "border-paw-outline-variant bg-paw-panel-low text-paw-ink shadow-paw-control hover:border-paw-primary/40 hover:bg-paw-primary-soft active:translate-y-px active:shadow-none",
  ghost:
    "border-transparent bg-transparent text-paw-body shadow-none hover:bg-paw-panel-subtle active:translate-y-px",
  text:
    "border-transparent bg-transparent px-0 text-paw-primary shadow-none hover:text-paw-primary-hover active:translate-y-px",
  critical:
    `border-transparent bg-paw-critical text-paw-on-critical hover:bg-paw-critical/90 [--paw-button-depth-color:var(--color-paw-critical)] ${tactileDepth}`,
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-paw-min-tap px-paw-sm py-paw-xs text-sm",
  md: "min-h-[calc(var(--spacing-paw-xl)+var(--spacing-paw-xl)+var(--spacing-paw-xxs))] px-paw-lg py-paw-sm text-sm",
  lg: "min-h-[calc(var(--spacing-paw-xl)+var(--spacing-paw-xl)+var(--spacing-paw-xs))] px-paw-xl py-paw-sm text-base",
  icon: "h-paw-min-tap w-paw-min-tap p-0",
};

const shapes: Record<ButtonShape, string> = {
  control: "rounded-paw-card",
  compact: "rounded-paw-sm",
  pill: "rounded-paw-pill",
  circle: "rounded-paw-pill",
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  shape = "control",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-paw-xs border font-black leading-none",
    shapes[shape],
    "transition-[background-color,border-color,color,box-shadow,transform] duration-paw-fast ease-out will-change-transform",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paw-trust/20",
    "disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50 disabled:[box-shadow:none]",
    variants[variant],
    sizes[size],
    className,
  );
}

export default function Button({
  variant = "primary",
  size = "md",
  shape = "control",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
}) {
  return (
    <button
      className={buttonClassName({ variant, size, shape, className })}
      {...props}
    />
  );
}
