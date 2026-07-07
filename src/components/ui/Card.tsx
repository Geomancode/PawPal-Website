import type { HTMLAttributes } from "react";
import { cn } from "@/lib/ui";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const interactive = typeof props.onClick === "function";

  return (
    <div
      className={cn(
        "rounded-paw-next-card border border-paw-outline-variant bg-paw-panel-low text-paw-ink",
        interactive
          ? "cursor-pointer transition-[border-color,box-shadow,transform] duration-paw-fast ease-out [box-shadow:0_var(--depth-paw-raised)_0_var(--color-paw-outline-variant)] active:translate-y-[calc(var(--depth-paw-raised)-var(--depth-paw-pressed))] active:[box-shadow:0_var(--depth-paw-pressed)_0_var(--color-paw-outline-variant)]"
          : "shadow-paw-strong",
        className,
      )}
      {...props}
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
