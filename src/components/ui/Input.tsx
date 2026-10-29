import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/ui";

export type InputVariant = "field" | "search" | "command" | "compact";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  helperText?: string;
  error?: string;
  variant?: InputVariant;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  containerClassName?: string;
};

const variants: Record<InputVariant, string> = {
  field: "min-h-paw-min-tap rounded-paw-card px-paw-sm text-paw-type-body shadow-paw-control",
  search: "h-12 rounded-paw-card px-paw-md text-paw-type-body shadow-paw-control",
  command: "h-12 rounded-paw-panel px-paw-md text-paw-type-body shadow-paw-panel",
  compact: "min-h-10 rounded-paw-sm px-paw-sm text-paw-type-body shadow-none",
};

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id: providedId,
    label,
    helperText,
    error,
    variant = "field",
    leftSlot,
    rightSlot,
    className,
    containerClassName,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const helperId = error || helperText ? `${id}-helper` : undefined;

  return (
    <div className={cn("block space-y-1.5", containerClassName)}>
      {label && (
        <label htmlFor={id} className="block text-paw-type-caption font-bold text-paw-ink">
          {label}
        </label>
      )}
      <span className="relative block">
        {leftSlot && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-paw-muted">
            {leftSlot}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={helperId}
          className={cn(
            "w-full border border-paw-outline-variant bg-paw-panel-low text-paw-ink transition duration-paw-fast",
            variants[variant],
            "placeholder:text-paw-muted focus-visible:border-paw-trust focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paw-trust/20",
            "disabled:cursor-not-allowed disabled:opacity-60",
            leftSlot ? "pl-10" : undefined,
            rightSlot ? "pr-10" : undefined,
            error
              ? "border-paw-critical focus-visible:border-paw-critical focus-visible:ring-paw-critical/20"
              : undefined,
            className,
          )}
          {...props}
        />
        {rightSlot && (
          <span className="absolute inset-y-0 right-3 flex items-center text-paw-muted">
            {rightSlot}
          </span>
        )}
      </span>
      {(error || helperText) && (
        <span
          id={helperId}
          className={cn(
            "block text-paw-type-caption leading-5",
            error ? "text-paw-on-critical-soft" : "text-paw-muted",
          )}
        >
          {error || helperText}
        </span>
      )}
    </div>
  );
});

export default Input;
