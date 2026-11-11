import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export const controlClasses = cn(
  "w-full rounded-btn border border-line bg-canvas px-4 text-ink placeholder:text-ink-muted",
  "transition-colors focus-visible:border-brand-lime focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-brand-lime",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "aria-invalid:border-danger",
);

type FieldProps = {
  id: string;
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

/** Label + control + hint/error message (UI §1.6 Input states, §15 Form Validation). */
export function Field({ id, label, error, hint, required, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink-soft">
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = ComponentProps<"input"> & { invalid?: boolean };

export function Input({ className, invalid, id, ...props }: InputProps) {
  return (
    <input
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && id ? `${id}-error` : undefined}
      className={cn(controlClasses, "h-12", className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  invalid,
  id,
  ...props
}: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && id ? `${id}-error` : undefined}
      className={cn(controlClasses, "min-h-40 py-3", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  invalid,
  id,
  ...props
}: ComponentProps<"select"> & { invalid?: boolean }) {
  return (
    <select
      id={id}
      aria-invalid={invalid || undefined}
      className={cn(controlClasses, "h-12 pr-10", className)}
      {...props}
    />
  );
}
