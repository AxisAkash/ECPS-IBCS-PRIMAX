"use client";

import { ArrowLeft, ArrowRight, BadgeCheck, Ban, Check, ChevronLeft, ChevronRight, FileCheck2, FileSignature, KeyRound, Layers, Lock, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DrawingSheet, type SheetSignature } from "@/components/domain/drawing-sheet";
import { MfaDialog } from "@/components/domain/mfa-dialog";
import { StatusBadge } from "@/components/domain/status";
import { Button } from "@/components/ui/button";
import { Badge, PageHeader, Panel, Tag } from "@/components/ui/display";
import { Callout, EmptyState, ProgressBar, SimulatedTag, Spinner } from "@/components/ui/feedback";
import { toast } from "@/components/ui/toast";
import type { SigningPackage } from "@/lib/domain/types";
import { ecps } from "@/lib/services";
import { useDemoStore, userName } from "@/lib/store/demo-store";
import { cn, formatDate, formatDateTime, sleep } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useLabels } from "@/lib/i18n/labels";
import { msgText } from "@/lib/i18n/notify";

export function SigningQueue() {
  const { t, term } = useI18n();
  const session = useDemoStore((s) => s.session);
  const packages = useDemoStore((s) => s.signing);
  const applications = useDemoStore((s) => s.applications);
  const users = useDemoStore((s) => s.users);
  const mine = packages.filter((p) => p.requiredSignerIds.includes(session?.userId ?? ""));
  const waiting = mine.filter((p) => p.status === "awaiting" && !p.signatures.some((s) => s.signerId === session?.userId));
  const done = mine.filter((p) => !waiting.includes(p));
  const row = (p: SigningPackage) => {
    const a = applications.find((x) => x.id === p.applicationId);
    const signable = p.sheets.filter((s) => s.signable).length;
    return (
      <li key={p.id}>
        <Link href={`/rajuk/signing/${p.id}`} className="group grid gap-3 px-5 py-4 transition-colors hover:bg-surface-2 md:grid-cols-[minmax(0,1fr)_10rem_10rem_8rem] md:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700">
              <FileSignature className="size-[18px]" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="ref text-sm font-medium text-ink-strong group-hover:text-teal-700">{a?.ref}</p>
              <p className="truncate text-xs text-muted">
                {term("pkg", p.title)} · {a?.title}
              </p>
            </div>
          </div>
          <span className="text-sm text-ink">
            {t("sg.version")} <span className="ref font-medium">v{p.version}</span> · {t("sg.locked")}
          </span>
          <span className="text-sm text-ink">
            {t("sg.pagesSigned", { n: signable, done: p.signatures.length, total: p.requiredSignerIds.length })}
          </span>
          <span className="flex items-center justify-between gap-2 md:justify-end">
            {p.status === "signed" ? <Badge tone="success">{t("sg.signed")}</Badge> : <Badge tone="accent">{t("sg.awaiting")}</Badge>}
            <ArrowRight className="size-4 text-subtle" aria-hidden />
          </span>
        </Link>
      </li>
    );
  };
  return (
    <div>
      <PageHeader
        kicker="TOR 1.4 · 1.5 · 1.13"
        title={t("sg.title")}
        description={t("sg.desc")}
        meta={<SimulatedTag>{t("sg.simulated")}</SimulatedTag>}
      />
      <div className="space-y-6">
        <Panel title={t("sg.awaitingYou", { n: waiting.length })} bodyClassName="p-0">
          {waiting.length === 0 ? <div className="p-5"><EmptyState icon={FileSignature} title={t("sg.nothing")} body={t("sg.nothingBody")} /></div> : <ul className="divide-y divide-line">{waiting.map(row)}</ul>}
        </Panel>
        <Panel title={t("sg.recent")} bodyClassName="p-0">
          {done.length === 0 ? <p className="px-5 py-6 text-sm text-muted">{t("sg.noneSigned")}</p> : <ul className="divide-y divide-line">{done.map(row)}</ul>}
        </Panel>
        <p className="text-xs text-muted">{t("sg.signers", { names: Array.from(new Set(packages.flatMap((p) => p.requiredSignerIds))).map((id) => userName(users, id)).join(", ") })}</p>
      </div>
    </div>
  );
}

