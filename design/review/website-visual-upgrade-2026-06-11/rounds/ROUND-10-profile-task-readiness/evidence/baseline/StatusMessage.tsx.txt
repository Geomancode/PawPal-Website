import type { HTMLAttributes, ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/ui";

type StatusTone = "info" | "success" | "warning" | "danger";

const toneStyles: Record<
  StatusTone,
  { container: string; icon: string; Icon: LucideIcon }
> = {
  info: {
    container: "border-paw-primary/20 bg-paw-primary-soft text-paw-body",
    icon: "bg-paw-primary text-white",
    Icon: Info,
  },
  success: {
    container: "border-paw-success/20 bg-paw-success-soft text-paw-body",
    icon: "bg-paw-success text-white",
    Icon: CheckCircle2,
  },
  warning: {
    container: "border-paw-warning/20 bg-paw-warning-soft text-paw-body",
    icon: "bg-paw-warning text-white",
    Icon: TriangleAlert,
  },
  danger: {
    container: "border-paw-danger/20 bg-paw-danger-soft text-paw-body",
    icon: "bg-paw-danger text-white",
    Icon: AlertCircle,
  },
};

type StatusMessageProps = HTMLAttributes<HTMLDivElement> & {
  tone?: StatusTone;
  title?: ReactNode;
  children: ReactNode;
};

export default function StatusMessage({
  tone = "info",
  title,
  children,
  className,
  ...props
}: StatusMessageProps) {
  const styles = toneStyles[tone];
  const Icon = styles.Icon;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-paw-md border p-4 text-sm leading-6",
        styles.container,
        className,
      )}
      role={tone === "danger" ? "alert" : "status"}
      {...props}
    >
      <span
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-paw-sm",
          styles.icon,
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        {title && (
          <span className="block font-extrabold text-paw-ink">{title}</span>
        )}
        <span className={cn("block", title ? "mt-0.5" : undefined)}>
          {children}
        </span>
      </span>
    </div>
  );
}
