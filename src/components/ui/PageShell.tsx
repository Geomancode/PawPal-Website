import type { ReactNode } from "react";
import { cn } from "@/lib/ui";

type PageShellProps = {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
};

export default function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  headerClassName,
  contentClassName,
}: PageShellProps) {
  const hasHeader = eyebrow || title || description || actions;

  return (
    <section
      className={cn("bg-paw-page py-paw-xxl text-paw-ink sm:py-paw-xxxl", className)}
    >
      <div className="mx-auto w-full max-w-7xl px-paw-md sm:px-paw-xl lg:px-paw-xxl">
        {hasHeader && (
          <div
            className={cn(
              "mb-paw-xxl flex flex-col gap-paw-md sm:mb-paw-xxxl lg:flex-row lg:items-end lg:justify-between",
              headerClassName,
            )}
          >
            <div className="max-w-2xl">
              {eyebrow && (
                <div className="mb-paw-xs text-xs font-black uppercase text-paw-on-primary-soft">
                  {eyebrow}
                </div>
              )}
              {title && (
                <h1 className="font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">
                  {title}
                </h1>
              )}
              {description && (
                <p className="mt-paw-sm text-paw-type-body text-paw-body">
                  {description}
                </p>
              )}
            </div>
            {actions && <div className="flex flex-wrap gap-paw-sm">{actions}</div>}
          </div>
        )}
        <div className={contentClassName}>{children}</div>
      </div>
    </section>
  );
}
