"use client";

import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ClipboardList,
  FileSearch,
  LifeBuoy,
  MapPinned,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { SERVICE_ICON } from "@/components/domain/status";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/feedback";
import { Accordion } from "@/components/ui/overlay";
import { PUBLIC_PERMITS } from "@/lib/data/seed";
import { SERVICES, type ServiceDefinition } from "@/lib/domain/catalog";
import type { ServiceType } from "@/lib/domain/types";
import { flowFor, STAGE_LABEL } from "@/lib/domain/workflow";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { useDemoStore } from "@/lib/store/demo-store";
import { cn, formatDate } from "@/lib/utils";

export function Section({ id, children, className, tone = "light", pattern }: { id?: string; children: ReactNode; className?: string; tone?: "light" | "white" | "dark"; pattern?: "blueprint" | "drafting" }) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={cn(
        "relative",
        tone === "white" && "bg-surface",
        tone === "dark" && "on-dark bg-navy-900 text-on-dark",
        tone === "light" && "bg-canvas",
        className,
      )}
    >
      {pattern && <div aria-hidden className={cn("pointer-events-none absolute inset-0", pattern === "blueprint" ? "bg-blueprint" : "bg-drafting")} />}
      <div className="relative mx-auto max-w-[88rem] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">{children}</div>
    </section>
  );
}

export function SectionHeading({ id, kicker, title, lead, dark, className }: { id?: string; kicker: string; title: string; lead?: string; dark?: boolean; className?: string }) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <p className={cn("kicker", dark && "!text-teal-300")}>{kicker}</p>
      <h2 id={id ? `${id}-title` : undefined} className={cn("mt-4 font-display text-3xl font-semibold leading-[1.12] tracking-[-0.02em] md:text-[2.5rem]", dark ? "text-white" : "text-ink-strong")}>
        {title}
      </h2>
      {lead && <p className={cn("mt-4 text-[1.0625rem] leading-relaxed", dark ? "text-on-dark-muted" : "text-muted")}>{lead}</p>}
    </div>
  );
}

/* ———————————————————————————— Discovery ———————————————————————————— */

type DiscoveryItem = { key: string; type?: ServiceType; slug: string; nameKey: MessageKey; descKey: MessageKey; short: string; audience: ServiceDefinition["audience"] | "public" };

const DISCOVERY: DiscoveryItem[] = [
  ...SERVICES.map((s) => ({ key: s.type, type: s.type, slug: `/services/${s.slug}`, nameKey: s.nameKey as MessageKey, descKey: s.descKey as MessageKey, short: s.short, audience: s.audience })),
  { key: "REGISTER", slug: "/public-register", nameKey: "service.REGISTER.name", descKey: "service.REGISTER.desc", short: "REG", audience: "public" },
];

const INTENTS: Array<{ key: MessageKey; match: string[] }> = [
  { key: "disc.intent.new", match: ["PP", "CP"] },
  { key: "disc.intent.revise", match: ["RDC"] },
  { key: "disc.intent.large", match: ["LSP"] },
  { key: "disc.intent.occupy", match: ["CSN", "OC"] },
  { key: "disc.intent.renew", match: ["PP_RENEWAL"] },
  { key: "disc.intent.appeal", match: ["APPEAL", "OC_APPEAL"] },
  { key: "disc.intent.check", match: ["REGISTER"] },
];

const KEYWORDS: Record<string, string> = {
  PP: "plan planning land use new house home building dap প্ল্যানিং নতুন বাড়ি ভবন ভূমি",
  PP_PRIVATE_HOUSING: "housing project private plot আবাসন প্লট",
  CP: "construction build new house home building drawings structure নির্মাণ নতুন বাড়ি ভবন নকশা",
  RDC: "revise revised change drawings add floor extension সংশোধন পরিবর্তন তলা",
  LSP: "large special tower commercial complex বৃহৎ বিশেষ",
  CSN: "start notice begin construction শুরু নোটিশ",
  OC: "occupancy occupy complete finished use certificate অকুপেন্সি ব্যবহার সনদ",
  PP_RENEWAL: "renew renewal expire validity নবায়ন মেয়াদ",
  APPEAL: "appeal reject rejected decision আপিল প্রত্যাখ্যাত",
  OC_APPEAL: "appeal occupancy আপিল অকুপেন্সি",
  REGISTER: "check verify register approved buy rent permit যাচাই রেজিস্টার অনুমোদিত কেনা ভাড়া",
};

