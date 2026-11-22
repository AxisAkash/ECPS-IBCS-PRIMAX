"use client";

import { Check, ChevronDown, Minus } from "lucide-react";
import { Checkbox as RCheckbox, RadioGroup as RRadio, Switch as RSwitch } from "radix-ui";
import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const controlBase =
  "w-full rounded-md border border-line-strong bg-surface text-sm text-ink-strong shadow-xs transition-[border-color,box-shadow] duration-150 placeholder:text-subtle hover:border-slate-ink/40 focus-visible:border-teal-600 focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-muted aria-[invalid=true]:border-danger-600 aria-[invalid=true]:focus-visible:shadow-[0_0_0_3px_rgb(184_50_42/0.2)]";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { leading?: ReactNode; trailing?: ReactNode }>(
  ({ className, leading, trailing, ...props }, ref) => {
    if (!leading && !trailing) return <input ref={ref} className={cn(controlBase, "h-10 px-3", className)} {...props} />;
    return (
      <div className="relative">
        {leading && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-subtle [&_svg]:size-4">{leading}</span>}
        <input ref={ref} className={cn(controlBase, "h-10 px-3", leading && "pl-9", trailing && "pr-10", className)} {...props} />
        {trailing && <span className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</span>}
      </div>
    );
  },
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(controlBase, "min-h-24 px-3 py-2.5 leading-relaxed", className)} {...props} />
));
Textarea.displayName = "Textarea";

/** Native select styled to match — the most robust and accessible choice for forms on all devices. */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select ref={ref} className={cn(controlBase, "h-10 appearance-none pl-3 pr-9", className)} {...props}>
      {children}
    </select>
    <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
  </div>
));
Select.displayName = "Select";

export function Label({ htmlFor, children, className, required, optional, requiredLabel = "Required", optionalLabel = "Optional" }: {
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
  optional?: boolean;
  requiredLabel?: string;
  optionalLabel?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("flex items-baseline gap-2 text-[0.8125rem] font-medium text-ink-strong", className)}>
      <span>{children}</span>
      {required && (
        <span className="text-[0.6875rem] font-normal text-danger-700">
          <span aria-hidden>*</span>
          <span className="sr-only">{requiredLabel}</span>
        </span>
      )}
      {optional && <span className="text-[0.6875rem] font-normal text-subtle">{optionalLabel}</span>}
    </label>
  );
}

/**
 * Field wrapper: label, control, hint and error with correct aria wiring.
 * The render-prop receives ids so the control can set aria-describedby / aria-invalid.
 */
export function Field({
  label,
  hint,
  error,
  required,
  optional,
  className,
  children,
  id: idProp,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
  id?: string;
  children: (a: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode;
}) {
  const auto = useId();
  const id = idProp ?? auto;
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} required={required} optional={optional}>
        {label}
      </Label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {hint && !error && (
        <p id={hintId} className="text-xs leading-relaxed text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="flex items-start gap-1.5 text-xs font-medium text-danger-700" role="alert">
          <span aria-hidden className="mt-[3px] inline-block size-1.5 shrink-0 rounded-full bg-danger-600" />
          {error}
        </p>
      )}
    </div>
  );
}

export function Checkbox({ className, indeterminate, ...props }: ComponentPropsWithoutRef<typeof RCheckbox.Root> & { indeterminate?: boolean }) {
  return (
    <RCheckbox.Root
      className={cn(
        "peer grid size-[18px] shrink-0 place-items-center rounded-[4px] border border-line-strong bg-surface shadow-xs transition-colors hover:border-teal-600 focus-visible:shadow-focus focus-visible:outline-none data-[state=checked]:border-teal-600 data-[state=checked]:bg-teal-600 data-[state=checked]:text-white data-[state=indeterminate]:border-teal-600 data-[state=indeterminate]:bg-teal-600 data-[state=indeterminate]:text-white disabled:opacity-50",
        className,
      )}
      checked={indeterminate ? "indeterminate" : props.checked}
      {...props}
    >
      <RCheckbox.Indicator>{indeterminate ? <Minus className="size-3" strokeWidth={3} /> : <Check className="size-3" strokeWidth={3} />}</RCheckbox.Indicator>
    </RCheckbox.Root>
  );
}

export const RadioGroup = RRadio.Root;

export function RadioItem({ className, ...props }: ComponentPropsWithoutRef<typeof RRadio.Item>) {
  return (
    <RRadio.Item
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-full border border-line-strong bg-surface shadow-xs transition-colors hover:border-teal-600 focus-visible:shadow-focus focus-visible:outline-none data-[state=checked]:border-teal-600",
        className,
      )}
      {...props}
    >
      <RRadio.Indicator className="size-2 rounded-full bg-teal-600" />
    </RRadio.Item>
  );
}

export function Switch({ className, ...props }: ComponentPropsWithoutRef<typeof RSwitch.Root>) {
  return (
    <RSwitch.Root
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-line-strong transition-colors focus-visible:shadow-focus focus-visible:outline-none data-[state=checked]:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RSwitch.Thumb className="pointer-events-none block size-4 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[18px]" />
    </RSwitch.Root>
  );
}

/** A labelled choice card used for radio-style selections that need descriptions. */
export function ChoiceCard({
  value,
  title,
  description,
  meta,
  icon,
}: {
  value: string;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  icon?: ReactNode;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className="group relative flex cursor-pointer gap-3 rounded-lg border border-line bg-surface p-4 transition-[border-color,box-shadow,background-color] hover:border-slate-ink/40 has-[[data-state=checked]]:border-teal-600 has-[[data-state=checked]]:bg-teal-50/60 has-[[data-state=checked]]:shadow-[inset_0_0_0_1px_var(--color-teal-600)]"
    >
      <RadioItem id={id} value={value} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <span className="flex items-center gap-2 font-medium text-ink-strong">
            {icon}
            {title}
          </span>
          {meta}
        </div>
        {description && <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted">{description}</p>}
      </div>
    </label>
  );
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: ReactNode; count?: number }>;
  label: string;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-lg border border-line bg-surface-3/70 p-0.5", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-colors",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-[0.8125rem]",
              active ? "bg-surface text-ink-strong shadow-sm" : "text-muted hover:text-ink-strong",
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={cn("tabular rounded-full px-1.5 text-[0.6875rem]", active ? "bg-teal-50 text-teal-800" : "bg-surface text-muted")}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
