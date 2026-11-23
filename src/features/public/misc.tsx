"use client";

import { ArrowRight, BookOpen, Building2, CheckCircle2, ClipboardList, FileSearch, Gavel, HardHat, LifeBuoy, RefreshCcw, Search, ShieldCheck, Signature, Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { StageTrack, StatusBadge } from "@/components/domain/status";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/display";
import { Callout, EmptyState, Skeleton } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form";
import { ConfirmDialog } from "@/components/ui/overlay";
import { toast } from "@/components/ui/toast";
import { DemoRoleGrid } from "@/features/auth/demo-roles";
import { CATEGORY_LABEL, HelpdeskForUser, TICKET_LABEL, TICKET_TONE } from "@/features/helpdesk/user-tickets";
import { holdingInfo } from "@/lib/domain/workflow";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { useLabels } from "@/lib/i18n/labels";
import { useDemoStore } from "@/lib/store/demo-store";
import { formatDate, formatRelative, workingDaysBetween } from "@/lib/utils";
import { Container, PageIntro } from "./page-intro";

/* ———————————————————————————— Track ———————————————————————————— */

export function TrackPage() {
  const { t, locale } = useI18n();
  const L = useLabels();
  const params = useSearchParams();
  const router = useRouter();
  const hydrated = useDemoStore((s) => s.hydrated);
  const applications = useDemoStore((s) => s.applications);
  const limits = useDemoStore((s) => s.holdingLimits);
  const initial = params.get("ref") ?? "";
  const [ref, setRef] = useState(initial);
  const query = initial.trim().toUpperCase();
  const app = query ? applications.find((a) => a.ref.toUpperCase() === query && a.status !== "draft") : undefined;

  return (
    <>
      <PageIntro breadcrumbs={[{ label: t("pub.home"), href: "/" }, { label: t("nav.track") }]} kicker={t("track.kicker")} title={t("track.title")} lead={t("track.lead")}>
        <form
          className="flex max-w-xl flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            router.replace(`/track?ref=${encodeURIComponent(ref.trim().toUpperCase())}`);
          }}
        >
          <label htmlFor="track-q" className="sr-only">
            {t("track.label")}
          </label>
          <Input id="track-q" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="CP-26-Z4-01491" className="ref h-12 text-base uppercase" aria-describedby="track-q-hint" />
          <Button type="submit" size="lg">
            {t("track.submit")}
          </Button>
        </form>
        <p id="track-q-hint" className="mt-2 text-xs text-muted">
          {t("track.hint")}
        </p>
      </PageIntro>
      <Container>
        {!query ? (
          <EmptyState icon={FileSearch} title={t("tr.enter")} body={t("tr.enterBody")} />
        ) : !hydrated ? (
          <Skeleton className="h-64" />
        ) : !app ? (
          <Callout tone="warning" title={t("track.notfound")}>
            {t("tr.draftHidden")}
          </Callout>
        ) : (
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5">
              <div>
                <p className="ref text-lg font-semibold text-ink-strong">{app.ref}</p>
                <p className="text-sm text-muted">
                  {L.service(app.type)} · {app.property.area}, {L.zone(app.property.zone)}
                </p>
              </div>
              <StatusBadge status={app.status} />
            </div>
            <div className="px-6 py-6">
              <StageTrack type={app.type} stage={app.stage} status={app.status} showLabels />
              <dl className="mt-6 grid gap-5 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted">{t("track.result.stage")}</dt>
                  <dd className="mt-1 font-medium text-ink-strong">{app.status === "approved" ? t("tr.issued") : L.stage(app.stage)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{t("track.result.submitted")}</dt>
                  <dd className="tabular mt-1 font-medium text-ink-strong">{formatDate(app.submittedAt, locale)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{t("track.result.held")}</dt>
                  <dd className="mt-1 font-medium text-ink-strong">{["approved", "rejected"].includes(app.status) ? "—" : t("track.result.days", { n: holdingInfo(app, limits).days })}</dd>
                </div>
              </dl>
              <p className="mt-6 text-xs text-muted">{t("tr.total", { n: workingDaysBetween(app.submittedAt ?? app.createdAt), when: formatRelative(app.history.at(-1)?.at ?? app.createdAt, undefined, locale) })}</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-2 px-6 py-4 text-sm">
              <span className="text-muted">{t("track.result.signin")}</span>
              <Button asChild size="sm" variant="secondary">
                <Link href="/sign-in">{t("nav.signin")}</Link>
              </Button>
            </div>
          </div>
        )}
      </Container>
    </>
  );
}

/* ———————————————————————————— Help centre ———————————————————————————— */

const ARTICLES = ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8"] as const;
const OWNER_STEPS = 7;
const PRO_STEPS = 4;
const SCENARIOS = [
  { n: 1, icon: Building2, role: "applicant" },
  { n: 2, icon: Users, role: "officer" },
  { n: 3, icon: Signature, role: "officer" },
  { n: 4, icon: HardHat, role: "inspector" },
  { n: 5, icon: Gavel, role: "committee" },
  { n: 6, icon: ShieldCheck, role: "management" },
] as const;

export function HelpCentre() {
  const { t, locale } = useI18n();
  const session = useDemoStore((s) => s.session);
  const tickets = useDemoStore((s) => s.tickets);
  const [q, setQ] = useState("");
  const [lookup, setLookup] = useState("");
  const [found, setFound] = useState<string | null>(null);
  const articles = ARTICLES.map((id) => ({ id, cat: t(`art.${id}.cat`), title: t(`art.${id}.title`), body: t(`art.${id}.body`) }));
  const filtered = articles.filter((a) => !q || `${a.title} ${a.body} ${a.cat}`.toLowerCase().includes(q.toLowerCase()));
  const ticket = found ? tickets.find((x) => x.ref.toUpperCase() === found) : undefined;
  return (
    <>
      <PageIntro breadcrumbs={[{ label: t("pub.home"), href: "/" }, { label: t("nav.help") }]} kicker={t("sup.kicker")} title={t("sup.title")} lead={t("sup.lead")}>
        <div className="max-w-xl">
          <label htmlFor="help-q" className="sr-only">
            {t("hc.search")}
          </label>
          <Input id="help-q" leading={<Search />} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("hc.search")} className="h-12 text-base" />
        </div>
      </PageIntro>
      <Container>
        <section aria-labelledby="articles">
          <h2 id="articles" className="font-display text-xl font-semibold text-ink-strong">
            {t("sup.manuals")}
          </h2>
          {filtered.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{t("hc.noMatch")}</p>
          ) : (
            <ul className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {filtered.map((a) => (
                <li key={a.id}>
                  <Link href="/guides" className="group flex h-full flex-col rounded-xl border border-line bg-surface p-5 hover:border-teal-600/40">
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-teal-700 [:lang(bn)_&]:font-sans [:lang(bn)_&]:text-xs [:lang(bn)_&]:normal-case [:lang(bn)_&]:tracking-normal">{a.cat}</span>
                    <span className="mt-2 font-medium text-ink-strong group-hover:text-teal-700">{a.title}</span>
                    <span className="mt-1 text-sm text-muted">{a.body}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-14">
          {session ? (
            <HelpdeskForUser />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <div id="raise" className="rounded-xl border border-line bg-surface p-6">
                <LifeBuoy className="size-6 text-teal-700" aria-hidden />
                <h2 className="mt-4 font-display text-lg font-semibold text-ink-strong">{t("sup.ticket")}</h2>
                <p className="mt-1 text-sm text-muted">{t("hc.signinBody")}</p>
                <Button asChild className="mt-5">
                  <Link href="/sign-in?next=/workspace/support">
                    {t("nav.signin")} <ArrowRight />
                  </Link>
                </Button>
              </div>
              <form
                id="follow"
                className="rounded-xl border border-line bg-surface p-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  setFound(lookup.trim().toUpperCase() || null);
                }}
              >
                <FileSearch className="size-6 text-teal-700" aria-hidden />
                <h2 className="mt-4 font-display text-lg font-semibold text-ink-strong">{t("sup.track")}</h2>
                <div className="mt-4 flex gap-2">
                  <Input value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder="HD-26-00411" className="ref uppercase" aria-label={t("hc.ticketRef")} />
                  <Button type="submit" variant="secondary">
                    {t("common.search")}
                  </Button>
                </div>
                {found && (
                  <div className="mt-4" aria-live="polite">
                    {ticket ? (
                      <div className="rounded-lg border border-line bg-surface-2 p-4 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="ref font-semibold text-ink-strong">{ticket.ref}</span>
                          <Badge tone={TICKET_TONE[ticket.status]}>{t(TICKET_LABEL[ticket.status])}</Badge>
                        </div>
                        <p className="mt-1 text-muted">
                          {t("hc.updated", { cat: t(CATEGORY_LABEL[ticket.category]), when: formatRelative(ticket.updatedAt, undefined, locale) })}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-danger-700">{t("hc.notFound")}</p>
                    )}
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </Container>
    </>
  );
}

/* ———————————————————————————— Guides ———————————————————————————— */

export function GuidesPage() {
  const { t } = useI18n();
  const steps = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => [t(`gd.${prefix}${i + 1}.t` as MessageKey), t(`gd.${prefix}${i + 1}.b` as MessageKey)] as const);
  const owner = steps("o", OWNER_STEPS);
  const pro = steps("p", PRO_STEPS);
  return (
    <>
      <PageIntro breadcrumbs={[{ label: t("pub.home"), href: "/" }, { label: t("sup.manuals") }]} kicker={t("guide.kicker")} title={t("guide.title")} lead={t("gd.lead")} />
      <Container>
        <div className="grid gap-12 lg:grid-cols-2">
          {[
            { id: "owners", title: t("guide.owner.title"), icon: ClipboardList, steps: owner },
            { id: "professionals", title: t("guide.pro.title"), icon: BookOpen, steps: pro },
          ].map((g) => (
            <section key={g.id} id={g.id} aria-labelledby={`${g.id}-t`} className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <g.icon className="size-5 text-teal-700" aria-hidden />
                <h2 id={`${g.id}-t`} className="font-display text-2xl font-semibold text-ink-strong">
                  {g.title}
                </h2>
              </div>
              <ol className="mt-6 space-y-0">
                {g.steps.map(([title, body], i) => (
                  <li key={title} className="relative flex gap-5 pb-7 last:pb-0">
                    {i < g.steps.length - 1 && <span aria-hidden className="absolute left-[15px] top-9 h-[calc(100%-2rem)] w-px bg-line" />}
                    <span className="ref relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-navy-900 text-xs font-semibold text-white">{String(i + 1).padStart(2, "0")}</span>
                    <div className="pt-1">
                      <h3 className="font-semibold text-ink-strong">{title}</h3>
                      <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </Container>
    </>
  );
}

/* ———————————————————————————— Demo hub ———————————————————————————— */


export function DemoHub() {
  const { t, locale } = useI18n();
  const reset = useDemoStore((s) => s.resetDemo);
  const seededAt = useDemoStore((s) => s.seededAt);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <PageIntro dark breadcrumbs={[{ label: t("pub.home"), href: "/" }, { label: t("dh.crumb") }]} kicker={t("dh.kicker")} title={t("dh.title")} lead={t("dh.lead")}>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline-dark" onClick={() => setConfirm(true)}>
            <RefreshCcw /> {t("dh.reset")}
          </Button>
          <span className="self-center text-xs text-on-dark-muted">{t("dh.loaded", { when: seededAt ? formatRelative(seededAt, undefined, locale) : "—" })}</span>
        </div>
      </PageIntro>
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <section aria-labelledby="roles-t">
            <h2 id="roles-t" className="font-display text-xl font-semibold text-ink-strong">
              {t("dh.choose")}
            </h2>
            <p className="mt-1 text-sm text-muted">{t("dh.chooseBody")}</p>
            <div className="mt-5">
              <DemoRoleGrid columns={2} />
            </div>
          </section>
          <section aria-labelledby="sc-t">
            <h2 id="sc-t" className="font-display text-xl font-semibold text-ink-strong">
              {t("dh.scenarios")}
            </h2>
            <ol className="mt-5 space-y-3">
              {SCENARIOS.map((s) => (
                <li key={s.n} className="flex gap-4 rounded-xl border border-line bg-surface p-4">
                  <s.icon className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden />
                  <div>
                    <p className="font-medium text-ink-strong">{t(`sc.${s.n}.t` as MessageKey)}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{t(`sc.${s.n}.s` as MessageKey)}</p>
                    <p className="mt-2 text-xs text-subtle">{t("dh.startAs", { role: t(`role.${s.role}`) })}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Callout tone="info" className="mt-5" icon={CheckCircle2}>
              {t("dh.script")}
            </Callout>
          </section>
        </div>
      </Container>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t("dh.qTitle")}
        description={t("dh.qDesc")}
        confirmLabel={t("dh.yes")}
        tone="danger"
        onConfirm={() => {
          reset();
          setConfirm(false);
          toast.success(t("dh.done"));
        }}
      />
    </>
  );
}
