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
import { SERVICE_SHORT_LABEL } from "@/lib/domain/catalog";
import { holdingInfo, STAGE_LABEL } from "@/lib/domain/workflow";
import { useI18n } from "@/lib/i18n";
import { useDemoStore } from "@/lib/store/demo-store";
import { formatDate, formatRelative, workingDaysBetween } from "@/lib/utils";
import { Container, PageIntro } from "./page-intro";

/* ———————————————————————————— Track ———————————————————————————— */

export function TrackPage() {
  const { t, locale } = useI18n();
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
      <PageIntro breadcrumbs={[{ label: "Home", href: "/" }, { label: t("nav.track") }]} kicker={t("track.kicker")} title={t("track.title")} lead={t("track.lead")}>
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
          <EmptyState icon={FileSearch} title="Enter a reference to see its status" body="Demo references: CP-26-Z1-01421, CP-26-Z4-01414, PP-26-Z8-01533." />
        ) : !hydrated ? (
          <Skeleton className="h-64" />
        ) : !app ? (
          <Callout tone="warning" title={t("track.notfound")}>
            Draft applications are not visible publicly. If you just submitted, refresh in a moment.
          </Callout>
        ) : (
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5">
              <div>
                <p className="ref text-lg font-semibold text-ink-strong">{app.ref}</p>
                <p className="text-sm text-muted">
                  {SERVICE_SHORT_LABEL[app.type]} · {app.property.area}, {app.property.zone}
                </p>
              </div>
              <StatusBadge status={app.status} />
            </div>
            <div className="px-6 py-6">
              <StageTrack type={app.type} stage={app.stage} status={app.status} showLabels />
              <dl className="mt-6 grid gap-5 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted">{t("track.result.stage")}</dt>
                  <dd className="mt-1 font-medium text-ink-strong">{app.status === "approved" ? "Issued" : STAGE_LABEL[app.stage]}</dd>
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
              <p className="mt-6 text-xs text-muted">Total {workingDaysBetween(app.submittedAt ?? app.createdAt)} working days since submission. Last update {formatRelative(app.history.at(-1)?.at ?? app.createdAt)}.</p>
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

const ARTICLES = [
  { cat: "Getting started", title: "Registering as a building owner", body: "What you need for NID-based registration and first sign-in." },
  { cat: "Getting started", title: "Registering as a professional", body: "Linking your IAB, IEB, BIP or IDEB membership." },
  { cat: "Applications", title: "Inviting your architect and engineers", body: "How invitations, acceptance and replacement work." },
  { cat: "Applications", title: "Adding plot coordinates and photographs", body: "Taking usable plot and adjacent-road photos." },
  { cat: "Applications", title: "Responding to a correction request", body: "Uploading a corrected document so the file returns to the same desk." },
  { cat: "Payments", title: "Understanding your fee breakdown", body: "How occupancy type and project area determine fees." },
  { cat: "Signatures", title: "How digitally signed approvals work", body: "Checking signatures on every page of approved drawings." },
  { cat: "Public Register", title: "Verifying a permit before buying or renting", body: "Using the permit number and verification code." },
];

export function HelpCentre() {
  const { t } = useI18n();
  const session = useDemoStore((s) => s.session);
  const tickets = useDemoStore((s) => s.tickets);
  const [q, setQ] = useState("");
  const [lookup, setLookup] = useState("");
  const [found, setFound] = useState<string | null>(null);
  const filtered = ARTICLES.filter((a) => !q || `${a.title} ${a.body} ${a.cat}`.toLowerCase().includes(q.toLowerCase()));
  const ticket = found ? tickets.find((x) => x.ref.toUpperCase() === found) : undefined;
  return (
    <>
      <PageIntro breadcrumbs={[{ label: "Home", href: "/" }, { label: t("nav.help") }]} kicker={t("sup.kicker")} title={t("sup.title")} lead={t("sup.lead")}>
        <div className="max-w-xl">
          <label htmlFor="help-q" className="sr-only">
            Search help articles
          </label>
          <Input id="help-q" leading={<Search />} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help articles" className="h-12 text-base" />
        </div>
      </PageIntro>
      <Container>
        <section aria-labelledby="articles">
          <h2 id="articles" className="font-display text-xl font-semibold text-ink-strong">
            {t("sup.manuals")}
          </h2>
          {filtered.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No articles match. Raise a request below and the helpdesk will respond.</p>
          ) : (
            <ul className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {filtered.map((a) => (
                <li key={a.title}>
                  <Link href="/guides" className="group flex h-full flex-col rounded-xl border border-line bg-surface p-5 hover:border-teal-600/40">
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-teal-700">{a.cat}</span>
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
                <p className="mt-1 text-sm text-muted">Sign in so we can link the request to your account and applications. In the demo, choose any role.</p>
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
                  <Input value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder="HD-26-00411" className="ref uppercase" aria-label="Ticket reference" />
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
                          <Badge tone={TICKET_TONE[ticket.status]}>{TICKET_LABEL[ticket.status]}</Badge>
                        </div>
                        <p className="mt-1 text-muted">
                          {CATEGORY_LABEL[ticket.category]} · updated {formatRelative(ticket.updatedAt)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-danger-700">No request found with that reference.</p>
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
  const owner = [
    ["Register and verify", "Create your account with your National ID. You will set a new password on first sign-in."],
    ["Choose the right permission", "Most new buildings need a Planning Permit, followed by a Construction Permit."],
    ["Invite professionals", "Invite a registered architect, and for a Construction Permit the structural, electrical and plumbing engineers."],
    ["Add every owner", "Each owner needs an NID document, tax-return slip and photograph in their own tab."],
    ["Locate the plot", "Place the plot on the map, confirm it, and add plot and adjacent-road photographs."],
    ["Review the fee", "The fee breakdown shows the inputs, rule version and amount before you submit."],
    ["Track and respond", "Follow each stage, see how long your file has been held, and answer corrections online."],
  ];
  const pro = [
    ["Register with your membership", "Your professional body membership is verified through an approved integration."],
    ["Accept invitations", "Accept or decline owner invitations from your workspace; declines include a reason."],
    ["Upload by sheet", "Upload each drawing sheet separately; the system keeps every version and stamps the file number."],
    ["Professional replacement", "Replacements are requested, recorded and approved — never silent."],
  ];
  return (
    <>
      <PageIntro breadcrumbs={[{ label: "Home", href: "/" }, { label: t("sup.manuals") }]} kicker={t("guide.kicker")} title={t("guide.title")} lead="Short, practical guidance. Full user manuals will be updated in English as part of the assignment." />
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

const SCENARIOS = [
  { icon: Building2, title: "1 · Applicant submits a Planning Permit", steps: "Applicant → continue Dhanmondi draft → add owner documents → map & photos → review & fee → submit", role: "Applicant" },
  { icon: Users, title: "2 · Officer processes a file", steps: "RAJUK Officer → inbox → open CP-26-Z4-01491 → checklist → observation → forward with Yes/No confirmation", role: "RAJUK Officer" },
  { icon: Signature, title: "3 · Digital signing", steps: "RAJUK Officer → Document signing → Lalmatia drawing set → simulated certificate & MFA → sign all design pages", role: "RAJUK Officer" },
  { icon: HardHat, title: "4 · Field inspection", steps: "Inspector → plinth inspection → location → checklist → sample photo → submit", role: "Inspector" },
  { icon: Gavel, title: "5 · Committee decision", steps: "Committee User → meeting 14/2026 → second-presentation case (Approve/Reject only) → vote", role: "Committee User" },
  { icon: ShieldCheck, title: "6 · Public Register & insights", steps: "Public Register → open permit → verify → Management or Finance dashboards", role: "Management" },
];

export function DemoHub() {
  const reset = useDemoStore((s) => s.resetDemo);
  const seededAt = useDemoStore((s) => s.seededAt);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <PageIntro dark breadcrumbs={[{ label: "Home", href: "/" }, { label: "Demonstration" }]} kicker="Prototype · demonstration environment" title="Explore ECPS through connected roles" lead="Every record is fictional. Actions you take as one role are visible to the others, so you can follow a file from submission to permit. Simulated steps are always labelled.">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline-dark" onClick={() => setConfirm(true)}>
            <RefreshCcw /> Reset demo data
          </Button>
          <span className="self-center text-xs text-on-dark-muted">Data loaded {seededAt ? formatRelative(seededAt) : "—"}</span>
        </div>
      </PageIntro>
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <section aria-labelledby="roles-t">
            <h2 id="roles-t" className="font-display text-xl font-semibold text-ink-strong">
              Choose a role
            </h2>
            <p className="mt-1 text-sm text-muted">No credentials are checked. Production authentication is designed separately (MFA, OTP, RBAC).</p>
            <div className="mt-5">
              <DemoRoleGrid columns={2} />
            </div>
          </section>
          <section aria-labelledby="sc-t">
            <h2 id="sc-t" className="font-display text-xl font-semibold text-ink-strong">
              Suggested scenarios
            </h2>
            <ol className="mt-5 space-y-3">
              {SCENARIOS.map((s) => (
                <li key={s.title} className="flex gap-4 rounded-xl border border-line bg-surface p-4">
                  <s.icon className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden />
                  <div>
                    <p className="font-medium text-ink-strong">{s.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{s.steps}</p>
                    <p className="mt-2 text-xs text-subtle">Start as: {s.role}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Callout tone="info" className="mt-5" icon={CheckCircle2}>
              A full presenter script is in DEMO_GUIDE.md in the repository.
            </Callout>
          </section>
        </div>
      </Container>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Reset all demo data?"
        description="All applications, signatures, votes, inspections and tickets return to their starting state."
        confirmLabel="Yes, reset"
        tone="danger"
        onConfirm={() => {
          reset();
          setConfirm(false);
          toast.success("Demo data reset");
        }}
      />
    </>
  );
}
