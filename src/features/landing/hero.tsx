"use client";

import { ArrowRight, Clock3, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HeroPlan } from "@/components/brand/hero-plan";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function Hero() {
  const { t } = useI18n();
  const router = useRouter();
  const [ref, setRef] = useState("");

  return (
    <section aria-labelledby="hero-title" className="on-dark relative isolate overflow-hidden bg-navy-900 text-on-dark">
      <div className="bg-blueprint absolute inset-0 -z-10" aria-hidden />
      {/* Plan composition, bleeding off the right edge on large screens */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[62%] lg:block">
        <HeroPlan className="absolute inset-0 h-full w-full [&_text]:select-none" />
      </div>

      <div className="mx-auto grid max-w-[88rem] gap-12 px-4 pb-16 pt-14 sm:px-6 md:pt-20 lg:min-h-[min(46rem,calc(100dvh-6.25rem))] lg:grid-cols-12 lg:px-10 lg:pb-14 lg:pt-24">
        <div className="flex flex-col lg:col-span-6 xl:col-span-6">
          <p className="kicker !text-teal-300 animate-fade-up">{t("hero.eyebrow")}</p>
          <h1
            id="hero-title"
            className="mt-6 max-w-[17ch] animate-fade-up font-display text-[2.5rem] font-semibold leading-[1.06] tracking-[-0.03em] text-white [animation-delay:60ms] sm:text-5xl lg:text-[3.6rem]"
          >
            {t("hero.title")}
          </h1>
          <p className="mt-6 max-w-[34rem] animate-fade-up text-[1.0625rem] leading-relaxed text-on-dark-muted [animation-delay:120ms]">{t("hero.lead")}</p>

          <div className="mt-9 flex animate-fade-up flex-wrap gap-3 [animation-delay:180ms]">
            <Button asChild variant="accent" size="lg">
              <Link href="/services">
                {t("hero.cta.apply")}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline-dark" size="lg">
              <Link href="/track">{t("hero.cta.track")}</Link>
            </Button>
          </div>

          <form
            className="mt-10 max-w-md animate-fade-up [animation-delay:240ms]"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(ref.trim() ? `/track?ref=${encodeURIComponent(ref.trim().toUpperCase())}` : "/track");
            }}
          >
            <label htmlFor="hero-track" className="text-[0.8125rem] text-on-dark-muted">
              {t("hero.quicktrack")}
            </label>
            <div className="mt-2 flex rounded-lg border border-white/15 bg-white/[0.06] p-1 focus-within:border-teal-300/70">
              <Search className="ml-2.5 mt-2.5 size-4 shrink-0 text-on-dark-muted" aria-hidden />
              <input
                id="hero-track"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder={t("hero.quicktrack.placeholder")}
                className="ref min-w-0 flex-1 bg-transparent px-2.5 text-sm text-white placeholder:text-on-dark-muted/60 focus:outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              <Button type="submit" variant="outline-dark" size="sm" className="h-9 border-white/20">
                {t("hero.quicktrack.go")}
              </Button>
            </div>
          </form>

          <div className="mt-auto pt-12">
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-on-dark-muted">{t("hero.framework")}</p>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[0.8125rem] text-on-dark-muted">
              <li>BNBC 2020</li>
              <li aria-hidden className="text-white/20">
                /
              </li>
              <li>Imarat Bidhimala 2025</li>
              <li aria-hidden className="text-white/20">
                /
              </li>
              <li>DAP 2022–2035</li>
            </ul>
          </div>
        </div>

        {/* Floating sample status card */}
        <div className="relative lg:col-span-6">
          <div className="relative mx-auto aspect-[9/8] max-w-xl lg:hidden" aria-hidden>
            <HeroPlan className="absolute inset-0 h-full w-full rounded-xl" />
          </div>
          <StatusPreviewCard />
        </div>
      </div>
    </section>
  );
}

function StatusPreviewCard() {
  const { t } = useI18n();
  const stages = 9;
  const current = 3;
  return (
    <div className="absolute bottom-4 left-4 right-4 animate-fade-up [animation-delay:500ms] sm:left-auto sm:right-8 sm:w-[19.5rem] lg:bottom-[9%] lg:left-[3%] lg:right-auto">
      <div className="rounded-xl border border-white/10 bg-surface p-4 text-ink shadow-[0_24px_60px_-20px_rgb(0_0_0/0.55)]">
        <div className="flex items-center justify-between gap-2">
          <span className="ref text-xs font-medium text-ink-strong">CP-26-Z4-01491</span>
          <span className="rounded-xs border border-dashed border-line-strong px-1.5 font-mono text-[0.5625rem] uppercase tracking-wider text-subtle">Sample</span>
        </div>
        <p className="mt-2 font-display text-[0.9375rem] font-semibold text-ink-strong">{t("hero.card.title")}</p>
        <div className="mt-3 flex gap-1" aria-hidden>
          {Array.from({ length: stages }).map((_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i < current ? "bg-teal-600" : i === current ? "bg-navy-900" : "bg-surface-3"}`} />
          ))}
        </div>
        <dl className="mt-3.5 space-y-2 text-[0.8125rem]">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Current desk</dt>
            <dd className="flex items-center gap-2 font-medium text-ink-strong">
              <span aria-hidden className="relative grid size-2 place-items-center text-teal-600">
                <span className="pulse-dot relative size-2 rounded-full bg-teal-600" />
              </span>
              {t("hero.card.stage")}
            </dd>
          </div>
          <div className="flex items-center gap-2 text-muted">
            <dt className="sr-only">Time held</dt>
            <dd className="flex items-center gap-2">
              <Clock3 className="size-3.5" aria-hidden />
              {t("hero.card.held")}
            </dd>
          </div>
        </dl>
        <p className="mt-3 border-t border-line pt-3 text-xs text-muted">{t("hero.card.next")}</p>
      </div>
    </div>
  );
}
