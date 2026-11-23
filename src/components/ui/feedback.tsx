import { AlertTriangle, CheckCircle2, Info, OctagonAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <svg className={cn("size-5 animate-spin", className)} viewBox="0 0 24 24" fill="none" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-surface-3", className)} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-4 w-96 max-w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

const CALLOUT = {
  info: { icon: Info, cls: "border-teal-600/25 bg-teal-50 text-teal-800", iconCls: "text-teal-700" },
  success: { icon: CheckCircle2, cls: "border-success-600/25 bg-success-100/70 text-success-700", iconCls: "text-success-700" },
  warning: { icon: AlertTriangle, cls: "border-amber-500/40 bg-amber-50 text-amber-700", iconCls: "text-amber-700" },
  danger: { icon: OctagonAlert, cls: "border-danger-600/25 bg-danger-100/70 text-danger-700", iconCls: "text-danger-700" },
  demo: { icon: Info, cls: "border-dashed border-slate-ink/30 bg-surface-2 text-muted", iconCls: "text-slate-ink" },
} as const;

export function Callout({
  tone = "info",
  title,
  children,
  icon,
  className,
  action,
}: {
  tone?: keyof typeof CALLOUT;
  title?: ReactNode;
  children?: ReactNode;
  icon?: LucideIcon;
  className?: string;
  action?: ReactNode;
}) {
  const c = CALLOUT[tone];
  const Icon = icon ?? c.icon;
  return (
    <div role={tone === "danger" ? "alert" : undefined} className={cn("flex gap-3 rounded-lg border px-4 py-3 text-sm", c.cls, className)}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", c.iconCls)} aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-relaxed [&_a]:font-medium [&_a]:underline">{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}

/** Explicit label for demonstration-only behaviour. */
export function SimulatedTag({ children = "Simulated", className }: { children?: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-xs border border-dashed border-slate-ink/40 px-1.5 py-px font-mono text-[0.625rem] uppercase tracking-wider text-slate-ink", className)}>
      {children}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-surface-2/60 px-6 py-12 text-center", className)}>
      {Icon && (
        <div className="mb-4 grid size-12 place-items-center rounded-full border border-line bg-surface text-slate-ink">
          <Icon className="size-5" aria-hidden />
        </div>
      )}
      <p className="font-display text-base font-semibold text-ink-strong">{title}</p>
      {body && <p className="mt-1.5 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ProgressBar({ value, className, tone = "teal", label }: { value: number; className?: string; tone?: "teal" | "amber" | "navy" | "success"; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const fill = { teal: "bg-teal-600", amber: "bg-amber-500", navy: "bg-emphasis", success: "bg-success-600" }[tone];
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-3", className)}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out", fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}
