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
    <section className={cn("bg-paw-page py-10 text-paw-ink sm:py-14", className)}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {hasHeader && (
          <div
            className={cn(
              "mb-8 flex flex-col gap-4 sm:mb-10 lg:flex-row lg:items-end lg:justify-between",
              headerClassName,
            )}
          >
            <div className="max-w-2xl">
              {eyebrow && (
                <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-paw-primary">
                  {eyebrow}
                </div>
              )}
              {title && (
                <h1 className="font-brand text-3xl font-extrabold leading-tight text-paw-ink sm:text-4xl">
                  {title}
                </h1>
              )}
              {description && (
                <p className="mt-3 text-base leading-7 text-paw-body">
                  {description}
                </p>
              )}
            </div>
            {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
          </div>
        )}
        <div className={contentClassName}>{children}</div>
      </div>
    </section>
  );
}
