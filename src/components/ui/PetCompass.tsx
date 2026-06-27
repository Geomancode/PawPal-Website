import type { ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Map,
  QrCode,
  ShieldCheck,
  Sparkles,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/ui";

type CompassTone = "primary" | "trust" | "energy" | "reward" | "neutral" | "urgent";

const toneStyles: Record<CompassTone, { chip: string; icon: string; card: string }> = {
  primary: {
    chip: "border-paw-primary/20 bg-paw-primary-soft text-paw-primary",
    icon: "bg-paw-primary-soft text-paw-primary",
    card: "border-paw-primary/20 bg-paw-primary-soft",
  },
  trust: {
    chip: "border-paw-trust/24 bg-paw-trust-soft text-paw-trust",
    icon: "bg-paw-trust-soft text-paw-trust",
    card: "border-paw-trust/24 bg-paw-trust-soft",
  },
  energy: {
    chip: "border-paw-accent/24 bg-paw-accent-soft text-paw-accent",
    icon: "bg-paw-accent-soft text-paw-accent",
    card: "border-paw-accent/24 bg-paw-accent-soft",
  },
  reward: {
    chip: "border-paw-yellow/40 bg-paw-warning-soft text-paw-ink",
    icon: "bg-paw-warning-soft text-paw-ink",
    card: "border-paw-yellow/40 bg-paw-warning-soft",
  },
  neutral: {
    chip: "border-paw-border bg-paw-panel-subtle text-paw-body",
    icon: "bg-paw-panel-subtle text-paw-body",
    card: "border-paw-border bg-paw-panel-subtle",
  },
  urgent: {
    chip: "border-paw-accent/30 bg-paw-accent-soft text-paw-accent",
    icon: "bg-paw-accent-soft text-paw-accent",
    card: "border-paw-accent/30 bg-paw-accent-soft",
  },
};

export function CompassSectionHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-sm font-extrabold text-paw-primary">
            {eyebrow}
          </p>
        )}
        <h2 className="font-brand text-3xl font-extrabold leading-tight text-paw-ink md:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-base leading-7 text-paw-body">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function CompassCard({
  children,
  tone = "neutral",
  elevated = false,
  className,
}: {
  children: ReactNode;
  tone?: CompassTone;
  elevated?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-paw-lg border bg-paw-panel text-paw-ink",
        elevated ? "shadow-paw-panel" : "shadow-none",
        tone !== "neutral" ? toneStyles[tone].card : "border-paw-border",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CompassStatusChip({
  children,
  icon: Icon,
  tone = "primary",
  className,
}: {
  children: ReactNode;
  icon?: LucideIcon;
  tone?: CompassTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-extrabold",
        toneStyles[tone].chip,
        className,
      )}
    >
      {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function CompassIconTile({
  icon: Icon,
  tone = "primary",
  className,
}: {
  icon: LucideIcon;
  tone?: CompassTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-paw-md",
        toneStyles[tone].icon,
        className,
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}

export function PetHeroCard({
  name,
  subtitle,
  status,
  avatar,
  action,
  tone = "trust",
  className,
}: {
  name: ReactNode;
  subtitle?: ReactNode;
  status?: ReactNode;
  avatar?: ReactNode;
  action?: ReactNode;
  tone?: CompassTone;
  className?: string;
}) {
  return (
    <CompassCard tone={tone} elevated className={cn("overflow-hidden p-5", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-paw-lg border border-white/70 bg-paw-panel text-2xl font-black text-paw-primary shadow-sm">
            {avatar ?? "P"}
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-brand text-2xl font-extrabold leading-8 text-paw-ink">
              {name}
            </h1>
            {subtitle && <p className="mt-1 text-sm leading-6 text-paw-body">{subtitle}</p>}
            {status && <div className="mt-2">{status}</div>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </CompassCard>
  );
}

export function SmartTagStatusCard({
  title = "Smart Tag status",
  stateLabel,
  description,
  action,
  verified = false,
  className,
}: {
  title?: ReactNode;
  stateLabel: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  verified?: boolean;
  className?: string;
}) {
  return (
    <CompassCard tone={verified ? "trust" : "primary"} elevated className={cn("p-5", className)}>
      <div className="flex items-start gap-4">
        <CompassIconTile icon={verified ? ShieldCheck : Tag} tone={verified ? "trust" : "primary"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-extrabold text-paw-ink">{title}</h3>
            <CompassStatusChip icon={verified ? CheckCircle2 : QrCode} tone={verified ? "trust" : "primary"}>
              {stateLabel}
            </CompassStatusChip>
          </div>
          {description && <p className="mt-2 text-sm leading-6 text-paw-body">{description}</p>}
          {action && <div className="mt-4 flex flex-wrap gap-3">{action}</div>}
        </div>
      </div>
    </CompassCard>
  );
}

export function CompassLoop({
  items,
  className,
}: {
  items: Array<{ title: ReactNode; description: ReactNode; icon?: LucideIcon; tone?: CompassTone }>;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 md:grid-cols-3", className)}>
      {items.map((item, index) => {
        const Icon = item.icon ?? [Tag, Map, ArrowRight][index % 3] ?? Sparkles;
        return (
          <CompassCard key={String(item.title)} className="p-4" elevated>
            <div className="flex items-start gap-3">
              <CompassIconTile icon={Icon} tone={item.tone ?? "primary"} />
              <div>
                <h3 className="text-base font-extrabold text-paw-ink">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-paw-body">{item.description}</p>
              </div>
            </div>
          </CompassCard>
        );
      })}
    </div>
  );
}

export function PairingHandoffCard({
  title = "Pair your tag in the PawPal app",
  description,
  primaryAction,
  secondaryAction,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}) {
  return (
    <CompassCard tone="primary" elevated className={cn("p-5", className)}>
      <div className="flex items-start gap-4">
        <CompassIconTile icon={QrCode} tone="primary" />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-extrabold text-paw-ink">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-paw-body">
            {description ??
              "Pairing is not complete until the app confirms it. Use QR or manual setup if NFC is unavailable."}
          </p>
          {(primaryAction || secondaryAction) && (
            <div className="mt-4 flex flex-wrap gap-3">
              {primaryAction}
              {secondaryAction}
            </div>
          )}
        </div>
      </div>
    </CompassCard>
  );
}

export function PermissionRecoveryPanel({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <CompassCard tone="energy" className={cn("p-5", className)}>
      <div className="flex items-start gap-4">
        <CompassIconTile icon={HelpCircle} tone="energy" />
        <div>
          <h3 className="text-base font-extrabold text-paw-ink">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-paw-body">{description}</p>
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </CompassCard>
  );
}
