"use client";

import { Check, ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Tone } from "@/lib/domain/workflow";
import { useI18n } from "@/lib/i18n";
import { cn, initials } from "@/lib/utils";

/* ———————————————————————————— Badge ———————————————————————————— */

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-3 text-slate-ink ring-line-strong/70",
  info: "bg-teal-50 text-teal-800 ring-teal-600/20",
  progress: "bg-teal-50 text-teal-800 ring-teal-600/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-500/35",
  danger: "bg-danger-100 text-danger-700 ring-danger-600/20",
  success: "bg-success-100 text-success-700 ring-success-600/20",
  accent: "bg-accent-100 text-accent-700 ring-accent-700/15",
};
const DOTS: Record<Tone, string> = {
  neutral: "border border-slate-ink/50 bg-transparent",
  info: "bg-teal-600",
  progress: "bg-teal-600 [clip-path:inset(0_50%_0_0)] ring-1 ring-teal-600 ring-inset",
  warning: "bg-amber-600 rotate-45 rounded-none",
  danger: "bg-danger-600 rounded-[1px]",
  success: "bg-success-600",
  accent: "bg-accent-700",
};

/** Status badge: colour plus a distinct dot shape so status is never conveyed by colour alone. */
export function Badge({ tone = "neutral", children, className, dot = true, icon: Icon }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean; icon?: LucideIcon }) {
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-medium ring-1 ring-inset", TONES[tone], className)}>
      {Icon ? <Icon className="size-3.5" aria-hidden /> : dot && <span aria-hidden className={cn("inline-block size-1.5 rounded-full", DOTS[tone])} />}
      {children}
    </span>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex h-5 items-center rounded-xs bg-surface-3 px-1.5 font-mono text-[0.6875rem] font-medium tracking-wide text-slate-ink", className)}>{children}</span>;
}