type Phase = "review" | "signing" | "done";

export function SigningWorkspace({ id }: { id: string }) {
  const { t, term, locale } = useI18n();
  const L = useLabels();
  const session = useDemoStore((s) => s.session);
  const packages = useDemoStore((s) => s.signing);
  const applications = useDemoStore((s) => s.applications);
  const users = useDemoStore((s) => s.users);
  const pkg = packages.find((p) => p.id === id);
  const app = applications.find((a) => a.id === pkg?.applicationId);
  const [page, setPage] = useState(1);
  const [cert, setCert] = useState<{ serial: string; issuer: string; validTo: string } | null>(null);
  const [checkingCert, setCheckingCert] = useState(false);
  const [preview, setPreview] = useState(false);
  const [mfa, setMfa] = useState(false);
  const [phase, setPhase] = useState<Phase>("review");
  const [progressPage, setProgressPage] = useState(0);

  const me = users.find((u) => u.id === session?.userId);
  const signableSheets = useMemo(() => pkg?.sheets.filter((s) => s.signable) ?? [], [pkg]);
  if (!pkg || !app || !me) return <EmptyState title={t("sg.notFound")} action={<Button asChild><Link href="/rajuk/signing">{t("sg.back")}</Link></Button>} />;

  const iMustSign = pkg.requiredSignerIds.includes(me.id);
  const alreadySigned = pkg.signatures.some((s) => s.signerId === me.id);
  const nextSlot = pkg.signatures.length + 1;
  const sheet = pkg.sheets.find((s) => s.page === page)!;
  const sigsOnPage: SheetSignature[] = pkg.signatures
    .filter((s) => s.pages.includes(page))
    .map((s) => {
      const u = users.find((x) => x.id === s.signerId);
      return { slot: s.slot, name: u?.name ?? "", designation: u?.designation ?? "", date: formatDate(s.signedAt), serial: s.certificateSerial };
    });
  const step = !cert ? 1 : !preview ? 2 : 3;
  const canSign = iMustSign && !alreadySigned && pkg.status === "awaiting" && phase === "review";

  const validate = async () => {
    setCheckingCert(true);
    const r = await ecps.signing.validateCertificate();
    setCert(r);
    setCheckingCert(false);
  };

  const sign = async () => {
    setPhase("signing");
    for (let i = 0; i < signableSheets.length; i++) {
      setProgressPage(i + 1);
      setPage(signableSheets[i]!.page);
      await sleep(380);
    }
    await ecps.signing.sign(pkg.id);
    setPhase("done");
    toast.success(t("sg.toast"), t("sg.toastBody"));
  };

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: t("sg.title"), href: "/rajuk/signing" }, { label: app.ref }]}
        kicker={t("sg.kicker")}
        title={term("pkg", pkg.title)}
        meta={
          <>
            <span className="ref text-sm text-muted">{app.ref}</span>
            <StatusBadge status={app.status} />
            <SimulatedTag>{t("sg.simCert")}</SimulatedTag>
          </>
        }
        actions={
          <Button asChild variant="secondary">
            <Link href={`/rajuk/files/${app.id}`}>
              <ArrowLeft /> {t("sg.openFile")}
            </Link>
          </Button>
        }
      />

      {/* Improvement strip */}
      <ul className="mb-6 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 xl:grid-cols-4" aria-label={t("sg.improvements")}>
        {[
          [Layers, t("sg.imp1"), t("sg.imp1d")],
          [Lock, t("sg.imp2"), t("sg.imp2d", { v: pkg.version })],
          [Ban, t("sg.imp3"), t("sg.imp3d")],
          [BadgeCheck, t("sg.imp4"), t("sg.imp4d")],
        ].map(([Icon, title, d]) => {
          const I = Icon as typeof Layers;
          return (
            <li key={title as string} className="flex items-start gap-3 bg-surface px-4 py-3.5">
              <I className="mt-0.5 size-4 shrink-0 text-teal-700" aria-hidden />
              <span>
                <span className="block text-sm font-medium text-ink-strong">{title as string}</span>
                <span className="block text-xs text-muted">{d as string}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="grid gap-5 xl:grid-cols-[9.5rem_minmax(0,1fr)_23rem]">
        {/* Thumbnails */}
        <nav aria-label={t("sg.pages")} className="order-2 xl:order-1">
          <ol className="flex gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible">
            {pkg.sheets.map((s) => {
              const count = pkg.signatures.filter((x) => x.pages.includes(s.page)).length;
              const willSign = preview && s.signable && canSign;
              return (
                <li key={s.page} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setPage(s.page)}
                    aria-current={page === s.page ? "page" : undefined}
                    className={cn("w-32 overflow-hidden rounded-lg border bg-surface text-left transition-[border-color,box-shadow] xl:w-full", page === s.page ? "border-teal-600 shadow-[0_0_0_2px_rgb(22_125_141/0.2)]" : "border-line hover:border-slate-ink/40")}
                  >
                    <div className="pointer-events-none relative">
                      <DrawingSheet kind={s.kind} title={s.title} page={s.page} total={pkg.sheets.length} appRef={app.ref} project={app.title} version={pkg.version} storeys={app.building?.storeys} signable={s.signable} />
                      {phase === "signing" && progressPage > 0 && signableSheets[progressPage - 1]?.page === s.page && <span className="absolute inset-0 grid place-items-center bg-teal-600/15"><Spinner className="size-5 text-teal-700" /></span>}
                    </div>
                    <div className="flex items-center justify-between gap-1 border-t border-line px-2 py-1.5">
                      <span className="truncate text-[0.6875rem] font-medium text-ink-strong">
                        {s.page}. {L.sheet(s.kind)}
                      </span>
                      {s.signable ? (
                        <span className={cn("tabular shrink-0 rounded-full px-1.5 text-[0.625rem] font-semibold", willSign ? "bg-amber-100 text-amber-700" : count ? "bg-teal-50 text-teal-800" : "bg-surface-3 text-muted")}>
                          {count}
                          {willSign ? "+1" : ""}
                        </span>
                      ) : (
                        <span className="shrink-0 text-[0.625rem] text-subtle">{t("sg.excluded")}</span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Page view */}
        <section aria-label={t("sg.preview")} className="order-1 min-w-0 xl:order-2">
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-2 px-4 py-2.5">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label={t("sg.prevPage")}>
                  <ChevronLeft />
                </Button>
                <span className="tabular text-sm text-ink">
                  {t("sg.pageOf", { page, total: pkg.sheets.length })}
                </span>
                <Button variant="ghost" size="icon-sm" onClick={() => setPage((p) => Math.min(pkg.sheets.length, p + 1))} disabled={page === pkg.sheets.length} aria-label={t("sg.nextPage")}>
                  <ChevronRight />
                </Button>
              </div>
              <span className="flex items-center gap-2 text-xs text-muted">
                <Tag>v{pkg.version}</Tag> {L.sheet(sheet.kind)}
              </span>
            </div>
            <div className="bg-canvas p-3 sm:p-6">
              <div className="mx-auto max-w-4xl overflow-hidden rounded border border-line shadow-md">
                <DrawingSheet
                  kind={sheet.kind}
                  title={sheet.title}
                  page={sheet.page}
                  total={pkg.sheets.length}
                  appRef={app.ref}
                  project={app.title}
                  version={pkg.version}
                  storeys={app.building?.storeys}
                  signatures={sigsOnPage}
                  previewSlot={preview && canSign ? nextSlot : undefined}
                  previewName={`${me.name} · ${me.designation}`}
                  signable={sheet.signable}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Signing panel */}
        <aside aria-label={t("sg.steps")} className="order-3 space-y-5">
          {phase === "done" || pkg.status === "signed" || alreadySigned ? (
            <SignedSummary pkg={pkg} appId={app.id} justSigned={phase === "done"} />
          ) : !iMustSign ? (
            <Callout tone="demo" title={t("sg.notSigner")}>
              {t("sg.required", { names: pkg.requiredSignerIds.map((r) => userName(users, r)).join(", ") })}
            </Callout>
          ) : (
            <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
              <div className="on-dark bg-navy-900 px-5 py-4 text-on-dark">
                <p className="font-display text-sm font-semibold text-white">{t("sg.signApproved")}</p>
                <p className="mt-0.5 text-xs text-on-dark-muted">
                  {me.name} · {L.desig(me.designation)}
                </p>
              </div>
              <ol className="divide-y divide-line">
                <SignStep n={1} title={t("sg.s1")} state="done">
                  <ul className="space-y-1.5 text-xs">
                    {pkg.versions.map((v) => (
                      <li key={v.version} className={cn("flex items-center justify-between gap-2", v.status === "superseded" && "text-subtle line-through decoration-line-strong")}>
                        <span>
                          <span className="ref">v{v.version}</span> · {term("ver", v.label)}
                        </span>
                        {v.status === "approved" ? <Badge tone="success" icon={Lock}>{t("sg.lockedBadge")}</Badge> : <span className="no-underline">{t("sg.blocked")}</span>}
                      </li>
                    ))}
                  </ul>
                </SignStep>
                <SignStep n={2} title={t("sg.s2")} state={cert ? "done" : "current"}>
                  {cert ? (
                    <dl className="grid grid-cols-[5.5rem_1fr] gap-y-1 text-xs">
                      <dt className="text-muted">{t("sg.serial")}</dt>
                      <dd className="ref text-ink-strong">{cert.serial}</dd>
                      <dt className="text-muted">{t("sg.issuer")}</dt>
                      <dd className="text-ink-strong">{cert.issuer}</dd>
                      <dt className="text-muted">{t("sg.validTo")}</dt>
                      <dd className="text-ink-strong">{formatDate(cert.validTo, locale)}</dd>
                      <dt className="text-muted">{t("sg.chain")}</dt>
                      <dd className="flex items-center gap-1 text-success-700">
                        <Check className="size-3.5" aria-hidden /> {t("sg.ok")} <SimulatedTag className="ml-1" />
                      </dd>
                    </dl>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={validate} loading={checkingCert}>
                      <KeyRound /> {t("sg.validate")}
                    </Button>
                  )}
                </SignStep>
                <SignStep n={3} title={t("sg.s3")} state={!cert ? "upcoming" : preview ? "done" : "current"}>
                  {cert && (
                    <div className="space-y-2.5">
                      <label className="flex items-center gap-2 text-sm text-ink">
                        <input type="checkbox" className="size-4 accent-teal-600" checked={preview} onChange={(e) => setPreview(e.target.checked)} />
                        {t("sg.showPlacement")}
                      </label>
                      {preview && (
                        <ul className="space-y-1 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                          <li>
                            {t("sg.slotOn", { slot: nextSlot, pages: signableSheets.map((s) => s.page).join(", ") })}
                          </li>
                          <li>{t("sg.noOverlap", { n: pkg.signatures.length })}</li>
                          <li>{t("sg.excludedRule", { sheets: pkg.sheets.filter((s) => !s.signable).map((s) => L.sheet(s.kind)).join(", ") || t("sg.noPages") })}</li>
                        </ul>
                      )}
                    </div>
                  )}
                </SignStep>
                <SignStep n={4} title={t("sg.s4")} state={step === 3 ? "current" : "upcoming"}>
                  {phase === "signing" ? (
                    <div aria-live="polite">
                      <p className="text-sm text-ink">
                        {t("sg.signingPage", { page: progressPage, total: signableSheets.length })}
                      </p>
                      <ProgressBar value={progressPage / signableSheets.length} className="mt-2" label={t("sg.progress")} />
                    </div>
                  ) : (
                    step === 3 && (
                      <Button className="w-full" onClick={() => setMfa(true)}>
                        <FileSignature /> {t("sg.signN", { n: signableSheets.length })}
                      </Button>
                    )
                  )}
                </SignStep>
              </ol>
            </div>
          )}

          <Panel title={t("sg.history")}>
            <ol className="space-y-3">
              {[...pkg.audit].reverse().map((a, i) => (
                <li key={i} className="text-sm">
                  <p className="text-ink">
                    {msgText(a, locale)} {a.simulated && <SimulatedTag className="ml-1" />}
                  </p>
                  <p className="text-xs text-muted">
                    {userName(users, a.actorId)} · {formatDateTime(a.at, locale)}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
        </aside>
      </div>
      <MfaDialog open={mfa} onOpenChange={setMfa} action={t("sg.mfaAction", { n: signableSheets.length, ref: app.ref })} onVerified={sign} />
    </div>
  );
}

function SignStep({ n, title, state, children }: { n: number; title: string; state: "done" | "current" | "upcoming"; children?: React.ReactNode }) {
  return (
    <li className={cn("px-5 py-4", state === "upcoming" && "opacity-55")} aria-current={state === "current" ? "step" : undefined}>
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className={cn("grid size-6 place-items-center rounded-full text-[0.6875rem] font-semibold", state === "done" ? "bg-teal-600 text-white" : state === "current" ? "bg-emphasis text-white" : "border border-line-strong text-muted")}>
          {state === "done" ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : n}
        </span>
        <p className="text-sm font-semibold text-ink-strong">{title}</p>
      </div>
      {state !== "upcoming" && <div className="pl-[2.125rem]">{children}</div>}
    </li>
  );
}

function SignedSummary({ pkg, appId, justSigned }: { pkg: SigningPackage; appId: string; justSigned: boolean }) {
  const { t, locale } = useI18n();
  const users = useDemoStore((s) => s.users);
  const app = useDemoStore((s) => s.applications.find((a) => a.id === appId));
  const marks = pkg.signatures.reduce((n, s) => n + s.pages.length, 0);
  return (
    <div className="overflow-hidden rounded-xl border border-success-600/30 bg-surface shadow-sm">
      <div className="flex items-start gap-3 bg-success-100/60 px-5 py-4">
        <FileCheck2 className="mt-0.5 size-5 text-success-700" aria-hidden />
        <div>
          <p className="font-display text-sm font-semibold text-success-700">{pkg.status === "signed" ? t("sg.allApplied") : t("sg.yoursApplied")}</p>
          <p className="mt-0.5 text-xs text-ink">
            {t("sg.marks", { marks, pages: pkg.sheets.filter((s) => s.signable).length })} <SimulatedTag className="ml-1" />
          </p>
        </div>
      </div>
      <ul className="divide-y divide-line">
        {pkg.signatures.map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-5 py-3 text-sm">
            <ShieldCheck className="size-4 text-teal-700" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-ink-strong">{userName(users, s.signerId)}</span>
              <span className="ref block text-xs text-muted">
                {t("sg.slot", { slot: s.slot, serial: s.certificateSerial })}
              </span>
            </span>
            <span className="text-xs text-muted">{formatDate(s.signedAt, locale)}</span>
          </li>
        ))}
      </ul>
      {justSigned && app && (
        <div className="border-t border-line bg-surface-2 px-5 py-4 text-sm">
          <p className="flex items-center gap-2 text-ink">
            <Sparkles className="size-4 text-amber-700" aria-hidden />
            {app.status === "fee_pending" ? t("sg.feeAsked") : t("sg.issued")}
          </p>
          <Button asChild size="sm" variant="secondary" className="mt-3">
            <Link href={`/rajuk/files/${appId}`}>{t("sg.viewTimeline")}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
