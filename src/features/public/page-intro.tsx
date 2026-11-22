import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/display";
import { cn } from "@/lib/utils";

export function PageIntro({
  kicker,
  title,
  lead,
  breadcrumbs,
  children,
  dark,
  className,
}: {
  kicker: string;
  title: string;
  lead?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  children?: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <section className={cn("relative border-b", dark ? "on-dark border-navy-950 bg-navy-900 text-on-dark" : "border-line bg-surface", className)}>
      <div aria-hidden className={cn("absolute inset-0", dark ? "bg-blueprint" : "bg-drafting opacity-70")} />
      <div className="relative mx-auto max-w-[88rem] px-4 pb-12 pt-10 sm:px-6 lg:px-10 lg:pb-16 lg:pt-12">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} className={cn("mb-8", dark && "[&_a]:text-on-dark-muted [&_span]:text-on-dark-muted [&_[aria-current]]:text-white")} />}
        <p className={cn("kicker", dark && "!text-teal-300")}>{kicker}</p>
        <h1 className={cn("mt-4 max-w-3xl font-display text-[2.25rem] font-semibold leading-[1.1] tracking-[-0.025em] md:text-5xl", dark ? "text-white" : "text-ink-strong")}>{title}</h1>
        {lead && <p className={cn("mt-4 max-w-2xl text-[1.0625rem] leading-relaxed", dark ? "text-on-dark-muted" : "text-muted")}>{lead}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto max-w-[88rem] px-4 py-12 sm:px-6 lg:px-10 lg:py-16", className)}>{children}</div>;
}
