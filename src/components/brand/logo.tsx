"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * RAJUK emblem, used as supplied (public/brand/rajuk-logo.png, 300×300, transparent background).
 * The seal's white areas are transparent in the source file, so it always sits on a white disc —
 * that keeps the emblem's colours intact on navy headers and in dark mode.
 */
export function LogoMark({ className, alt = "" }: { className?: string; alt?: string }) {
  return (
    <span className={cn("relative inline-grid size-9 shrink-0 place-items-center rounded-full bg-white shadow-[0_0_0_1px_rgb(20_38_61/0.08)]", className)}>
      <Image src="/brand/rajuk-logo.png" alt={alt} width={300} height={300} priority className="size-[94%] object-contain" />
    </span>
  );
}

export function Logo({ onDark, compact, href = "/", subtitle }: { onDark?: boolean; compact?: boolean; href?: string; subtitle?: string }) {
  const { t } = useI18n();
  return (
    <Link href={href} className="group inline-flex shrink-0 items-center gap-2.5 rounded-md">
      <LogoMark alt={compact ? t("brand.home") : ""} />
      {!compact && (
        <span className="leading-none">
          <span className={cn("block font-display text-[1.0625rem] font-extrabold tracking-[-0.01em]", onDark ? "text-white" : "text-ink-strong")}>{t("brand.name")}</span>
          <span className={cn("mt-1 block whitespace-nowrap font-mono text-[0.5625rem] uppercase tracking-[0.16em] [:lang(bn)_&]:font-sans [:lang(bn)_&]:text-[0.6875rem] [:lang(bn)_&]:tracking-normal [:lang(bn)_&]:normal-case", onDark ? "text-on-dark-muted" : "text-muted")}>
            {subtitle ?? t("brand.short")}
          </span>
        </span>
      )}
    </Link>
  );
}
