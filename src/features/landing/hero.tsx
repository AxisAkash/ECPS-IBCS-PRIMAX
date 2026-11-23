"use client";

import { ArrowRight, Search } from "lucide-react";
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

        {/* Plan illustration on small screens (large screens show it as the background) */}
        <div className="relative lg:col-span-6">
          <div className="relative mx-auto aspect-[9/8] max-w-xl lg:hidden" aria-hidden>
            <HeroPlan className="absolute inset-0 h-full w-full rounded-xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
