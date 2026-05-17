import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/ui";

type ButtonVariant = "primary" | "accent" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-paw-primary text-white hover:bg-paw-primary-hover shadow-paw-action",
  accent: "bg-paw-accent text-white hover:bg-paw-accent-hover shadow-paw-action",
  secondary:
    "bg-paw-panel text-paw-ink border border-paw-border hover:border-paw-primary/40 hover:bg-paw-primary-soft",
  ghost:
    "bg-transparent text-paw-body hover:bg-paw-panel-subtle border border-transparent",
  danger:
    "bg-paw-danger text-white hover:bg-rose-600 shadow-paw-action",
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
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paw-primary/20",
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
