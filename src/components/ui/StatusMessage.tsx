import type { HTMLAttributes, ReactNode } from "react";
import PawIcon, { type PawIconName } from "@/components/icons/PawIcon";
import { cn } from "@/lib/ui";

export type StatusTone = "info" | "success" | "warning" | "critical";
export type StatusVariant = "compact" | "panel" | "hero";

const toneStyles: Record<
  StatusTone,
  { container: string; icon: string; iconName: PawIconName }
> = {
  info: {
    container:
      "border-paw-primary/20 bg-paw-primary-soft text-paw-on-primary-soft",
    icon: "bg-paw-primary text-paw-on-primary",
    iconName: "info",
  },
  success: {
    container:
      "border-paw-success/20 bg-paw-success-soft text-paw-on-success-soft",
    icon: "bg-paw-success text-paw-on-success",
    iconName: "success",
  },
  warning: {
    container: "border-paw-warning/20 bg-paw-warning-soft text-paw-on-warning-soft",
    icon: "bg-paw-warning text-paw-on-warning",
    iconName: "warning",
  },
  critical: {
    container: "border-paw-critical/20 bg-paw-critical-soft text-paw-on-critical-soft",
    icon: "bg-paw-critical text-paw-on-critical",
    iconName: "critical",
  },
};

type StatusMessageProps = HTMLAttributes<HTMLDivElement> & {
  tone?: StatusTone;
  variant?: StatusVariant;
  title?: ReactNode;
  children: ReactNode;
};

const variantStyles: Record<StatusVariant, { container: string; icon: string }> = {
  compact: {
    container: "rounded-paw-card p-paw-sm text-paw-type-body shadow-none",
    icon: "h-9 w-9 rounded-paw-sm",
  },
  panel: {
    container: "rounded-paw-panel p-paw-md text-paw-type-body shadow-paw-panel",
    icon: "h-paw-min-tap w-paw-min-tap rounded-paw-card",
  },
  hero: {
    container: "rounded-paw-xl p-paw-lg text-paw-type-body shadow-paw-panel",
    icon: "h-12 w-12 rounded-paw-card",
  },
};

export default function StatusMessage({
  tone = "info",
  variant = "panel",
  title,
  children,
  className,
  ...props
}: StatusMessageProps) {
  const styles = toneStyles[tone];
  const variantStyle = variantStyles[variant];
  const iconName = styles.iconName;

  return (
    <div
      className={cn(
        "flex gap-paw-sm border",
        variantStyle.container,
        styles.container,
        className,
      )}
      role={tone === "critical" ? "alert" : "status"}
      {...props}
    >
      <span
        className={cn(
          "mt-0.5 flex shrink-0 items-center justify-center",
          variantStyle.icon,
          styles.icon,
        )}
      >
        <PawIcon name={iconName} className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        {title && (
          <span className="block font-extrabold text-inherit">{title}</span>
        )}
        <span className={cn("block", title ? "mt-0.5" : undefined)}>
          {children}
        </span>
      </span>
    </div>
  );
}
