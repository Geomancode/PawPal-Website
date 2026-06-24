import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/ui";

type ButtonVariant =
  | "primary"
  | "trust"
  | "accent"
  | "secondary"
  | "ghost"
  | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-b-4 border-paw-primary-contrast bg-paw-primary text-white shadow-paw-action hover:bg-paw-primary-hover active:translate-y-1 active:border-b-2 active:shadow-none",
  trust:
    "border-b-4 border-paw-trust-hover bg-paw-trust text-white shadow-paw-trust-action hover:bg-paw-trust-hover active:translate-y-1 active:border-b-2 active:shadow-none",
  accent:
    "border-b-4 border-paw-accent-hover bg-paw-accent text-white shadow-paw-action hover:bg-paw-accent-hover active:translate-y-1 active:border-b-2 active:shadow-none",
  secondary:
    "border border-b-4 border-paw-border border-b-paw-border-strong bg-paw-panel text-paw-ink hover:border-paw-primary/40 hover:bg-paw-primary-soft active:translate-y-0.5 active:border-b-2",
  ghost:
    "bg-transparent text-paw-body hover:bg-paw-panel-subtle border border-transparent",
  danger:
    "border-b-4 border-paw-danger-hover bg-paw-danger text-white shadow-paw-action hover:bg-paw-danger-hover active:translate-y-1 active:border-b-2 active:shadow-none",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
  icon: "h-10 w-10 p-0",
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-paw-md font-bold transition duration-200",
    "transition-[transform,background-color,border-color,box-shadow,color]",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paw-trust/20",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export default function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={buttonClassName({ variant, size, className })}
      {...props}
    />
  );
}
