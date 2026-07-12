import type { ReactNode } from "react";
import {
  AlertCircle,
  Inbox,
  Radio,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/ui";
import type { StatusTone } from "./StatusMessage";

export type StatePanelState = "loading" | "empty" | "error";
export type StatePanelLayout = "fullscreen" | "embedded";

export type StatePanelProps = {
  state: StatePanelState;
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  illustration?: ReactNode;
  tone?: StatusTone;
  layout?: StatePanelLayout;
  titleLevel?: 1 | 2 | 3;
  className?: string;
};

const defaultIcons: Record<StatePanelState, LucideIcon> = {
  loading: Radio,
  empty: Inbox,
  error: AlertCircle,
};

const toneStyles: Record<StatusTone, { panel: string; icon: string }> = {
  info: {
    panel: "border-paw-primary/20 bg-paw-primary-soft text-paw-on-primary-soft",
    icon: "bg-paw-primary text-paw-on-primary",
  },
  success: {
    panel: "border-paw-success/20 bg-paw-success-soft text-paw-on-success-soft",
    icon: "bg-paw-success text-paw-on-success",
  },
  warning: {
    panel: "border-paw-warning/20 bg-paw-warning-soft text-paw-on-warning-soft",
    icon: "bg-paw-warning text-paw-on-warning",
  },
  critical: {
    panel: "border-paw-critical/20 bg-paw-critical-soft text-paw-on-critical-soft",
    icon: "bg-paw-critical text-paw-on-critical",
  },
};

export default function StatePanel({
  state,
  title,
  body,
  action,
  icon,
  illustration,
  tone = state === "error" ? "critical" : "info",
  layout = "fullscreen",
  titleLevel = layout === "fullscreen" ? 1 : 2,
  className,
}: StatePanelProps) {
  const DefaultIcon = defaultIcons[state];
  const role = state === "error" ? "alert" : state === "loading" ? "status" : undefined;
  const visual = illustration ?? icon ?? (
    <DefaultIcon
      className={cn("h-6 w-6", state === "loading" ? "animate-pulse" : undefined)}
      aria-hidden="true"
    />
  );
  const Title = `h${titleLevel}` as "h1" | "h2" | "h3";

  const panel = state === "loading" ? (
    <div className="loading-panel" data-state-panel-surface="loading">
      <div className="loading-panel-mark">{visual}</div>
      <p className="mt-5 text-sm font-black uppercase tracking-[0.16em] text-paw-primary">
        {title}
      </p>
      {body && <div className="mt-paw-sm text-sm leading-6 text-paw-body">{body}</div>}
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-paw-primary-soft" aria-hidden="true">
        <div className="globe-loading-bar h-full rounded-full" />
      </div>
      {action && <div className="mt-paw-lg">{action}</div>}
    </div>
  ) : (
    <div
      className={cn(
        "mx-auto flex w-full max-w-xl flex-col items-center rounded-paw-xl border px-paw-lg py-paw-xxl text-center shadow-paw-panel sm:px-paw-xl",
        toneStyles[tone].panel,
      )}
      data-state-panel-surface={state}
    >
      {illustration ? (
        <div className="max-w-full" data-state-panel-illustration="true">{illustration}</div>
      ) : (
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-paw-card",
            toneStyles[tone].icon,
          )}
        >
          {visual}
        </div>
      )}
      <Title className="mt-paw-md font-brand text-paw-type-h2 font-black text-inherit">
        {title}
      </Title>
      {body && <div className="mt-paw-sm max-w-md text-sm leading-6 text-inherit">{body}</div>}
      {action && <div className="mt-paw-lg">{action}</div>}
    </div>
  );

  return (
    <section
      className={cn(
        layout === "fullscreen"
          ? "deep-page-shell flex min-h-[100dvh] items-center justify-center bg-paw-page px-5 py-28 text-paw-ink"
          : "w-full",
        className,
      )}
      role={role}
      aria-busy={state === "loading" ? true : undefined}
      data-state-panel-state={state}
      data-state-panel-layout={layout}
      data-state-panel-tone={tone}
    >
      {panel}
    </section>
  );
}
