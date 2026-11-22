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
import { DocumentPreview } from "@/components/domain/document-preview";
import { MfaDialog } from "@/components/domain/mfa-dialog";
import { SiteMap } from "@/components/domain/site-map";
import { HoldingIndicator, StageTrack, StatusBadge } from "@/components/domain/status";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, Tag, Timeline } from "@/components/ui/display";
import { Callout, EmptyState, ProgressBar } from "@/components/ui/feedback";
import { Field, Select, Textarea } from "@/components/ui/form";
import { ConfirmDialog, Tabs, TabsContent, TabsList, TabsTrigger, Tooltip } from "@/components/ui/overlay";
import { toast } from "@/components/ui/toast";
import { farFor } from "@/features/wizard/validation";
import { eventsToTimeline } from "@/features/workspace/application-detail";
import { checklistCompletion, REVIEW_CHECKLIST } from "@/lib/domain/checklists";
import { DOCUMENT_CATEGORY_LABEL, PROFESSIONAL_ROLE_LABEL, SERVICE_SHORT_LABEL } from "@/lib/domain/catalog";
import type { Application, DepartmentKey, DocumentRecord, StageKey } from "@/lib/domain/types";
import { DEPARTMENT_LABEL, flowFor, nextStage, ROUTABLE_DEPARTMENTS, STAGE_LABEL } from "@/lib/domain/workflow";
import { ecps } from "@/lib/services";
import { useDemoStore, userName } from "@/lib/store/demo-store";
import { cn, formatDateTime, formatRelative, workingDaysBetween } from "@/lib/utils";
import { candidatesFor, useRajukData } from "./hooks";

type Action = "forward" | "route" | "correction" | "committee" | "approve" | "reject" | "return" | null;

