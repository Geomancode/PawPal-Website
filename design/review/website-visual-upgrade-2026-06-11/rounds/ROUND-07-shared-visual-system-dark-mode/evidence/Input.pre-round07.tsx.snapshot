import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/ui";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  helperText?: string;
  error?: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  containerClassName?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    helperText,
    error,
    leftSlot,
    rightSlot,
    className,
    containerClassName,
    ...props
  },
  ref,
) {
  const helperId = id && (error || helperText) ? `${id}-helper` : undefined;

  return (
    <div className={cn("block space-y-1.5", containerClassName)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-bold text-paw-ink">
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
            "h-11 w-full rounded-paw-md border border-paw-border bg-paw-panel px-3 text-sm text-paw-ink shadow-sm transition",
            "placeholder:text-paw-muted focus-visible:border-paw-trust focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paw-trust/20",
            "disabled:cursor-not-allowed disabled:opacity-60",
            leftSlot ? "pl-10" : undefined,
            rightSlot ? "pr-10" : undefined,
            error ? "border-paw-danger focus-visible:border-paw-danger focus-visible:ring-paw-danger/20" : undefined,
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
            "block text-xs leading-5",
            error ? "text-paw-danger" : "text-paw-muted",
          )}
        >
          {error || helperText}
        </span>
      )}
    </div>
  );
});

export default Input;