/* ———————————————————————————— Panel ———————————————————————————— */

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  kicker,
  id,
  as: As = "section",
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  kicker?: ReactNode;
  id?: string;
  as?: "section" | "div" | "article" | "aside";
}) {
  return (
    <As id={id} aria-labelledby={title && id ? `${id}-title` : undefined} className={cn("rounded-xl border border-line bg-surface shadow-xs", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {kicker && <div className="kicker mb-1">{kicker}</div>}
            {title && (
              <h2 id={id ? `${id}-title` : undefined} className="font-display text-[0.9375rem] font-semibold text-ink-strong">
                {title}
              </h2>
            )}
            {description && <p className="mt-0.5 text-[0.8125rem] text-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </As>
  );
}

/* ———————————————————————————— Page header & breadcrumbs ———————————————————————————— */

export function Breadcrumbs({ items, className }: { items: Array<{ label: string; href?: string }>; className?: string }) {
  const { t } = useI18n();
  return (
    <nav aria-label={t("ui.breadcrumb")} className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-[0.8125rem] text-muted">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight aria-hidden className="size-3.5 text-subtle" />}
            {it.href && i < items.length - 1 ? (
              <Link href={it.href} className="rounded hover:text-ink-strong hover:underline">
                {it.label}
              </Link>
            ) : (
              <span aria-current={i === items.length - 1 ? "page" : undefined} className={i === items.length - 1 ? "text-ink" : undefined}>
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  kicker,
  meta,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  kicker?: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 space-y-3", className)}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          {kicker && <div className="kicker mb-2">{kicker}</div>}
          <h1 className="font-display text-2xl font-semibold tracking-[-0.015em] text-ink-strong md:text-[1.75rem]">{title}</h1>
          {description && <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">{description}</p>}
          {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/* ———————————————————————————— Avatar ———————————————————————————— */

const AVATAR_TINTS = ["bg-teal-100 text-teal-800", "bg-amber-100 text-amber-700", "bg-accent-100 text-accent-700", "bg-surface-3 text-slate-ink", "bg-success-100 text-success-700"];

export function Avatar({ name, size = "md", className }: { name: string; size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  const tint = AVATAR_TINTS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATAR_TINTS.length];
  const s = { xs: "size-6 text-[0.625rem]", sm: "size-7 text-[0.6875rem]", md: "size-9 text-xs", lg: "size-12 text-sm" }[size];
  return (
    <span aria-hidden className={cn("inline-grid shrink-0 place-items-center rounded-full font-semibold", tint, s, className)}>
      {initials(name)}
    </span>
  );
}

/* ———————————————————————————— Definition list ———————————————————————————— */

export function KeyValues({ items, columns = 2, className }: { items: Array<{ k: ReactNode; v: ReactNode; mono?: boolean; full?: boolean }>; columns?: 1 | 2 | 3; className?: string }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-4", columns === 1 ? "grid-cols-1" : columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((it, i) => (
        <div key={i} className={cn("min-w-0", it.full && "sm:col-span-full")}>
          <dt className="text-xs text-muted">{it.k}</dt>
          <dd className={cn("mt-0.5 text-sm text-ink-strong", it.mono && "ref")}>{it.v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ———————————————————————————— Metric ———————————————————————————— */

export function Metric({ label, value, hint, tone, icon: Icon, href, className }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "danger" | "warning" | "success"; icon?: LucideIcon; href?: string; className?: string }) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.8125rem] text-muted">{label}</span>
        {Icon && <Icon aria-hidden className={cn("size-4", tone === "danger" ? "text-danger-700" : tone === "warning" ? "text-amber-700" : tone === "success" ? "text-success-700" : "text-subtle")} />}
      </div>
      <div className={cn("tabular mt-2 font-display text-[1.75rem] font-semibold leading-none tracking-tight", tone === "danger" ? "text-danger-700" : "text-ink-strong")}>{value}</div>
      {hint && <div className="mt-2 text-xs text-muted">{hint}</div>}
    </>
  );
  const cls = cn("block rounded-xl border border-line bg-surface p-4 shadow-xs", href && "transition-colors hover:border-slate-ink/30", className);
  return href ? (
    <Link href={href} className={cls}>
      {content}
    </Link>
  ) : (
    <div className={cls}>{content}</div>
  );
}

/* ———————————————————————————— Timeline ———————————————————————————— */

export interface TimelineItem {
  id: string;
  title: ReactNode;
  meta?: ReactNode;
  body?: ReactNode;
  tone?: "default" | "current" | "success" | "warning" | "danger" | "muted";
  icon?: LucideIcon;
}

export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn("relative", className)}>
      {items.map((it, i) => {
        const Icon = it.icon;
        const tone = it.tone ?? "default";
        return (
          <li key={it.id} className="relative flex gap-3.5 pb-5 last:pb-0">
            {i < items.length - 1 && <span aria-hidden className="absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-px bg-line" />}
            <span
              aria-hidden
              className={cn(
                "relative z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border bg-surface [&_svg]:size-3",
                tone === "current" && "border-teal-600 bg-teal-600 text-white",
                tone === "success" && "border-success-600/40 bg-success-100 text-success-700",
                tone === "warning" && "border-amber-500/50 bg-amber-50 text-amber-700",
                tone === "danger" && "border-danger-600/40 bg-danger-100 text-danger-700",
                tone === "default" && "border-line-strong text-slate-ink",
                tone === "muted" && "border-dashed border-line-strong text-subtle",
              )}
            >
              {Icon ? <Icon /> : <span className="size-1.5 rounded-full bg-current" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-sm font-medium text-ink-strong">{it.title}</p>
                {it.meta && <p className="text-xs text-muted">{it.meta}</p>}
              </div>
              {it.body && <div className="mt-1 text-[0.8125rem] leading-relaxed text-muted">{it.body}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ———————————————————————————— Stepper ———————————————————————————— */

export function Stepper({
  steps,
  current,
  onSelect,
  orientation = "vertical",
  className,
}: {
  steps: Array<{ id: string; label: string; state: "complete" | "current" | "upcoming" | "error"; hint?: string }>;
  current: number;
  onSelect?: (i: number) => void;
  orientation?: "vertical" | "horizontal";
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <ol className={cn(orientation === "vertical" ? "space-y-0.5" : "flex items-center gap-2 overflow-x-auto", className)} aria-label={t("ui.progress")}>
      {steps.map((s, i) => {
        const clickable = onSelect && s.state !== "upcoming";
        const inner = (
          <>
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full border text-[0.6875rem] font-semibold tabular",
                s.state === "complete" && "border-teal-600 bg-teal-600 text-white",
                s.state === "current" && "border-emphasis bg-emphasis text-white",
                s.state === "upcoming" && "border-line-strong bg-surface text-muted",
                s.state === "error" && "border-amber-500 bg-amber-50 text-amber-700",
              )}
            >
              {s.state === "complete" ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span className="min-w-0 text-left">
              <span className={cn("block truncate text-[0.8125rem]", s.state === "current" ? "font-semibold text-ink-strong" : s.state === "upcoming" ? "text-muted" : "text-ink")}>{s.label}</span>
              {s.hint && orientation === "vertical" && <span className={cn("block text-[0.6875rem]", s.state === "error" ? "text-amber-700" : "text-subtle")}>{s.hint}</span>}
            </span>
          </>
        );
        return (
          <li key={s.id} aria-current={i === current ? "step" : undefined}>
            {clickable ? (
              <button type="button" onClick={() => onSelect!(i)} className={cn("flex w-full items-center gap-3 rounded-md px-2.5 py-2 transition-colors hover:bg-surface-3", i === current && "bg-surface-3")}>
                {inner}
              </button>
            ) : (
              <div className={cn("flex items-center gap-3 rounded-md px-2.5 py-2", i === current && "bg-surface-3")}>{inner}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-subtle">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