export function ReviewWorkspace({ id }: { id: string }) {
  const { me, users, applications } = useRajukData();
  const app = applications.find((a) => a.id === id);
  const audit = useDemoStore((s) => s.audit);
  const far = useDemoStore((s) => s.far);
  const security = useDemoStore((s) => s.security);
  const [taking, setTaking] = useState(false);

  if (!app) return <EmptyState title="File not found" body="It may have been removed when the demo was reset." action={<Button asChild><Link href="/rajuk/inbox">Back to inbox</Link></Button>} />;

  const isHolder = app.holderId === me?.id;
  const unassignedFrontDesk = app.stage === "front_desk" && !app.holderId;
  const canTake = unassignedFrontDesk && (me?.role === "officer" || me?.role === "inspector");
  const fileAudit = audit.filter((a) => a.target.includes(app.ref) || a.target.includes(app.id));
  const checklist = checklistCompletion(REVIEW_CHECKLIST, app.checklist);
  const elapsed = app.submittedAt ? workingDaysBetween(app.submittedAt) : 0;

  const take = async () => {
    setTaking(true);
    await ecps.files.take(app.id);
    setTaking(false);
    toast.success("File is now in your tray");
  };

  return (
    <div className="-mt-2">
      {/* File header */}
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <Link href="/rajuk/inbox" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink-strong">
            <ArrowLeft className="size-4" aria-hidden /> File inbox
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="ref text-2xl font-semibold tracking-tight text-ink-strong">{app.ref}</h1>
            <StatusBadge status={app.status} />
            {app.priority === "high" && <Badge tone="danger">Priority</Badge>}
            {app.legacy && <Tag>LEGACY CP</Tag>}
          </div>
          <p className="mt-1 text-[0.9375rem] text-ink">
            {app.title} <span className="text-muted">· {SERVICE_SHORT_LABEL[app.type]}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-stretch gap-px overflow-hidden rounded-lg border border-line bg-line text-sm">
          <div className="bg-surface px-4 py-2.5">
            <p className="text-[0.6875rem] text-muted">Current holder</p>
            <p className="mt-0.5 flex items-center gap-2 font-medium text-ink-strong">
              {app.holderName ? (
                <>
                  <Avatar name={app.holderName} size="xs" /> {isHolder ? "You" : app.holderName}
                </>
              ) : (
                <span className="text-muted">{app.stage === "front_desk" ? "Front Desk queue" : "—"}</span>
              )}
            </p>
          </div>
          <div className="bg-surface px-4 py-2.5">
            <p className="text-[0.6875rem] text-muted">At {STAGE_LABEL[app.stage]}</p>
            <div className="mt-0.5">
              <HoldingIndicator app={app} />
            </div>
          </div>
          <div className="bg-surface px-4 py-2.5">
            <p className="text-[0.6875rem] text-muted">Since submission</p>
            <p className="tabular mt-0.5 font-medium text-ink-strong">{elapsed} working days</p>
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
          title={canTake ? "This file is waiting in the Front Desk queue" : `Read-only — this file is held by ${app.holderName ?? "another desk"}`}
          action={
            canTake ? (
              <Button size="sm" onClick={take} loading={taking}>
                Take into my tray
              </Button>
            ) : undefined
          }
        >
          {canTake ? "Taking the file records you as the responsible officer." : "Only the current holder can move or decide this file. Every view is recorded in the audit trail."}
        </Callout>
      )}

      <KeyFacts app={app} far={far} users={users} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_23rem]">
        {/* Centre: document viewer */}
        <section aria-label="Documents" className="min-w-0">
          <DocumentViewer app={app} />
        </section>

        {/* Right: review tools */}
        <aside aria-label="Review tools" className="min-w-0 space-y-5">
          {isHolder && ["submitted", "in_review", "correction_requested"].includes(app.status) && <DecisionPanel app={app} checklist={checklist} mfaRequired={security.mfaOnApproval} />}
          {isHolder && app.stage === "signing" && (
            <Callout tone="info" title="Approval documents ready for signature" action={<Button asChild size="sm"><Link href={`/rajuk/signing/sp-${app.id.replace("a-", "")}`}>Open signing</Link></Button>}>
              Sign the locked approved version in the signing workspace.
            </Callout>
          )}
          {app.stage === "bc_committee" && (
            <Callout tone="info" icon={Gavel} title="Listed for BC Committee" action={<Button asChild size="sm" variant="secondary"><Link href="/rajuk/committee">Agenda</Link></Button>}>
              Presentation {app.presentations} of 2. The committee records its decision on the agenda.
            </Callout>
          )}
          <Tabs defaultValue="checklist" className="rounded-xl border border-line bg-surface">
            <TabsList className="px-4 pt-2">
              <TabsTrigger value="checklist">
                <ClipboardCheck /> Checklist
              </TabsTrigger>
              <TabsTrigger value="notes">
                <MessageSquarePlus /> Notes
              </TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="audit">Audit</TabsTrigger>
            </TabsList>
            <TabsContent value="checklist" className="p-4">
              <ChecklistPanel app={app} editable={isHolder} />
            </TabsContent>
            <TabsContent value="notes" className="p-4">
              <ObservationsPanel app={app} users={users} canAdd={isHolder || me?.role === "officer" || me?.role === "estate"} />
            </TabsContent>
            <TabsContent value="timeline" className="scrollbar-thin max-h-[34rem] overflow-y-auto p-4">
              <Timeline items={eventsToTimeline(app, users, { internal: true })} />
            </TabsContent>
            <TabsContent value="audit" className="p-4">
              {fileAudit.length === 0 ? (
                <p className="text-sm text-muted">No audit entries recorded for this file in the demo window.</p>
              ) : (
                <ol className="space-y-3 text-sm">
                  {fileAudit.map((a) => (
                    <li key={a.id} className="border-l-2 border-line pl-3">
                      <p className="ref text-xs text-teal-800">{a.action}</p>
                      <p className="text-ink">
                        {userName(users, a.actorId)} — {a.detail}
                      </p>
                      <p className="text-xs text-muted">
                        {formatDateTime(a.at)} · {a.ip}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-4 text-xs text-muted">Full trail in Administration → Audit trail.</p>
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
  const pros = app.professionals.filter((p) => p.status === "accepted");
  const cell = (k: string, v: React.ReactNode, extra?: string) => (
    <div className={cn("min-w-0 bg-surface px-4 py-3", extra)}>
      <dt className="text-[0.6875rem] text-muted">{k}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-ink-strong">{v}</dd>
    </div>
  );
  return (
    <dl aria-label="Key facts" className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4 xl:grid-cols-8">
      {cell("Owner(s)", app.owners.map((o) => o.name).join(", "), "col-span-2")}
      {cell("Sub-zone · block", <span className="ref" title={`${app.property.zone}, sub-zone ${app.property.subZone}, block ${app.property.block}`}>{app.property.subZone} · {app.property.block}</span>)}
      {cell("Mouza · RS dag", <>{app.property.mouza} · <span className="ref">{app.property.rsDag}</span></>)}
      {cell("Plot · road", `${app.property.plotAreaSqm} m² · ${app.property.roadWidthM} m`)}
      {cell("Building", b ? `${b.occupancy} · ${b.storeys}${b.basements ? `+B${b.basements}` : ""} storeys · ${b.units} units` : "—")}
      <div className={cn("min-w-0 px-4 py-3", farOk ? "bg-surface" : "bg-amber-50")}>
        <dt className="text-[0.6875rem] text-muted">FAR (illustrative limit)</dt>
        <dd className={cn("mt-0.5 flex items-center gap-1.5 text-sm font-medium", farOk ? "text-ink-strong" : "text-amber-700")}>
          <span className="tabular">{proposed ? proposed.toFixed(2) : "—"}</span>
          <span className="text-muted">/ {limits?.far.toFixed(1) ?? "—"}</span>
          {farOk ? <Check className="size-3.5 text-success-600" aria-label="Within limit" /> : <AlertTriangle className="size-3.5" aria-label="Exceeds limit" />}
        </dd>
      </div>
      {cell("Professionals", <span title={pros.map((p) => `${users.find((u) => u.id === p.userId)?.name} (${PROFESSIONAL_ROLE_LABEL[p.role]})`).join(", ")}>{pros.length} accepted</span>)}
    </dl>
  );
}

/* ———————————————————————————— Document viewer ———————————————————————————— */

function DocumentViewer({ app }: { app: Application }) {
  const docs = app.documents.filter((d) => d.status !== "superseded");
  const ordered = useMemo(() => {
    const order = ["drawing", "certificate", "professional", "plot_photo", "road_photo", "ownership", "nid", "tax_return", "photo", "noc", "letter"];
    return [...docs].sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
  }, [docs]);
  const [idx, setIdx] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const current: DocumentRecord | undefined = ordered[Math.min(idx, ordered.length - 1)];
  const superseded = app.documents.filter((d) => d.status === "superseded");

  if (!current) return <EmptyState icon={FileText} title="No documents attached" />;
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} aria-label="Previous document">
            <ChevronLeft />
          </Button>
          <span className="tabular text-xs text-muted">
            {idx + 1} / {ordered.length}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={() => setIdx((i) => Math.min(ordered.length - 1, i + 1))} disabled={idx >= ordered.length - 1} aria-label="Next document">
            <ChevronRight />
          </Button>
          <span className="ml-1 truncate text-sm font-medium text-ink-strong">{current.name}</span>
          <Tag>v{current.version}</Tag>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted sm:inline">{DOCUMENT_CATEGORY_LABEL[current.category]}{current.ownerIndex !== undefined ? ` · ${app.owners[current.ownerIndex]?.name}` : ""}</span>
          {app.location && (
            <Button variant={showMap ? "subtle" : "ghost"} size="sm" onClick={() => setShowMap((v) => !v)} aria-pressed={showMap}>
              <MapPin /> Map
            </Button>
          )}
        </div>
      </div>
      <div className="grid md:grid-cols-[11.5rem_minmax(0,1fr)]">
        <nav aria-label="Document list" className="scrollbar-thin max-h-[40rem] overflow-y-auto border-b border-line md:border-b-0 md:border-r">
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
                  <span className="truncate">{d.drawingSheet ? `Sheet · ${d.drawingSheet}` : DOCUMENT_CATEGORY_LABEL[d.category]}</span>
                  {d.status === "verified" && <Check className="ml-auto size-3 shrink-0 text-success-600" aria-label="verified" />}
                </button>
              </li>
            ))}
          </ul>
          {superseded.length > 0 && <p className="border-t border-line px-3 py-2 text-[0.6875rem] text-muted">{superseded.length} superseded version(s) retained</p>}
        </nav>
        <div className="bg-canvas p-4 sm:p-6">
          {showMap && app.location ? <SiteMap lat={app.location.lat} lng={app.location.lng} height={420} label="Plot location" /> : <DocumentPreview doc={current} app={app} />}
        </div>
      </div>
    </div>
  );
}

