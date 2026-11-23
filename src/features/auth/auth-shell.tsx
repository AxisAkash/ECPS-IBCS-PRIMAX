"use client";

import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { HeroPlan } from "@/components/brand/hero-plan";
import { Logo } from "@/components/brand/logo";
import { LanguageToggle, ThemeToggle } from "@/components/layout/public-header";
import { DemoToggle } from "@/features/demo/demo-tools";
import { useI18n } from "@/lib/i18n";

export function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="grid min-h-dvh lg:items-start lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Identity panel */}
      <aside className="on-dark relative hidden overflow-hidden bg-navy-900 text-on-dark lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <div className="bg-blueprint absolute inset-0" aria-hidden />
        <div aria-hidden className="absolute -right-16 -top-10 h-[78%] w-[125%] opacity-95">
          <HeroPlan className="h-full w-full" />
        </div>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy-900 from-35% via-navy-900/75 to-navy-900/10" />
        <div className="relative flex flex-1 flex-col p-10 xl:p-14">
          <Logo onDark />
          <div className="mt-auto max-w-md pb-6">
            <p className="kicker !text-teal-300">{t("brand.full")}</p>
            <h2 className="mt-5 font-display text-[2rem] font-semibold leading-[1.15] tracking-[-0.02em] text-white">{t("auth.side.title")}</h2>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-on-dark-muted">{t("auth.side.body")}</p>
            <ul className="mt-8 space-y-3 text-sm">
              {(["auth.side.point1", "auth.side.point2", "auth.side.point3"] as const).map((k) => (
                <li key={k} className="flex items-center gap-3">
                  <span className="grid size-5 place-items-center rounded-full bg-teal-600/25 text-teal-300">
                    <Check className="size-3" strokeWidth={3} aria-hidden />
                  </span>
                  {t(k)}
                </li>
              ))}
            </ul>
          </div>
          <p className="relative flex items-center gap-2 border-t border-white/10 pt-5 text-xs text-on-dark-muted">
            <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
            {t("proto.badge")} · {t("proto.label")}
          </p>
        </div>
      </aside>

      {/* Form column */}
      <div className="flex min-h-dvh flex-col bg-surface">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3 lg:border-0 lg:px-10 lg:pt-6">
          <div className="lg:hidden">
            <span className="sm:hidden">
              <Logo compact />
            </span>
            <span className="hidden sm:inline">
              <Logo />
            </span>
          </div>
          <Link href="/" className="hidden items-center gap-1.5 rounded text-sm text-muted hover:text-ink-strong lg:inline-flex">
            <ArrowLeft className="size-4" aria-hidden />
            {t("auth.back")}
          </Link>
          <div className="flex items-center gap-1">
            <DemoToggle compact className="mr-1" />
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
        <main id="main" className="flex flex-1 items-start justify-center px-5 py-10 sm:px-8 lg:items-center lg:px-10">
          <div className="w-full max-w-[30rem]">{children}</div>
        </main>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-xs text-muted lg:px-10">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-teal-700" aria-hidden />
            {t("auth.secure")}
          </span>
          <Link href="/" className="hover:text-ink-strong lg:hidden">
            {t("auth.back")}
          </Link>
        </footer>
      </div>
    </div>
  );
}