export function Discovery() {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [intent, setIntent] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = DISCOVERY;
    if (intent !== null) list = list.filter((d) => INTENTS[intent]!.match.includes(d.key));
    if (term) {
      const words = term.split(/\s+/);
      list = list.filter((d) => {
        const hay = `${t(d.nameKey)} ${t(d.descKey)} ${KEYWORDS[d.key] ?? ""} ${d.short}`.toLowerCase();
        return words.every((w) => hay.includes(w));
      });
    }
    return list;
  }, [q, intent, t]);

  const filtered = intent !== null || q.trim() !== "";
  const visible = filtered || showAll ? results : results.slice(0, 6);

  return (
    <Section id="discover" tone="white">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading id="discover" kicker={t("disc.kicker")} title={t("disc.title")} lead={t("disc.lead")} />
          <div className="mt-8">
            <label htmlFor="svc-search" className="sr-only">
              {t("disc.search")}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-subtle" aria-hidden />
              <input
                id="svc-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("disc.search.placeholder")}
                className="h-14 w-full rounded-xl border border-line-strong bg-surface pl-12 pr-4 text-base text-ink-strong shadow-xs transition-[border-color,box-shadow] placeholder:text-subtle focus:border-teal-600 focus:shadow-focus focus:outline-none"
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label={t("disc.kicker")}>
              {INTENTS.map((it, i) => (
                <button
                  key={it.key}
                  type="button"
                  aria-pressed={intent === i}
                  onClick={() => setIntent(intent === i ? null : i)}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[0.8125rem] font-medium transition-colors",
                    intent === i ? "border-emphasis bg-emphasis text-white" : "border-line-strong bg-surface text-ink hover:border-slate-ink/50 hover:text-ink-strong",
                  )}
                >
                  {t(it.key)}
                  {intent === i && <X className="size-3.5" aria-hidden />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between text-xs text-muted" aria-live="polite">
            <span className="font-mono uppercase tracking-[0.12em]">{filtered ? t("disc.results", { count: results.length }) : t("svc.kicker")}</span>
            {filtered && (
              <button type="button" onClick={() => { setQ(""); setIntent(null); }} className="font-medium text-teal-700 hover:underline">
                {t("common.clear")}
              </button>
            )}
          </div>
          {results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line-strong p-10 text-center text-sm text-muted">
              {t("disc.noresults")}{" "}
              <Link href="/support" className="font-medium text-teal-700 underline">
                {t("nav.help")}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {visible.map((d, i) => {
                const Icon = SERVICE_ICON[(d.type ?? "REGISTER") as ServiceType | "REGISTER"];
                const recommended = filtered && i === 0;
                return (
                  <li key={d.key}>
                    <Link href={d.slug} className={cn("group flex items-start gap-4 px-5 py-5 transition-colors hover:bg-surface-2 sm:items-center", recommended && "bg-teal-50/50")}>
                      <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-slate-ink transition-colors group-hover:border-teal-600/40 group-hover:text-teal-700">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-[1.0625rem] font-semibold text-ink-strong">{t(d.nameKey)}</span>
                          <span className="ref rounded-xs bg-surface-3 px-1.5 text-[0.625rem] font-medium text-slate-ink">{d.short}</span>
                          {recommended && <span className="rounded-full bg-teal-600 px-2 py-0.5 text-[0.6875rem] font-medium text-white">{t("disc.recommended")}</span>}
                        </span>
                        <span className="mt-1 block text-sm leading-relaxed text-muted">{t(d.descKey)}</span>
                      </span>
                      <ArrowRight className="mt-1 size-5 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-teal-700 sm:mt-0" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {!filtered && !showAll && results.length > visible.length && (
            <button type="button" onClick={() => setShowAll(true)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline">
              {t("svc.all")} ({results.length})
            </button>
          )}
        </div>
      </div>
    </Section>
  );
}

/* ———————————————————————————— Services by life-cycle ———————————————————————————— */

export function ServicesLifecycle() {
  const { t } = useI18n();
  const groups: Array<{ key: ServiceDefinition["group"]; title: MessageKey; items: Array<{ href: string; name: MessageKey; scope?: ServiceDefinition["scope"]; short: string }> }> = [
    { key: "permits", title: "svc.group.permits", items: SERVICES.filter((s) => s.group === "permits").map((s) => ({ href: `/services/${s.slug}`, name: s.nameKey as MessageKey, scope: s.scope, short: s.short })) },
    { key: "after_approval", title: "svc.group.after_approval", items: SERVICES.filter((s) => s.group === "after_approval").map((s) => ({ href: `/services/${s.slug}`, name: s.nameKey as MessageKey, scope: s.scope, short: s.short })) },
    { key: "appeals", title: "svc.group.appeals", items: SERVICES.filter((s) => s.group === "appeals").map((s) => ({ href: `/services/${s.slug}`, name: s.nameKey as MessageKey, scope: s.scope, short: s.short })) },
    { key: "information", title: "svc.group.information", items: [{ href: "/public-register", name: "service.REGISTER.name", scope: "new", short: "REG" }, { href: "/verify", name: "reg.verify", short: "VER" }] },
  ];
  return (
    <Section id="services" tone="light" pattern="drafting">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading id="services" kicker={t("svc.kicker")} title={t("svc.title")} lead={t("svc.lead")} />
        <Button asChild variant="secondary">
          <Link href="/services">
            {t("svc.all")}
            <ArrowRight />
          </Link>
        </Button>
      </div>
      <ol className="relative mt-14 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 xl:grid-cols-4">
        {groups.map((g, gi) => (
          <li key={g.key} className="relative bg-surface p-6 pt-7">
            <div className="flex items-center gap-3">
              <span className="ref grid size-8 place-items-center rounded-full border border-ink-strong text-xs font-semibold text-ink-strong">{String(gi + 1).padStart(2, "0")}</span>
              <h3 className="font-display text-base font-semibold text-ink-strong">{t(g.title)}</h3>
            </div>
            <ul className="mt-6 space-y-1">
              {g.items.map((it) => (
                <li key={it.href}>
                  <Link href={it.href} className="group -mx-2 flex items-start justify-between gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-surface-2">
                    <span className="min-w-0">
                      <span className="block text-[0.9375rem] font-medium text-ink-strong group-hover:text-teal-700">{t(it.name)}</span>
                      {it.scope && (
                        <span className={cn("mt-0.5 block text-xs", it.scope === "new" ? "text-amber-700" : "text-muted")}>
                          {it.scope === "new" && <span className="mr-1 inline-block size-1.5 rotate-45 bg-amber-500 align-middle" aria-hidden />}
                          {t(`svc.scope.${it.scope}`)}
                        </span>
                      )}
                    </span>
                    <ArrowUpRight className="mt-1 size-4 shrink-0 text-subtle group-hover:text-teal-700" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ———————————————————————————— How it works ———————————————————————————— */

export function HowItWorks() {
  const { t } = useI18n();
  const steps = [
    { icon: UserCheck, title: "how.s1.title", body: "how.s1.body" },
    { icon: Users, title: "how.s2.title", body: "how.s2.body" },
    { icon: MapPinned, title: "how.s3.title", body: "how.s3.body" },
    { icon: FileSearch, title: "how.s4.title", body: "how.s4.body" },
  ] as const;
  return (
    <Section id="how" tone="white">
      <SectionHeading id="how" kicker={t("how.kicker")} title={t("how.title")} />
      <ol className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-0">
        {steps.map((s, i) => (
          <li key={s.title} className="relative lg:pr-10">
            <div className="flex items-center gap-4">
              <span aria-hidden className="font-display text-5xl font-light leading-none tracking-tight text-subtle tabular">{String(i + 1).padStart(2, "0")}</span>
              <span className="hidden h-px flex-1 bg-line lg:block" aria-hidden />
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-navy-900 text-white">
                <s.icon className="size-[18px]" aria-hidden />
              </span>
            </div>
            <h3 className="mt-6 font-display text-lg font-semibold text-ink-strong">{t(s.title)}</h3>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{t(s.body)}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ———————————————————————————— Lifecycle diagram ———————————————————————————— */

export function Lifecycle() {
  const { t } = useI18n();
  const flow = flowFor("CP");
  const current = 3;
  return (
    <Section id="lifecycle" tone="dark" pattern="blueprint">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-end">
        <SectionHeading id="lifecycle" dark kicker={t("life.kicker")} title={t("life.title")} lead={t("life.lead")} />
        <p className="text-sm text-on-dark-muted lg:text-right">{t("life.note")}</p>
      </div>
      <div className="mt-16">
        {/* Desktop: horizontal "section line" with stations */}
        <ol className="relative hidden grid-cols-9 lg:grid" aria-label={t("life.kicker")}>
          <span aria-hidden className="absolute left-[5.5%] right-[5.5%] top-[19px] h-px bg-white/20" />
          <span aria-hidden className="absolute left-[5.5%] top-[19px] h-px bg-teal-300" style={{ width: `${(current / (flow.length - 1)) * 89}%` }} />
          {flow.map((s, i) => (
            <li key={s} className="relative flex flex-col items-center text-center" aria-current={i === current ? "step" : undefined}>
              <span
                className={cn(
                  "relative z-10 grid size-10 place-items-center rounded-full border text-xs font-semibold tabular",
                  i < current && "border-teal-300 bg-navy-900 text-teal-300",
                  i === current && "border-amber-500 bg-amber-500 text-navy-950 shadow-[0_0_0_6px_rgb(231_162_59/0.18)]",
                  i > current && "border-white/20 bg-navy-900 text-on-dark-muted",
                )}
              >
                {i < current ? <Check className="size-4" aria-hidden /> : String(i + 1).padStart(2, "0")}
              </span>
              <span className={cn("mt-4 max-w-[9rem] text-[0.8125rem] leading-snug", i === current ? "font-semibold text-white" : "text-on-dark-muted")}>{STAGE_LABEL[s]}</span>
              {i === current && (
                <span className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[0.6875rem] leading-tight text-amber-200">
                  {t("life.you")}
                  <span className="block font-mono text-[0.625rem] text-amber-200/80">2 / 3 days</span>
                </span>
              )}
            </li>
          ))}
        </ol>
        {/* Mobile: vertical list */}
        <ol className="space-y-0 lg:hidden">
          {flow.map((s, i) => (
            <li key={s} className="relative flex gap-4 pb-5 last:pb-0">
              {i < flow.length - 1 && <span aria-hidden className={cn("absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px", i < current ? "bg-teal-300" : "bg-white/15")} />}
              <span
                className={cn(
                  "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border text-[0.6875rem] font-semibold",
                  i < current && "border-teal-300 text-teal-300",
                  i === current && "border-amber-500 bg-amber-500 text-navy-950",
                  i > current && "border-white/20 text-on-dark-muted",
                )}
              >
                {i < current ? <Check className="size-3.5" aria-hidden /> : i + 1}
              </span>
              <span className={cn("pt-1.5 text-sm", i === current ? "font-semibold text-white" : "text-on-dark-muted")}>
                {STAGE_LABEL[s]}
                {i === current && <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-xs text-amber-200">{t("life.you")}</span>}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

/* ———————————————————————————— Track ———————————————————————————— */

export function TrackSection() {
  const { t } = useI18n();
  const router = useRouter();
  const [ref, setRef] = useState("");
  const [error, setError] = useState("");
  const samples = ["CP-26-Z1-01421", "CP-26-Z4-01414"];
  return (
    <Section id="track" tone="white">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
        <SectionHeading id="track" kicker={t("track.kicker")} title={t("track.title")} lead={t("track.lead")} />
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!ref.trim()) return setError(t("err.required"));
            router.push(`/track?ref=${encodeURIComponent(ref.trim().toUpperCase())}`);
          }}
          className="rounded-2xl border border-line bg-surface-2 p-6 shadow-sm sm:p-8"
        >
          <label htmlFor="track-ref" className="text-sm font-medium text-ink-strong">
            {t("track.label")}
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="track-ref"
              value={ref}
              onChange={(e) => {
                setRef(e.target.value);
                setError("");
              }}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? "track-err" : "track-hint"}
              placeholder="CP-26-Z4-01491"
              className="ref h-12 min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-4 text-[0.9375rem] uppercase text-ink-strong placeholder:normal-case placeholder:text-subtle focus:border-teal-600 focus:shadow-focus focus:outline-none aria-[invalid=true]:border-danger-600"
              autoComplete="off"
            />
            <Button type="submit" size="lg">
              {t("track.submit")}
            </Button>
          </div>
          {error ? (
            <p id="track-err" role="alert" className="mt-2 text-xs font-medium text-danger-700">
              {error}
            </p>
          ) : (
            <p id="track-hint" className="mt-2 text-xs text-muted">
              {t("track.hint")}
            </p>
          )}
          <div className="mt-6 border-t border-line pt-5">
            <p className="text-xs text-muted">{t("track.sample")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {samples.map((s) => (
                <Link key={s} href={`/track?ref=${s}`} className="ref rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-strong hover:border-teal-600 hover:text-teal-700">
                  {s}
                </Link>
              ))}
            </div>
          </div>
        </form>
      </div>
    </Section>
  );
}

/* ———————————————————————————— Public Register band ———————————————————————————— */

export function RegisterBand() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState("");
  const latest = PUBLIC_PERMITS.slice(0, 4);
  return (
    <Section id="register" tone="light">
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="on-dark relative bg-navy-900 p-8 text-on-dark sm:p-10 lg:p-12">
            <div className="bg-blueprint absolute inset-0" aria-hidden />
            <div className="relative">
              <SectionHeading id="register" dark kicker={t("reg.kicker")} title={t("reg.title")} lead={t("reg.lead")} />
              <form
                className="mt-8"
                onSubmit={(e) => {
                  e.preventDefault();
                  router.push(`/public-register${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
                }}
              >
                <label htmlFor="reg-q" className="sr-only">
                  {t("reg.search")}
                </label>
                <div className="flex gap-2">
                  <input
                    id="reg-q"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t("reg.search")}
                    className="h-11 min-w-0 flex-1 rounded-lg border border-white/15 bg-white/[0.06] px-4 text-sm text-white placeholder:text-on-dark-muted/70 focus:border-teal-300/70 focus:outline-none"
                  />
                  <Button type="submit" variant="accent" size="md" className="h-11" aria-label={t("common.search")}>
                    <Search />
                  </Button>
                </div>
              </form>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <Link href="/public-register" className="inline-flex items-center gap-1.5 font-medium text-white hover:underline">
                  {t("reg.open")} <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link href="/verify" className="inline-flex items-center gap-1.5 text-on-dark-muted hover:text-white">
                  <ShieldCheck className="size-4" aria-hidden /> {t("reg.verify")}
                </Link>
              </div>
            </div>
          </div>
          <div className="p-6 sm:p-8 lg:p-10">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted">{t("reg.latest")}</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[30rem] text-left text-sm">
                <caption className="sr-only">{t("reg.latest")}</caption>
                <thead>
                  <tr className="border-b border-line text-xs text-muted">
                    <th scope="col" className="pb-2.5 font-medium">{t("reg.col.permit")}</th>
                    <th scope="col" className="pb-2.5 font-medium">{t("reg.col.area")}</th>
                    <th scope="col" className="pb-2.5 font-medium">{t("reg.col.floors")}</th>
                    <th scope="col" className="pb-2.5 text-right font-medium">{t("reg.col.approved")}</th>
                  </tr>
                </thead>
                <tbody>
                  {latest.map((p) => (
                    <tr key={p.permitNo} className="border-b border-line/70 last:border-0">
                      <td className="py-3.5">
                        <Link href={`/public-register/${p.permitNo}`} className="ref font-medium text-ink-strong hover:text-teal-700 hover:underline">
                          {p.permitNo}
                        </Link>
                        <span className="mt-0.5 block text-xs text-muted">{p.owners[0]}</span>
                      </td>
                      <td className="py-3.5 text-ink">{p.area}</td>
                      <td className="ref py-3.5 text-ink">{p.floorLimit}</td>
                      <td className="tabular py-3.5 text-right text-muted">{formatDate(p.approvedOn, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-5 text-xs text-subtle">Fictional demonstration records.</p>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ———————————————————————————— Guidance ———————————————————————————— */

export function Guidance() {
  const { t } = useI18n();
  const cols = [
    { title: "guide.owner.title", icon: ClipboardList, items: ["guide.owner.1", "guide.owner.2", "guide.owner.3", "guide.owner.4"], href: "/guides#owners" },
    { title: "guide.pro.title", icon: BookOpen, items: ["guide.pro.1", "guide.pro.2", "guide.pro.3", "guide.pro.4"], href: "/guides#professionals" },
  ] as const;
  return (
    <Section id="guidance" tone="white">
      <SectionHeading id="guidance" kicker={t("guide.kicker")} title={t("guide.title")} />
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {cols.map((c, ci) => (
          <div key={c.title} className={cn("rounded-2xl border p-7 sm:p-9", ci === 0 ? "border-line bg-canvas" : "border-teal-600/20 bg-teal-50/60")}>
            <div className="flex items-center gap-3">
              <c.icon className={cn("size-5", ci === 0 ? "text-slate-ink" : "text-teal-700")} aria-hidden />
              <h3 className="font-display text-xl font-semibold text-ink-strong">{t(c.title)}</h3>
            </div>
            <ul className="mt-6 space-y-3.5">
              {c.items.map((k) => (
                <li key={k} className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink">
                  <span className="mt-[7px] grid size-4 shrink-0 place-items-center rounded-full bg-surface ring-1 ring-line-strong">
                    <Check className="size-2.5 text-teal-700" strokeWidth={3} aria-hidden />
                  </span>
                  {t(k)}
                </li>
              ))}
            </ul>
            <Link href={c.href} className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline">
              {t("guide.read")} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ———————————————————————————— Benefits ———————————————————————————— */

export function Benefits() {
  const { t } = useI18n();
  const items = [1, 2, 3, 4, 5, 6] as const;
  return (
    <Section id="benefits" tone="light">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading id="benefits" kicker={t("ben.kicker")} title={t("ben.title")} />
        </div>
        <ol className="divide-y divide-line border-y border-line">
          {items.map((n) => (
            <li key={n} className="grid gap-4 py-7 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-6">
              <span className="ref text-sm font-medium text-teal-700">{String(n).padStart(2, "0")}</span>
              <div>
                <h3 className="font-display text-lg font-semibold text-ink-strong">{t(`ben.${n}.title` as MessageKey)}</h3>
                <dl className="mt-3 grid gap-3 text-[0.9375rem] sm:grid-cols-2 sm:gap-6">
                  <div>
                    <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-subtle">{t("ben.before")}</dt>
                    <dd className="mt-1 leading-relaxed text-muted">{t(`ben.${n}.before` as MessageKey)}</dd>
                  </div>
                  <div className="sm:border-l sm:border-line sm:pl-6">
                    <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-teal-700">{t("ben.now")}</dt>
                    <dd className="mt-1 leading-relaxed text-ink-strong">{t(`ben.${n}.now` as MessageKey)}</dd>
                  </div>
                </dl>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

/* ———————————————————————————— Notices ———————————————————————————— */

export function Notices() {
  const { t, locale } = useI18n();
  const hydrated = useDemoStore((s) => s.hydrated);
  const allNotices = useDemoStore((s) => s.notices);
  const notices = useMemo(() => allNotices.filter((n) => n.visibleOnPortal), [allNotices]);
  const refs = ["notice.ref.bnbc", "notice.ref.bidhimala", "notice.ref.dap", "notice.ref.act"] as const;
  const KIND: Record<string, string> = { maintenance: "Maintenance", regulatory: "Regulatory", general: "General" };
  return (
    <Section id="notices" tone="white">
      <SectionHeading id="notices" kicker={t("notice.kicker")} title={t("notice.title")} />
      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <div>
          {!hydrated ? (
            <div className="space-y-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : notices.length === 0 ? (
            <p className="text-sm text-muted">{t("notice.empty")}</p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {notices.map((n) => (
                <li key={n.id} className="grid gap-2 py-5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-6">
                  <div className="flex items-center gap-2 sm:block">
                    <time dateTime={n.publishedAt} className="tabular block text-sm text-muted">
                      {formatDate(n.publishedAt, locale)}
                    </time>
                    <span className={cn("mt-1 inline-block font-mono text-[0.625rem] uppercase tracking-[0.12em]", n.kind === "maintenance" ? "text-amber-700" : n.kind === "regulatory" ? "text-teal-700" : "text-slate-ink")}>
                      {KIND[n.kind]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-ink-strong">{locale === "bn" && n.titleBn ? n.titleBn : n.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{locale === "bn" && n.bodyBn ? n.bodyBn : n.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <aside aria-labelledby="refs-title" className="rounded-xl border border-line bg-canvas p-6">
          <h3 id="refs-title" className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
            {t("notice.refs")}
          </h3>
          <ul className="mt-4 space-y-3">
            {refs.map((r, i) => (
              <li key={r} className="flex gap-3 text-sm">
                <span className="ref mt-0.5 text-xs text-subtle">§{i + 1}</span>
                <span className="font-medium text-ink-strong">{t(r)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">{t("notice.ref.note")}</p>
        </aside>
      </div>
    </Section>
  );
}

/* ———————————————————————————— Support ———————————————————————————— */

export function SupportBand() {
  const { t } = useI18n();
  const items = [
    { icon: LifeBuoy, title: "sup.ticket", body: "sup.ticket.body", href: "/support#raise" },
    { icon: BookOpen, title: "sup.manuals", body: "sup.manuals.body", href: "/guides" },
    { icon: FileSearch, title: "sup.track", body: "sup.track.body", href: "/support#follow" },
  ] as const;
  return (
    <Section id="support" tone="light" pattern="drafting">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16">
        <div>
          <SectionHeading id="support" kicker={t("sup.kicker")} title={t("sup.title")} lead={t("sup.lead")} />
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink">
            <span className="size-1.5 rounded-full bg-success-600" aria-hidden />
            {t("sup.hours")}
          </p>
        </div>
        <ul className="grid gap-3">
          {items.map((it) => (
            <li key={it.title}>
              <Link href={it.href} className="group flex items-center gap-5 rounded-xl border border-line bg-surface p-5 shadow-xs transition-[border-color,box-shadow] hover:border-teal-600/40 hover:shadow-md">
                <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700">
                  <it.icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display font-semibold text-ink-strong">{t(it.title)}</span>
                  <span className="mt-0.5 block text-sm text-muted">{t(it.body)}</span>
                </span>
                <ArrowRight className="size-5 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-teal-700" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/* ———————————————————————————— FAQ ———————————————————————————— */

export function Faq() {
  const { t } = useI18n();
  const items = [1, 2, 3, 4, 5, 6].map((n) => ({ id: `faq-${n}`, q: t(`faq.${n}.q` as MessageKey), a: t(`faq.${n}.a` as MessageKey) }));
  return (
    <Section id="faq" tone="white">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
        <SectionHeading id="faq" kicker={t("faq.kicker")} title={t("faq.title")} />
        <Accordion items={items} />
      </div>
    </Section>
  );
}