/* ———————————————————————————— Checklist ———————————————————————————— */

function ChecklistPanel({ app, editable }: { app: Application; editable: boolean }) {
  const c = checklistCompletion(REVIEW_CHECKLIST, app.checklist);
  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-ink-strong">
            {c.done} of {c.total} checked
          </span>
          {c.failed > 0 && <span className="font-medium text-danger-700">{c.failed} not compliant</span>}
        </div>
        <ProgressBar value={c.done / c.total} className="mt-2" tone={c.failed ? "amber" : "teal"} label="Checklist completion" />
      </div>
      <div className="space-y-5">
        {REVIEW_CHECKLIST.map((sec) => (
          <fieldset key={sec.id}>
            <legend className="mb-2 flex w-full items-center justify-between gap-2">
              <span className="text-sm font-semibold text-ink-strong">{sec.title}</span>
              <span className="font-mono text-[0.625rem] text-subtle">{sec.source}</span>
            </legend>
            <ul className="space-y-1.5">
              {sec.items.map((it) => {
                const st = app.checklist[it.id]?.result ?? null;
                return (
                  <li key={it.id} className="flex items-start gap-2 rounded-md px-1 py-1">
                    <p className="min-w-0 flex-1 text-[0.8125rem] leading-snug text-ink">
                      {it.label}
                      {it.hint && <span className="block text-[0.6875rem] text-subtle">{it.hint}</span>}
                    </p>
                    <div role="radiogroup" aria-label={it.label} className="flex shrink-0 overflow-hidden rounded-md border border-line">
                      {(
                        [
                          ["pass", Check, "Compliant", "bg-success-600 text-white"],
                          ["fail", X, "Not compliant", "bg-danger-600 text-white"],
                          ["na", Minus, "Not applicable", "bg-slate-ink text-white"],
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
      <p className="mt-4 text-[0.6875rem] leading-relaxed text-subtle">Representative items. Structural and fire-safety lists will be replaced with DCQR outputs (TOR 1.11).</p>
      {!editable && <p className="mt-2 text-xs text-muted">Read-only — you are not the file holder.</p>}
    </div>
  );
}

/* ———————————————————————————— Observations ———————————————————————————— */

function ObservationsPanel({ app, users, canAdd }: { app: Application; users: ReturnType<typeof useRajukData>["users"]; canAdd: boolean }) {
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
    toast.success(visibility === "internal" ? "Internal note added" : "Observation shared with applicant");
  };
  return (
    <div>
      {canAdd && (
        <form onSubmit={add} className="mb-5 space-y-2">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Record an observation…" aria-label="Observation" />
          <div className="flex items-center justify-between gap-2">
            <Select value={visibility} onChange={(e) => setVisibility(e.target.value as "internal" | "applicant")} aria-label="Visibility" className="h-8 text-xs">
              <option value="internal">Internal note</option>
              <option value="applicant">Visible to applicant</option>
            </Select>
            <Button type="submit" size="sm" loading={busy} disabled={text.trim().length < 3}>
              Add
            </Button>
          </div>
        </form>
      )}
      {app.observations.length === 0 ? (
        <p className="text-sm text-muted">No observations yet.</p>
      ) : (
        <ul className="space-y-3">
          {[...app.observations].reverse().map((o) => (
            <li key={o.id} className={cn("rounded-lg border p-3 text-sm", o.visibility === "internal" ? "border-line bg-surface-2" : "border-teal-600/25 bg-teal-50/60")}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-ink-strong">{userName(users, o.authorId)}</span>
                <span className="flex items-center gap-1 text-muted">
                  {o.visibility === "internal" ? <Lock className="size-3" aria-hidden /> : <Eye className="size-3" aria-hidden />}
                  {o.visibility === "internal" ? "Internal" : "Applicant"} · {formatRelative(o.at)}
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
    if ((action === "correction" || action === "reject") && note.trim().length < 10) return setErr("Explain the reason in at least 10 characters — it is recorded and shared with the applicant.");
    if (action === "forward" && candidates.length > 0 && !recipient) return setErr("Choose the receiving officer.");
    setBusy(true);
    if (action === "forward" && nxt) await ecps.files.forward(app.id, nxt, recipient || undefined, note.trim());
    if (action === "return") await ecps.files.forward(app.id, returnTo as StageKey, [...app.history].reverse().find((h) => h.action === "routed")?.actorId, `Opinion: ${note.trim() || "No objection."}`);
    if (action === "route") await ecps.files.routeToDepartment(app.id, dept, note.trim() || "For opinion.");
    if (action === "correction") await ecps.files.requestCorrection(app.id, note.trim());
    if (action === "committee") await ecps.files.listForCommittee(app.id);
    setBusy(false);
    const msg = { forward: "File forwarded", return: "File returned with opinion", route: "File routed", correction: "Correction requested", committee: "Listed for BC Committee", approve: "", reject: "" }[action!];
    setAction(null);
    toast.success(msg, "The move is recorded in the timeline and audit trail.");
  };

  const decide = async (d: "approve" | "reject") => {
    if (d === "reject" && note.trim().length < 10) {
      setErr("Explain the reason in at least 10 characters.");
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
    await ecps.files.decide(app.id, d === "approve" ? "approved" : "rejected", note.trim() || (d === "approve" ? "Approved after review." : ""));
    setBusy(false);
    setAction(null);
    toast.success(d === "approve" ? "Approved — sent for signature" : "Application rejected", "Decision recorded with MFA confirmation (simulated).");
  };

  return (
    <section aria-labelledby="decide-title" className="overflow-hidden rounded-xl border border-navy-900/15 bg-surface shadow-sm">
      <header className="on-dark flex items-center justify-between bg-navy-900 px-4 py-3 text-on-dark">
        <h2 id="decide-title" className="font-display text-sm font-semibold text-white">
          Process this file
        </h2>
        <span className="text-xs text-on-dark-muted">You hold this file</span>
      </header>
      <div className="space-y-2 p-4">
        {fromDept ? (
          <Button className="w-full justify-start" onClick={() => open("return")}>
            <Send /> Return with department opinion
          </Button>
        ) : (
          <>
            {atDecisionStage && isCommitteeFlow && (
              <Button className="w-full justify-start" onClick={() => open("committee")}>
                <Gavel /> List for BC Committee
              </Button>
            )}
            {atDecisionStage && !isCommitteeFlow && (
              <Button className="w-full justify-start" onClick={() => open("approve")}>
                <Stamp /> Approve…
              </Button>
            )}
            {!atDecisionStage && nxt && (
              <Button className="w-full justify-start" onClick={() => open("forward")}>
                <Send /> Forward to {STAGE_LABEL[nxt]}
              </Button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" className="justify-start" onClick={() => open("route")}>
                <ArrowRightLeft /> Route
              </Button>
              <Button variant="secondary" className="justify-start" onClick={() => open("correction")}>
                <PenLine /> Correction
              </Button>
            </div>
            {(atDecisionStage || app.stage === "front_desk") && (
              <Button variant="danger-outline" className="w-full justify-start" onClick={() => open("reject")}>
                <CircleSlash /> Reject…
              </Button>
            )}
          </>
        )}
        <p className="flex items-center gap-1.5 pt-1 text-[0.6875rem] text-muted">
          <ShieldCheck className="size-3.5" aria-hidden /> Every move asks for Yes/No confirmation (TOR 1.4); decisions require MFA.
        </p>
      </div>

      {/* Confirmation dialogs */}
      <ConfirmDialog
        open={action === "forward" || action === "route" || action === "correction" || action === "committee" || action === "return"}
        onOpenChange={(o) => !o && setAction(null)}
        eyebrow={`${app.ref} · confirm file movement`}
        title={
          action === "forward"
            ? `Forward to ${nxt ? STAGE_LABEL[nxt] : ""}?`
            : action === "route"
              ? "Route to a department for opinion?"
              : action === "correction"
                ? "Request a correction from the applicant?"
                : action === "committee"
                  ? `List for BC Committee (presentation ${app.presentations >= 1 ? 2 : 1})?`
                  : "Return the file with your opinion?"
        }
        description={action === "correction" ? "The applicant is notified and the file stays with you until they resubmit." : "You will no longer hold this file after confirming."}
        confirmLabel="Yes, confirm"
        cancelLabel="No, go back"
        loading={busy}
        onConfirm={run}
      >
        <div className="space-y-4">
          {action === "forward" && checklist.done < checklist.total && (
            <Callout tone="warning">
              Checklist is {checklist.done}/{checklist.total} complete{checklist.failed ? ` with ${checklist.failed} non-compliant item(s)` : ""}. You can still forward; the state is recorded.
            </Callout>
          )}
          {action === "forward" && candidates.length > 0 && (
            <Field label="Receiving officer" required>
              {(a) => (
                <Select {...a} value={recipient} onChange={(e) => setRecipient(e.target.value)}>
                  {candidates.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.designation}
                      {u.zone ? `, ${u.zone}` : ""}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
          {action === "route" && (
            <Field label="Department" required hint="TOR 1.3 / 1.4 routing to internal departments.">
              {(a) => (
                <Select {...a} value={dept} onChange={(e) => setDept(e.target.value as DepartmentKey)}>
                  {ROUTABLE_DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {DEPARTMENT_LABEL[d]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
          {action === "committee" && app.presentations >= 1 && (
            <Callout tone="info">This will be the second and final presentation. The committee may only approve or reject (TOR 1.4).</Callout>
          )}
          {action !== "committee" && (
            <Field label={action === "correction" ? "What must the applicant correct?" : "Note"} required={action === "correction"} optional={action !== "correction"} error={err}>
              {(a) => <Textarea {...a} rows={3} value={note} onChange={(e) => { setNote(e.target.value); setErr(""); }} />}
            </Field>
          )}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={action === "approve" || action === "reject"}
        onOpenChange={(o) => !o && setAction(null)}
        eyebrow={`${app.ref} · decision`}
        title={action === "approve" ? "Approve this application?" : "Reject this application?"}
        description={action === "approve" ? "The approval package is generated and locked for digital signature." : "The applicant receives the rejection reason and may appeal."}
        confirmLabel={action === "approve" ? "Yes, approve" : "Yes, reject"}
        cancelLabel="No, go back"
        tone={action === "reject" ? "danger" : "navy"}
        loading={busy}
        onConfirm={() => decide(action as "approve" | "reject")}
      >
        <Field label={action === "reject" ? "Reason for rejection" : "Decision note"} required={action === "reject"} optional={action === "approve"} error={err}>
          {(a) => <Textarea {...a} rows={3} value={note} onChange={(e) => { setNote(e.target.value); setErr(""); }} />}
        </Field>
        {mfaRequired && <p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><ShieldCheck className="size-3.5" aria-hidden /> You will be asked for a second factor.</p>}
      </ConfirmDialog>

      <MfaDialog open={mfaFor !== null} onOpenChange={(o) => !o && setMfaFor(null)} action={mfaFor === "approve" ? "Approving a file" : "Rejecting a file"} onVerified={() => finishDecision(mfaFor!)} />
    </section>
  );
}
