import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/ui";
import Button from "./Button";

type SheetSide = "right" | "bottom";

type SheetProps = {
  open: boolean;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: SheetSide;
  ariaLabel?: string;
  onClose: () => void;
  className?: string;
  panelClassName?: string;
};

const panelBySide: Record<SheetSide, string> = {
  right: "right-0 top-0 h-full w-full max-w-md border-l",
  bottom: "bottom-0 left-0 max-h-[86vh] w-full rounded-t-paw-lg border-t",
};

export default function Sheet({
  open,
  title,
  description,
  children,
  footer,
  side = "right",
  ariaLabel,
  onClose,
  className,
  panelClassName,
}: SheetProps) {
  if (!open) return null;

  return (
    <div
      className={cn("fixed inset-0 z-50", className)}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? (typeof title === "string" ? title : undefined)}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/35 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <section
        className={cn(
          "fixed flex flex-col border-paw-border bg-paw-panel text-paw-ink shadow-paw-panel",
          panelBySide[side],
          panelClassName,
        )}
      >
        {(title || description) && (
          <header className="flex items-start justify-between gap-4 border-b border-paw-border px-5 py-4">
            <div className="min-w-0">
              {title && (
                <h2 className="text-base font-extrabold leading-6 text-paw-ink">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm leading-6 text-paw-body">
                  {description}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Close"
              onClick={onClose}
              className="-mr-2 -mt-1 shrink-0"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          </header>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <footer className="border-t border-paw-border bg-paw-panel px-5 py-4">
            {footer}
          </footer>
        )}
      </section>
    </div>
  );
}
