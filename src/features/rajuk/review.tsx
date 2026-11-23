"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRightLeft,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleSlash,
  ClipboardCheck,
  Eye,
  FileText,
  Gavel,
  Hand,
  ImageIcon,
  Lock,
  MapPin,
  MessageSquarePlus,
  Minus,
  PenLine,
  Send,
  ShieldCheck,
  Stamp,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DecisionLetter, letterKindFor } from "@/components/domain/decision-letter";
import { DocumentPreview } from "@/components/domain/document-preview";
import { MfaDialog } from "@/components/domain/mfa-dialog";
import { SiteMap } from "@/components/domain/site-map";
import { HoldingIndicator, StageTrack, StatusBadge } from "@/components/domain/status";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, Tag, Timeline } from "@/components/ui/display";
import { Callout, EmptyState, ProgressBar } from "@/components/ui/feedback";
import { Field, Select, Textarea } from "@/components/ui/form";
import { ConfirmDialog, Dialog, DialogContent, Tabs, TabsContent, TabsList, TabsTrigger, Tooltip } from "@/components/ui/overlay";
import { toast } from "@/components/ui/toast";
import { farFor } from "@/features/wizard/validation";
import { eventsToTimeline } from "@/features/workspace/application-detail";
import { checklistCompletion, REVIEW_CHECKLIST } from "@/lib/domain/checklists";
import type { Application, DepartmentKey, DocumentRecord, StageKey } from "@/lib/domain/types";
import { flowFor, nextStage, ROUTABLE_DEPARTMENTS } from "@/lib/domain/workflow";
import { useI18n } from "@/lib/i18n";
import { useLabels } from "@/lib/i18n/labels";
import { ecps } from "@/lib/services";
import { useDemoStore, userName } from "@/lib/store/demo-store";
import { cn, formatDateTime, formatRelative, workingDaysBetween } from "@/lib/utils";
import { candidatesFor, useRajukData } from "./hooks";

type Action = "forward" | "route" | "correction" | "committee" | "approve" | "reject" | "return" | null;

export function ReviewWorkspace({ id }: { id: string }) {
  const { t, locale } = useI18n();
  const L = useLabels();
  const { me, users, applications } = useRajukData();
  const app = applications.find((a) => a.id === id);
  const audit = useDemoStore((s) => s.audit);
  const far = useDemoStore((s) => s.far);
  const security = useDemoStore((s) => s.security);
  const [taking, setTaking] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [regen, setRegen] = useState(false);
  const [regenReason, setRegenReason] = useState("");
  const regenerateLetter = useDemoStore((s) => s.regenerateLetter);

  if (!app) return <EmptyState title={t("rv.notFound")} body={t("rv.notFoundBody")} action={<Button asChild><Link href="/rajuk/inbox">{t("rv.backInbox")}</Link></Button>} />;

  const isHolder = app.holderId === me?.id;
  const unassignedFrontDesk = app.stage === "front_desk" && !app.holderId;
  const canTake = unassignedFrontDesk && (me?.role === "officer" || me?.role === "inspector");
  const fileAudit = audit.filter((a) => a.target.includes(app.ref) || a.target.includes(app.id));
  const checklist = checklistCompletion(REVIEW_CHECKLIST, app.checklist);
  const elapsed = app.submittedAt ? workingDaysBetween(app.submittedAt) : 0;
  const letterKind = letterKindFor(app);

  const take = async () => {
    setTaking(true);
    await ecps.files.take(app.id);
    setTaking(false);
    toast.success(t("rv.taken"));
  };

  return (
    <div className="-mt-2">
      {/* File header */}
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <Link href="/rajuk/inbox" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink-strong">
            <ArrowLeft className="size-4" aria-hidden /> {t("rv.inbox")}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="ref text-2xl font-semibold tracking-tight text-ink-strong">{app.ref}</h1>
            <StatusBadge status={app.status} />
            {app.priority === "high" && <Badge tone="danger">{t("rk.priority")}</Badge>}
            {app.legacy && <Tag>{t("rv.legacyCp")}</Tag>}
          </div>
          <p className="mt-1 text-[0.9375rem] text-ink">
            {app.title} <span className="text-muted">· {L.service(app.type)}</span>
          </p>
          {letterKind && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setLetterOpen(true)}>
                <FileText /> {t("rv.letter", { v: app.letterVersion ?? 1 })}
              </Button>
              {me?.role === "officer" && (
                <Button size="sm" variant="ghost" onClick={() => { setRegen(true); setRegenReason(""); }}>
                  {t("rv.regen")}
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="grid w-full grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line text-sm sm:grid-cols-3 xl:w-auto">
          <div className="bg-surface px-4 py-2.5">
            <p className="text-[0.6875rem] text-muted">{t("rv.holder")}</p>
            <p className="mt-0.5 flex items-center gap-2 font-medium text-ink-strong">
              {app.holderName ? (
                <>
                  <Avatar name={app.holderName} size="xs" /> {isHolder ? t("rv.you") : app.holderName}
                </>
              ) : (
                <span className="text-muted">{app.stage === "front_desk" ? t("rv.fdQueue") : "—"}</span>
              )}
            </p>
          </div>
          <div className="bg-surface px-4 py-2.5">
            <p className="text-[0.6875rem] text-muted">{t("rv.atStage", { stage: L.stage(app.stage) })}</p>
            <div className="mt-0.5">
              <HoldingIndicator app={app} />
            </div>
          </div>
          <div className="bg-surface px-4 py-2.5">
            <p className="text-[0.6875rem] text-muted">{t("rv.since")}</p>
            <p className="tabular mt-0.5 font-medium text-ink-strong">{t("rv.workingDays", { n: elapsed })}</p>
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-line bg-surface px-5 py-4">
        <StageTrack type={app.type} stage={app.stage} status={app.status} showLabels />
      </div>

      {!isHolder && (
        <Callout
          tone={canTake ? "info" : "demo"}
          icon={canTake ? Hand : Lock}
          className="mb-5"
          title={canTake ? t("rv.waitingTitle") : t("rv.readOnlyTitle", { who: app.holderName ?? t("rv.anotherDesk") })}
          action={
            canTake ? (
              <Button size="sm" onClick={take} loading={taking}>
                {t("rv.takeBtn")}
              </Button>
            ) : undefined
          }
        >
          {canTake ? t("rv.takeBody") : t("rv.readOnlyBody")}
        </Callout>
      )}

      <KeyFacts app={app} far={far} users={users} />

      <Dialog open={letterOpen} onOpenChange={setLetterOpen}>
        <DialogContent size="xl" eyebrow={app.ref} title={t("rv.letterTitle")}>
          {letterKind && <DecisionLetter app={app} users={users} kind={letterKind} />}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={regen}
        onOpenChange={setRegen}
        eyebrow={`${app.ref} · TOR 1.16`}
        title={t("rv.regenTitle")}
        description={t("rv.regenDesc")}
        confirmLabel={t("rv.regenYes")}
        confirmDisabled={regenReason.trim().length < 10}
        onConfirm={() => {
          regenerateLetter(app.id, regenReason.trim());
          setRegen(false);
          toast.success(t("rv.regenToast"), t("rv.regenToastBody", { v: (app.letterVersion ?? 1) + 1 }));
        }}
      >
        <Field label={t("rv.regenReason")} required hint={t("rv.regenHint")}>
          {(a) => <Textarea {...a} rows={3} value={regenReason} onChange={(e) => setRegenReason(e.target.value)} />}
        </Field>
      </ConfirmDialog>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_23rem]">
        {/* Centre: document viewer */}
        <section aria-label={t("rv.documents")} className="min-w-0">
          <DocumentViewer app={app} />
        </section>

        {/* Right: review tools */}
        <aside aria-label={t("rv.tools")} className="min-w-0 space-y-5">
          {isHolder && ["submitted", "in_review", "correction_requested"].includes(app.status) && <DecisionPanel app={app} checklist={checklist} mfaRequired={security.mfaOnApproval} />}
          {isHolder && app.stage === "signing" && (
            <Callout tone="info" title={t("rv.signReady")} action={<Button asChild size="sm"><Link href={`/rajuk/signing/sp-${app.id.replace("a-", "")}`}>{t("rv.openSigning")}</Link></Button>}>
              {t("rv.signReadyBody")}
            </Callout>
          )}
          {app.stage === "bc_committee" && (
            <Callout tone="info" icon={Gavel} title={t("rv.listed")} action={<Button asChild size="sm" variant="secondary"><Link href="/rajuk/committee">{t("rv.agenda")}</Link></Button>}>
              {t("rv.listedBody", { n: app.presentations })}
            </Callout>
          )}
          <Tabs defaultValue="checklist" className="rounded-xl border border-line bg-surface">
            <TabsList className="px-4 pt-2">
              <TabsTrigger value="checklist">
                <ClipboardCheck /> {t("rv.tab.checklist")}
              </TabsTrigger>
              <TabsTrigger value="notes">
                <MessageSquarePlus /> {t("rv.tab.notes")}
              </TabsTrigger>
              <TabsTrigger value="timeline">{t("rv.tab.timeline")}</TabsTrigger>
              <TabsTrigger value="audit">{t("rv.tab.audit")}</TabsTrigger>
            </TabsList>
            <TabsContent value="checklist" className="p-4">
              <ChecklistPanel app={app} editable={isHolder} />
            </TabsContent>
            <TabsContent value="notes" className="p-4">
              <ObservationsPanel app={app} users={users} canAdd={isHolder || me?.role === "officer" || me?.role === "estate"} />
            </TabsContent>
            <TabsContent value="timeline" className="scrollbar-thin max-h-[34rem] overflow-y-auto p-4">
              <Timeline items={eventsToTimeline(app, users, { internal: true, label: L.act, stage: L.stage })} />
            </TabsContent>
            <TabsContent value="audit" className="p-4">
              {fileAudit.length === 0 ? (
                <p className="text-sm text-muted">{t("rv.auditEmpty")}</p>
              ) : (
                <ol className="space-y-3 text-sm">
                  {fileAudit.map((a) => (
                    <li key={a.id} className="border-l-2 border-line pl-3">
                      <p className="ref text-xs text-teal-800">{a.action}</p>
                      <p className="text-ink">
                        {userName(users, a.actorId)} — {a.detail}
                      </p>
                      <p className="text-xs text-muted">
                        {formatDateTime(a.at, locale)} · {a.ip}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-4 text-xs text-muted">{t("rv.auditFull")}</p>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}

/* ———————————————————————————— Summary ———————————————————————————— */

function KeyFacts({ app, far, users }: { app: Application; far: ReturnType<typeof useDemoStore.getState>["far"]; users: ReturnType<typeof useRajukData>["users"] }) {
  const b = app.building;
  const limits = farFor(far, app.property.plotAreaSqm, app.property.roadWidthM);
  const proposed = b ? b.totalFloorAreaSqm / app.property.plotAreaSqm : 0;
  const farOk = !limits || proposed <= limits.far;
  const { t } = useI18n();
  const L = useLabels();
  const pros = app.professionals.filter((p) => p.status === "accepted");
  const cell = (k: string, v: React.ReactNode, extra?: string) => (
    <div className={cn("min-w-0 bg-surface px-4 py-3", extra)}>
      <dt className="text-[0.6875rem] text-muted">{k}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-ink-strong">{v}</dd>
    </div>
  );
  return (
    <dl aria-label={t("rv.keyFacts")} className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4 xl:grid-cols-8">
      {cell(t("rv.f.owners"), app.owners.map((o) => o.name).join(", "), "col-span-2")}
      {cell(t("rv.f.subzone"), <span className="ref" title={t("rv.f.subzoneTitle", { zone: L.zone(app.property.zone), sub: app.property.subZone, block: app.property.block ?? "—" })}>{app.property.subZone} · {app.property.block}</span>)}
      {cell(t("rv.f.mouza"), <>{app.property.mouza} · <span className="ref">{app.property.rsDag}</span></>)}
      {cell(t("rv.f.plot"), t("rv.f.plotVal", { area: app.property.plotAreaSqm, road: app.property.roadWidthM }))}
      {cell(t("rv.f.building"), b ? t("rv.f.buildingVal", { occ: b.occupancy, storeys: `${b.storeys}${b.basements ? `+B${b.basements}` : ""}`, units: b.units }) : "—")}
      <div className={cn("min-w-0 px-4 py-3", farOk ? "bg-surface" : "bg-amber-50")}>
        <dt className="text-[0.6875rem] text-muted">{t("rv.f.far")}</dt>
        <dd className={cn("mt-0.5 flex items-center gap-1.5 text-sm font-medium", farOk ? "text-ink-strong" : "text-amber-700")}>
          <span className="tabular">{proposed ? proposed.toFixed(2) : "—"}</span>
          <span className="text-muted">/ {limits?.far.toFixed(1) ?? "—"}</span>
          {farOk ? <Check className="size-3.5 text-success-700" aria-label={t("rv.f.within")} /> : <AlertTriangle className="size-3.5" aria-label={t("rv.f.exceeds")} />}
        </dd>
      </div>
      {cell(t("rv.f.pros"), <span title={pros.map((p) => `${users.find((u) => u.id === p.userId)?.name} (${L.pro(p.role)})`).join(", ")}>{t("rv.f.prosVal", { n: pros.length })}</span>)}
    </dl>
  );
}

/* ———————————————————————————— Document viewer ———————————————————————————— */

function DocumentViewer({ app }: { app: Application }) {
  const { t } = useI18n();
  const L = useLabels();
  const docs = app.documents.filter((d) => d.status !== "superseded");
  const ordered = useMemo(() => {
    const order = ["drawing", "certificate", "professional", "plot_photo", "road_photo", "ownership", "nid", "tax_return", "photo", "noc", "letter"];
    return [...docs].sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
  }, [docs]);
  const [idx, setIdx] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const current: DocumentRecord | undefined = ordered[Math.min(idx, ordered.length - 1)];
  const superseded = app.documents.filter((d) => d.status === "superseded");

  if (!current) return <EmptyState icon={FileText} title={t("rv.noDocs")} />;
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} aria-label={t("rv.prevDoc")}>
            <ChevronLeft />
          </Button>
          <span className="tabular text-xs text-muted">
            {idx + 1} / {ordered.length}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={() => setIdx((i) => Math.min(ordered.length - 1, i + 1))} disabled={idx >= ordered.length - 1} aria-label={t("rv.nextDoc")}>
            <ChevronRight />
          </Button>
          <span className="ml-1 truncate text-sm font-medium text-ink-strong">{current.name}</span>
          <Tag>v{current.version}</Tag>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted sm:inline">{L.doc(current.category)}{current.ownerIndex !== undefined ? ` · ${app.owners[current.ownerIndex]?.name}` : ""}</span>
          {app.location && (
            <Button variant={showMap ? "subtle" : "ghost"} size="sm" onClick={() => setShowMap((v) => !v)} aria-pressed={showMap}>
              <MapPin /> {t("rv.map")}
            </Button>
          )}
        </div>
      </div>
      <div className="grid md:grid-cols-[11.5rem_minmax(0,1fr)]">
        <nav aria-label={t("rv.docList")} className="scrollbar-thin max-h-[40rem] overflow-y-auto border-b border-line md:border-b-0 md:border-r">
          <ul className="p-2">
            {ordered.map((d, i) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => {
                    setIdx(i);
                    setShowMap(false);
                  }}
                  aria-current={i === idx ? "true" : undefined}
                  className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors", i === idx ? "bg-teal-50 text-teal-800" : "text-ink hover:bg-surface-3")}
                >
                  {d.previewKind === "photo" ? <ImageIcon className="size-3.5 shrink-0" aria-hidden /> : d.previewKind === "drawing" ? <Building2 className="size-3.5 shrink-0" aria-hidden /> : <FileText className="size-3.5 shrink-0" aria-hidden />}
                  <span className="truncate">{d.drawingSheet ? t("rv.sheet", { sheet: L.sheet(d.drawingSheet) }) : d.service ? t("rv.serviceDoc", { svc: L.pro(d.service) }) : L.doc(d.category)}</span>
                  {d.status === "verified" && <Check className="ml-auto size-3 shrink-0 text-success-700" aria-label={t("rv.verified")} />}
                </button>
              </li>
            ))}
          </ul>
          {superseded.length > 0 && <p className="border-t border-line px-3 py-2 text-[0.6875rem] text-muted">{t("rv.superseded", { n: superseded.length })}</p>}
        </nav>
        <div className="bg-canvas p-4 sm:p-6">
          {showMap && app.location ? <SiteMap lat={app.location.lat} lng={app.location.lng} height={420} label={t("rv.plotLocation")} /> : <DocumentPreview doc={current} app={app} />}
        </div>
      </div>
    </div>
  );
}

/* ———————————————————————————— Checklist ———————————————————————————— */

function ChecklistPanel({ app, editable }: { app: Application; editable: boolean }) {
  const { t } = useI18n();
  const L = useLabels();
  const c = checklistCompletion(REVIEW_CHECKLIST, app.checklist);
  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-ink-strong">
            {t("rv.chkDone", { done: c.done, total: c.total })}
          </span>
          {c.failed > 0 && <span className="font-medium text-danger-700">{t("rv.chkFailed", { n: c.failed })}</span>}
        </div>
        <ProgressBar value={c.done / c.total} className="mt-2" tone={c.failed ? "amber" : "teal"} label={t("rv.chkProgress")} />
      </div>
      <div className="space-y-5">
        {REVIEW_CHECKLIST.map((sec) => (
          <fieldset key={sec.id}>
            <legend className="mb-2 flex w-full items-center justify-between gap-2">
              <span className="text-sm font-semibold text-ink-strong">{L.chkSection(sec.id)}</span>
              <span className="font-mono text-[0.625rem] text-subtle">{L.chkSource(sec.id)}</span>
            </legend>
            <ul className="space-y-1.5">
              {sec.items.map((it) => {
                const st = app.checklist[it.id]?.result ?? null;
                return (
                  <li key={it.id} className="flex items-start gap-2 rounded-md px-1 py-1">
                    <p className="min-w-0 flex-1 text-[0.8125rem] leading-snug text-ink">
                      {L.chkItem(it.id)}
                      {it.hint && <span className="block text-[0.6875rem] text-subtle">{L.chkHint(it.id)}</span>}
                    </p>
                    <div role="radiogroup" aria-label={L.chkItem(it.id)} className="flex shrink-0 overflow-hidden rounded-md border border-line">
                      {(
                        [
                          ["pass", Check, t("chk.pass"), "bg-success-600 text-white"],
                          ["fail", X, t("chk.fail"), "bg-danger-600 text-white"],
                          ["na", Minus, t("chk.na"), "bg-muted text-surface"],
                        ] as const
                      ).map(([v, Icon, label, on]) => (
                        <Tooltip key={v} content={label}>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={st === v}
                            aria-label={label}
                            disabled={!editable}
                            onClick={() => void ecps.files.setChecklistItem(app.id, { id: it.id, result: st === v ? null : v })}
                            className={cn("grid size-7 place-items-center border-l border-line first:border-l-0 disabled:cursor-not-allowed", st === v ? on : "bg-surface text-subtle hover:bg-surface-3")}
                          >
                            <Icon className="size-3.5" aria-hidden />
                          </button>
                        </Tooltip>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ))}
      </div>
      <p className="mt-4 text-[0.6875rem] leading-relaxed text-subtle">{t("rv.chkNote")}</p>
      {!editable && <p className="mt-2 text-xs text-muted">{t("rv.chkReadOnly")}</p>}
    </div>
  );
}

/* ———————————————————————————— Observations ———————————————————————————— */

function ObservationsPanel({ app, users, canAdd }: { app: Application; users: ReturnType<typeof useRajukData>["users"]; canAdd: boolean }) {
  const { t, locale } = useI18n();
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState<"internal" | "applicant">("internal");
  const [busy, setBusy] = useState(false);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 3) return;
    setBusy(true);
    await ecps.files.addObservation(app.id, text.trim(), visibility);
    setBusy(false);
    setText("");
    toast.success(visibility === "internal" ? t("rv.noteAdded") : t("rv.obsShared"));
  };
  return (
    <div>
      {canAdd && (
        <form onSubmit={add} className="mb-5 space-y-2">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder={t("rv.obsPlaceholder")} aria-label={t("rv.obs")} />
          <div className="flex items-center justify-between gap-2">
            <Select value={visibility} onChange={(e) => setVisibility(e.target.value as "internal" | "applicant")} aria-label={t("rv.visibility")} className="h-8 text-xs">
              <option value="internal">{t("rv.internalNote")}</option>
              <option value="applicant">{t("rv.visibleApplicant")}</option>
            </Select>
            <Button type="submit" size="sm" loading={busy} disabled={text.trim().length < 3}>
              {t("rv.add")}
            </Button>
          </div>
        </form>
      )}
      {app.observations.length === 0 ? (
        <p className="text-sm text-muted">{t("rv.noObs")}</p>
      ) : (
        <ul className="space-y-3">
          {[...app.observations].reverse().map((o) => (
            <li key={o.id} className={cn("rounded-lg border p-3 text-sm", o.visibility === "internal" ? "border-line bg-surface-2" : "border-teal-600/25 bg-teal-50/60")}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-ink-strong">{userName(users, o.authorId)}</span>
                <span className="flex items-center gap-1 text-muted">
                  {o.visibility === "internal" ? <Lock className="size-3" aria-hidden /> : <Eye className="size-3" aria-hidden />}
                  {o.visibility === "internal" ? t("rv.internal") : t("rv.applicant")} · {formatRelative(o.at, undefined, locale)}
                </span>
              </div>
              <p className="text-ink">{o.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ———————————————————————————— Decision panel ———————————————————————————— */

function DecisionPanel({ app, checklist, mfaRequired }: { app: Application; checklist: ReturnType<typeof checklistCompletion>; mfaRequired: boolean }) {
  const { t, term } = useI18n();
  const L = useLabels();
  const { users } = useRajukData();
  const [action, setAction] = useState<Action>(null);
  const [note, setNote] = useState("");
  const [recipient, setRecipient] = useState("");
  const [dept, setDept] = useState<DepartmentKey>("town_planning");
  const [busy, setBusy] = useState(false);
  const [mfaFor, setMfaFor] = useState<"approve" | "reject" | null>(null);
  const [err, setErr] = useState("");

  const flow = flowFor(app.type);
  const nxt: StageKey | undefined = nextStage(app);
  const isCommitteeFlow = flow.includes("bc_committee");
  const atDecisionStage = (isCommitteeFlow && app.stage === "authorized_officer") || (!isCommitteeFlow && nxt === "signing");
  const candidates = nxt ? candidatesFor(nxt, users, app.property.zone) : [];
  const fromDept = app.stage === "department_review";
  const returnTo = [...app.history].reverse().find((h) => h.action === "routed")?.fromStage ?? flow[1];

  const open = (a: Action) => {
    setAction(a);
    setNote("");
    setErr("");
    setRecipient(candidates[0]?.id ?? "");
  };

  const run = async () => {
    if ((action === "correction" || action === "reject") && note.trim().length < 10) return setErr(t("rv.err.reason"));
    if (action === "forward" && candidates.length > 0 && !recipient) return setErr(t("rv.err.recipient"));
    setBusy(true);
    if (action === "forward" && nxt) await ecps.files.forward(app.id, nxt, recipient || undefined, note.trim());
    if (action === "return") await ecps.files.forward(app.id, returnTo as StageKey, [...app.history].reverse().find((h) => h.action === "routed")?.actorId, t("rv.opinion", { note: note.trim() || t("rv.noObjection") }));
    if (action === "route") await ecps.files.routeToDepartment(app.id, dept, note.trim() || t("rv.forOpinion"));
    if (action === "correction") await ecps.files.requestCorrection(app.id, note.trim());
    if (action === "committee") await ecps.files.listForCommittee(app.id);
    setBusy(false);
    const msg = { forward: t("rv.t.forward"), return: t("rv.t.return"), route: t("rv.t.route"), correction: t("rv.t.correction"), committee: t("rv.t.committee"), approve: "", reject: "" }[action!];
    setAction(null);
    toast.success(msg, t("rv.t.recorded"));
  };

  const decide = async (d: "approve" | "reject") => {
    if (d === "reject" && note.trim().length < 10) {
      setErr(t("rv.err.reasonShort"));
      return;
    }
    if (mfaRequired) {
      setMfaFor(d);
      return;
    }
    await finishDecision(d);
  };

  const finishDecision = async (d: "approve" | "reject") => {
    setBusy(true);
    await ecps.files.decide(app.id, d === "approve" ? "approved" : "rejected", note.trim() || (d === "approve" ? t("rv.approvedNote") : ""));
    setBusy(false);
    setAction(null);
    toast.success(d === "approve" ? t("rv.t.approved") : t("rv.t.rejected"), t("rv.t.mfa"));
  };

  return (
    <section aria-labelledby="decide-title" className="overflow-hidden rounded-xl border border-navy-900/15 bg-surface shadow-sm">
      <header className="on-dark flex items-center justify-between bg-navy-900 px-4 py-3 text-on-dark">
        <h2 id="decide-title" className="font-display text-sm font-semibold text-white">
          {t("rv.process")}
        </h2>
        <span className="text-xs text-on-dark-muted">{t("rv.youHold")}</span>
      </header>
      <div className="space-y-2 p-4">
        {fromDept ? (
          <Button className="w-full justify-start" onClick={() => open("return")}>
            <Send /> {t("rv.returnOpinion")}
          </Button>
        ) : (
          <>
            {atDecisionStage && isCommitteeFlow && (
              <Button className="w-full justify-start" onClick={() => open("committee")}>
                <Gavel /> {t("rv.listBcc")}
              </Button>
            )}
            {atDecisionStage && !isCommitteeFlow && (
              <Button className="w-full justify-start" onClick={() => open("approve")}>
                <Stamp /> {t("rv.approve")}
              </Button>
            )}
            {!atDecisionStage && nxt && (
              <Button className="w-full justify-start" onClick={() => open("forward")}>
                <Send /> {t("rv.forwardTo", { stage: L.stage(nxt) })}
              </Button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" className="justify-start" onClick={() => open("route")}>
                <ArrowRightLeft /> {t("rv.route")}
              </Button>
              <Button variant="secondary" className="justify-start" onClick={() => open("correction")}>
                <PenLine /> {t("rv.correction")}
              </Button>
            </div>
            {(atDecisionStage || app.stage === "front_desk") && (
              <Button variant="danger-outline" className="w-full justify-start" onClick={() => open("reject")}>
                <CircleSlash /> {t("rv.reject")}
              </Button>
            )}
          </>
        )}
        <p className="flex items-center gap-1.5 pt-1 text-[0.6875rem] text-muted">
          <ShieldCheck className="size-3.5" aria-hidden /> {t("rv.yesNo")}
        </p>
      </div>

      {/* Confirmation dialogs */}
      <ConfirmDialog
        open={action === "forward" || action === "route" || action === "correction" || action === "committee" || action === "return"}
        onOpenChange={(o) => !o && setAction(null)}
        eyebrow={t("rv.confirmMove", { ref: app.ref })}
        title={
          action === "forward"
            ? t("rv.q.forward", { stage: nxt ? L.stage(nxt) : "" })
            : action === "route"
              ? t("rv.q.route")
              : action === "correction"
                ? t("rv.q.correction")
                : action === "committee"
                  ? t("rv.q.committee", { n: app.presentations >= 1 ? 2 : 1 })
                  : t("rv.q.return")
        }
        description={action === "correction" ? t("rv.d.correction") : t("rv.d.move")}
        confirmLabel={t("rv.yesConfirm")}
        cancelLabel={t("rv.noBack")}
        loading={busy}
        onConfirm={run}
      >
        <div className="space-y-4">
          {action === "forward" && checklist.done < checklist.total && (
            <Callout tone="warning">
              {checklist.failed ? t("rv.chkWarnFailed", { done: checklist.done, total: checklist.total, n: checklist.failed }) : t("rv.chkWarn", { done: checklist.done, total: checklist.total })}
            </Callout>
          )}
          {action === "forward" && candidates.length > 0 && (
            <Field label={t("rv.receiving")} required>
              {(a) => (
                <Select {...a} value={recipient} onChange={(e) => setRecipient(e.target.value)}>
                  {candidates.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {term("desig", u.designation)}
                      {u.zone ? `, ${term("zone", u.zone)}` : ""}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
          {action === "route" && (
            <Field label={t("rv.department")} required hint={t("rv.deptHint")}>
              {(a) => (
                <Select {...a} value={dept} onChange={(e) => setDept(e.target.value as DepartmentKey)}>
                  {ROUTABLE_DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {L.dept(d)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
          {action === "committee" && app.presentations >= 1 && (
            <Callout tone="info">{t("rv.secondPres")}</Callout>
          )}
          {action !== "committee" && (
            <Field label={action === "correction" ? t("rv.whatCorrect") : t("rv.note")} required={action === "correction"} optional={action !== "correction"} error={err}>
              {(a) => <Textarea {...a} rows={3} value={note} onChange={(e) => { setNote(e.target.value); setErr(""); }} />}
            </Field>
          )}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={action === "approve" || action === "reject"}
        onOpenChange={(o) => !o && setAction(null)}
        eyebrow={t("rv.decisionEyebrow", { ref: app.ref })}
        title={action === "approve" ? t("rv.q.approve") : t("rv.q.reject")}
        description={action === "approve" ? t("rv.d.approve") : t("rv.d.reject")}
        confirmLabel={action === "approve" ? t("rv.yesApprove") : t("rv.yesReject")}
        cancelLabel={t("rv.noBack")}
        tone={action === "reject" ? "danger" : "navy"}
        loading={busy}
        onConfirm={() => decide(action as "approve" | "reject")}
      >
        <Field label={action === "reject" ? t("rv.rejectReason") : t("rv.decisionNote")} required={action === "reject"} optional={action === "approve"} error={err}>
          {(a) => <Textarea {...a} rows={3} value={note} onChange={(e) => { setNote(e.target.value); setErr(""); }} />}
        </Field>
        {mfaRequired && <p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><ShieldCheck className="size-3.5" aria-hidden /> {t("rv.mfaNote")}</p>}
      </ConfirmDialog>

      <MfaDialog open={mfaFor !== null} onOpenChange={(o) => !o && setMfaFor(null)} action={mfaFor === "approve" ? t("rv.mfaApprove") : t("rv.mfaReject")} onVerified={() => finishDecision(mfaFor!)} />
    </section>
  );
}
