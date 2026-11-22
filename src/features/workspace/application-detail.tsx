"use client";

import { AlertTriangle, ArrowRight, Clock3, CreditCard, ExternalLink, FileText, Gavel, Hourglass, Send, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { DocumentPreview } from "@/components/domain/document-preview";
import { FileDrop, FileRow } from "@/components/domain/file-drop";
import { SiteMap } from "@/components/domain/site-map";
import { StageTrack, StatusBadge } from "@/components/domain/status";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, KeyValues, PageHeader, Panel, Timeline, type TimelineItem } from "@/components/ui/display";
import { Callout, EmptyState } from "@/components/ui/feedback";
import { Field, Textarea } from "@/components/ui/form";
import { ConfirmDialog, Dialog, DialogContent, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";
import { toast } from "@/components/ui/toast";
import { DOCUMENT_CATEGORY_LABEL, OCCUPANCY, PROFESSIONAL_ROLE_LABEL, SERVICE_SHORT_LABEL } from "@/lib/domain/catalog";
import type { Application, DocumentRecord, WorkflowEvent } from "@/lib/domain/types";
import { flowFor, holdingInfo, STAGE_LABEL } from "@/lib/domain/workflow";
import { useI18n } from "@/lib/i18n";
import { ecps } from "@/lib/services";
import { useDemoStore, userName } from "@/lib/store/demo-store";
import { cn, daysBetween, formatBDT, formatDate, formatDateTime, workingDaysBetween } from "@/lib/utils";
import { useApplication, useMe, useUsers } from "./hooks";
import { PaymentDialog } from "./payment-dialog";

const ACTION_LABEL: Record<WorkflowEvent["action"], string> = {
  created: "Draft created",
  submitted: "Submitted",
  received: "Received at Front Desk",
  assigned: "File assigned",
  forwarded: "Forwarded",
  routed: "Routed to department",
  returned: "Returned with opinion",
  correction_requested: "Correction requested",
  resubmitted: "Correction resubmitted",
  checklist_completed: "Checklist completed",
  observation: "Observation recorded",
  committee_listed: "Listed for BC Committee",
  committee_decision: "Committee decision",
  signed: "Digitally signed",
  fee_requested: "Fee requested",
  payment_received: "Payment received",
  approved: "Approved",
  rejected: "Rejected",
  inspection: "Site inspection",
  noc_uploaded: "Estate NOC uploaded",
  revert_requested: "Revert requested",
  reverted: "File reverted",
  appeal_filed: "Appeal filed",
};

export function eventsToTimeline(app: Application, users: { id: string; name: string }[], opts: { internal?: boolean } = {}): TimelineItem[] {
  return [...app.history]
    .filter((h) => opts.internal || !(h.action === "observation" && h.note === "Internal note added."))
    .reverse()
    .map((h, i) => ({
      id: h.id,
      title: (
        <>
          {ACTION_LABEL[h.action]}
          {h.toStage && h.action !== "submitted" ? <span className="font-normal text-muted"> → {STAGE_LABEL[h.toStage]}</span> : null}
          {h.simulated && <span className="ml-2 rounded-xs border border-dashed border-slate-ink/40 px-1 font-mono text-[0.5625rem] uppercase text-slate-ink">Simulated</span>}
        </>
      ),
      meta: formatDateTime(h.at),
      body: (
        <>
          <span className="text-ink">{userName(users, h.actorId)}</span>
          {h.toUserId && opts.internal && <> → {userName(users, h.toUserId)}</>}
          {h.note && <span className="block">{h.note}</span>}
        </>
      ),
      tone: i === 0 ? "current" : h.action === "rejected" ? "danger" : h.action === "correction_requested" ? "warning" : h.action === "approved" || h.action === "payment_received" ? "success" : "default",
    }));
}

export function ApplicationDetail({ id }: { id: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const app = useApplication(id);
  const users = useUsers();
  const me = useMe();
  const limits = useDemoStore((s) => s.holdingLimits);
  const addDocument = useDemoStore((s) => s.addDocument);
  const payments = useDemoStore((s) => s.payments);
  const [payOpen, setPayOpen] = useState(params.get("pay") === "1");
  const [preview, setPreview] = useState<DocumentRecord | null>(null);
  const [correction, setCorrection] = useState("");
  const [correctionUploaded, setCorrectionUploaded] = useState<string | null>(null);
  const [resubmitting, setResubmitting] = useState(false);
  const [appealOpen, setAppealOpen] = useState(false);
  const [grounds, setGrounds] = useState("");
  const [appealErr, setAppealErr] = useState("");
  const [appealBusy, setAppealBusy] = useState(false);
  const appPayments = useMemo(() => payments.filter((p) => p.applicationId === id), [payments, id]);

  if (!app) return <EmptyState title="Application not found" body="It may have been removed when the demo data was reset." action={<Button asChild><Link href="/workspace">Back to dashboard</Link></Button>} />;

  const h = holdingInfo(app, limits);
  const elapsed = app.submittedAt ? workingDaysBetween(app.submittedAt) : 0;
  const flow = flowFor(app.type);
  const isOwner = me?.id === app.applicantId;
  const liveDocs = app.documents.filter((d) => d.status !== "superseded");
  const groups = Array.from(new Set(liveDocs.map((d) => d.category)));
  const visibleObservations = app.observations.filter((o) => o.visibility === "applicant");
  const canAppeal = isOwner && app.status === "rejected";

  const resubmit = async () => {
    if (!correctionUploaded) return toast.error("Upload the corrected document first");
    setResubmitting(true);
    await ecps.applications.resubmitCorrection(app.id, correction.trim() || `Uploaded ${correctionUploaded}`);
    setResubmitting(false);
    setCorrectionUploaded(null);
    setCorrection("");
    toast.success("Correction sent", "The file has returned to the same desk.");
  };

  const fileAppeal = async () => {
    if (grounds.trim().length < 20) return setAppealErr("Describe the grounds for appeal in at least 20 characters.");
    setAppealBusy(true);
    const newId = await ecps.applications.fileAppeal(app.id, grounds.trim());
    setAppealBusy(false);
    setAppealOpen(false);
    toast.success("Appeal filed", "Your appeal has been received at the Front Desk.");
    router.push(`/workspace/applications/${newId}`);
  };

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: t("nav.ws.dashboard"), href: "/workspace" }, { label: t("nav.ws.applications"), href: "/workspace/applications" }, { label: app.ref }]}
        kicker={SERVICE_SHORT_LABEL[app.type]}
        title={app.title}
        meta={
          <>
            <StatusBadge status={app.status} />
            <span className="ref text-sm text-muted">{app.ref}</span>
            {app.permitNo && app.status === "approved" && (
              <Link href={`/public-register/${app.permitNo}`} className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline">
                Public Register <ExternalLink className="size-3.5" aria-hidden />
              </Link>
            )}
          </>
        }
        actions={
          <>
            {app.status === "draft" && isOwner && (
              <Button asChild>
                <Link href={`/workspace/applications/${app.id}/edit`}>{t("ws.continue")}</Link>
              </Button>
            )}
            {app.status === "fee_pending" && isOwner && (
              <Button onClick={() => setPayOpen(true)}>
                <CreditCard /> {t("ws.pay")}
              </Button>
            )}
            {canAppeal && (
              <Button variant="secondary" onClick={() => setAppealOpen(true)}>
                <Gavel /> File appeal
              </Button>
            )}
          </>
        }
      />

      {/* Status band */}
      {app.status !== "draft" && (
        <section aria-label="Current status" className="mb-6 overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
          <div className="grid gap-px bg-line md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
            <div className="bg-surface p-5">
              <p className="text-xs text-muted">{t("track.result.stage")}</p>
              <p className="mt-1 font-display text-lg font-semibold text-ink-strong">
                {app.status === "approved" ? "Issued" : app.status === "rejected" ? "Decision issued" : app.stage === "fee_and_drawings" ? "Awaiting your payment" : STAGE_LABEL[app.stage]}
              </p>
              <StageTrack className="mt-4" type={app.type} stage={app.stage} status={app.status} showLabels />
            </div>
            <div className="bg-surface p-5">
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Clock3 className="size-3.5" aria-hidden /> {t("track.result.held")}
              </p>
              <p className={cn("tabular mt-1 font-display text-2xl font-semibold", h.state === "exceeded" ? "text-danger-700" : "text-ink-strong")}>{["approved", "rejected"].includes(app.status) ? "—" : `${h.days} d`}</p>
              <p className="mt-1 text-xs text-muted">{h.limit && !["approved", "rejected"].includes(app.status) ? `Service target ${h.limit} working days (illustrative)` : "Working days"}</p>
            </div>
            <div className="bg-surface p-5">
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Hourglass className="size-3.5" aria-hidden /> Since submission
              </p>
              <p className="tabular mt-1 font-display text-2xl font-semibold text-ink-strong">{elapsed} d</p>
              <p className="mt-1 text-xs text-muted">Submitted {formatDate(app.submittedAt, locale)}</p>
            </div>
            <div className="bg-surface p-5">
              <p className="text-xs text-muted">Next step</p>
              <p className="mt-1 text-sm font-medium text-ink-strong">
                {app.status === "correction_requested"
                  ? "Upload your correction"
                  : app.status === "fee_pending"
                    ? "Pay permit fee"
                    : app.status === "approved"
                      ? "Construction Start Notice"
                      : app.status === "rejected"
                        ? "You may appeal"
                        : STAGE_LABEL[flow[flow.indexOf(app.stage) + 1] ?? "issued"]}
              </p>
            </div>
          </div>
        </section>
      )}

      {app.status === "correction_requested" && (
        <section aria-labelledby="corr-title" className="mb-6 overflow-hidden rounded-xl border border-amber-500/40 bg-amber-50/60">
          <div className="flex items-start gap-3 border-b border-amber-500/30 px-5 py-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
            <div>
              <h2 id="corr-title" className="font-display font-semibold text-ink-strong">
                Correction requested by {STAGE_LABEL[app.stage]}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink">{app.correctionNote}</p>
            </div>
          </div>
          {isOwner ? (
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <div>
                {correctionUploaded ? (
                  <FileRow name={correctionUploaded} sizeKb={1320} kind="photo" meta="new version · sample" onRemove={() => setCorrectionUploaded(null)} />
                ) : (
                  <FileDrop
                    label="Upload corrected document"
                    sampleName="adjacent_road_daytime_sample.jpg"
                    onUploaded={(f) => {
                      addDocument(app.id, { name: f.name, sizeKb: f.sizeKb, category: "road_photo", previewKind: "photo" });
                      setCorrectionUploaded(f.name);
                    }}
                  />
                )}
              </div>
              <div className="space-y-3">
                <Field label="Note to the officer" optional>
                  {(a) => <Textarea {...a} rows={3} value={correction} onChange={(e) => setCorrection(e.target.value)} placeholder="Explain what you changed" />}
                </Field>
                <Button onClick={resubmit} loading={resubmitting} disabled={!correctionUploaded}>
                  <Send /> Send correction
                </Button>
              </div>
            </div>
          ) : (
            <p className="px-5 py-3 text-sm text-muted">The owner will upload the correction. Professionals can coordinate revised drawings with the owner.</p>
          )}
        </section>
      )}

      {app.status === "fee_pending" && (
        <Callout tone="warning" className="mb-6" title={`Permit fee due · ${formatBDT(app.fee?.total ?? 0, locale)} (illustrative)`} action={isOwner ? <Button size="sm" onClick={() => setPayOpen(true)}>Pay now</Button> : undefined}>
          The approval has been signed. Pay the permit fee and upload electrical and plumbing drawings to receive the permit (TOR 1.13 post-vote automation).
        </Callout>
      )}

      {app.status === "rejected" && (
        <Callout tone="danger" className="mb-6" title="Application rejected">
          {app.history.findLast((x) => x.action === "rejected")?.note ?? "See decision letter."} {canAppeal && "You can appeal this decision."}
        </Callout>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents ({liveDocs.length})</TabsTrigger>
          <TabsTrigger value="professionals">Professionals</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-6">
              <Panel title="Property & plot">
                <KeyValues
                  columns={3}
                  items={[
                    { k: "Zone / sub-zone", v: `${app.property.zone} · ${app.property.subZone}` },
                    { k: "Block (routing)", v: app.property.block, mono: true },
                    { k: "Area", v: app.property.area },
                    { k: "Mouza", v: app.property.mouza },
                    { k: "RS dag", v: app.property.rsDag, mono: true },
                    { k: "Plot area", v: `${app.property.plotAreaSqm} m²` },
                    { k: "Road width", v: `${app.property.roadWidthM} m` },
                    { k: "Ownership", v: app.property.ownershipType.replace("_", " ") },
                    { k: "Address", v: app.property.address, full: true },
                  ]}
                />
              </Panel>
              {app.building && (
                <Panel title="Building">
                  <KeyValues
                    columns={3}
                    items={[
                      { k: "Occupancy", v: `Group ${app.building.occupancy} · ${OCCUPANCY[app.building.occupancy]}` },
                      { k: "Storeys", v: `${app.building.storeys}${app.building.basements ? ` + ${app.building.basements} basement` : ""}` },
                      { k: "Total floor area", v: `${app.building.totalFloorAreaSqm.toLocaleString("en-IN")} m²` },
                      { k: "Units", v: app.building.units },
                      { k: "Height", v: `${app.building.heightM} m` },
                      { k: "Setbacks F/R/L/R", v: `${app.building.setbacks.front} / ${app.building.setbacks.rear} / ${app.building.setbacks.left} / ${app.building.setbacks.right} m` },
                    ]}
                  />
                </Panel>
              )}
              {visibleObservations.length > 0 && (
                <Panel title="Observations from RAJUK">
                  <ul className="space-y-3">
                    {visibleObservations.map((o) => (
                      <li key={o.id} className="rounded-lg border border-line bg-surface-2 p-3 text-sm">
                        <p className="text-ink">{o.text}</p>
                        <p className="mt-1 text-xs text-muted">
                          {STAGE_LABEL[o.stage]} · {formatDateTime(o.at, locale)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
            </div>
            <div className="space-y-6">
              {app.location && <SiteMap lat={app.location.lat} lng={app.location.lng} height={220} label="Plot location" />}
              <Panel title="Owners">
                <ul className="space-y-2.5">
                  {app.owners.map((o) => (
                    <li key={o.name} className="flex items-center gap-3">
                      <Avatar name={o.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-ink-strong">{o.name}</p>
                        <p className="text-xs text-muted">{o.relation}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="pt-6">
          <div className="space-y-6">
            {groups.map((g) => (
              <div key={g}>
                <h3 className="mb-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-muted">{DOCUMENT_CATEGORY_LABEL[g]}</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {liveDocs
                    .filter((d) => d.category === g)
                    .map((d) => (
                      <FileRow
                        key={d.id}
                        name={d.name}
                        sizeKb={d.sizeKb}
                        kind={d.previewKind}
                        status={d.status}
                        meta={`v${d.version}${d.ownerIndex !== undefined ? ` · ${app.owners[d.ownerIndex]?.name ?? ""}` : ""} · ${formatDate(d.uploadedAt, locale)}`}
                        onPreview={() => setPreview(d)}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="professionals" className="pt-6">
          <Panel bodyClassName="p-0">
            <ul className="divide-y divide-line">
              {app.professionals.map((p) => {
                const u = users.find((x) => x.id === p.userId);
                return (
                  <li key={p.userId + p.role + p.invitedAt} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <Avatar name={u?.name ?? "?"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink-strong">{u?.name}</p>
                      <p className="text-xs text-muted">
                        {PROFESSIONAL_ROLE_LABEL[p.role]} · {u?.membership?.body} <span className="ref">{u?.membership?.number}</span>
                      </p>
                    </div>
                    <Badge tone={p.status === "accepted" ? "success" : p.status === "invited" ? "warning" : p.status === "declined" ? "danger" : "neutral"}>{p.status}</Badge>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </TabsContent>

        <TabsContent value="timeline" className="pt-6">
          <Panel>
            <Timeline items={eventsToTimeline(app, users)} />
          </Panel>
        </TabsContent>

        <TabsContent value="payments" className="pt-6">
          <Panel bodyClassName="p-0">
            {appPayments.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={FileText} title="No payments yet" />
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {appPayments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium capitalize text-ink-strong">{p.category.replace("_", " ")}</p>
                      <p className="ref text-xs text-muted">{p.gatewayRef ?? "Awaiting payment"}</p>
                    </div>
                    <span className="tabular font-medium text-ink-strong">{formatBDT(p.amount, locale)}</span>
                    <Badge tone={p.status === "paid" ? "success" : p.status === "pending" ? "warning" : "danger"}>{p.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </TabsContent>
      </Tabs>

      <Dialog open={preview !== null} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent size="xl" eyebrow="Document preview · sample" title={preview?.name ?? ""} description={preview ? `${DOCUMENT_CATEGORY_LABEL[preview.category]} · version ${preview.version}` : undefined}>
          {preview && <DocumentPreview doc={preview} app={app} />}
        </DialogContent>
      </Dialog>

      <PaymentDialog app={app} open={payOpen} onOpenChange={setPayOpen} />

      <ConfirmDialog
        open={appealOpen}
        onOpenChange={setAppealOpen}
        eyebrow={app.type === "OC" ? "Occupancy Certificate appeal · TOR 2.4" : "Appeal"}
        title="File an appeal against this decision?"
        description="The appeal is submitted as a new linked application and reviewed under RAJUK-approved procedures."
        confirmLabel="Yes, file appeal"
        loading={appealBusy}
        onConfirm={fileAppeal}
      >
        <Field label="Grounds for appeal" required error={appealErr}>
          {(a) => <Textarea {...a} rows={4} value={grounds} onChange={(e) => { setGrounds(e.target.value); setAppealErr(""); }} />}
        </Field>
      </ConfirmDialog>

      {app.status !== "draft" && (
        <p className="mt-8 flex items-center gap-2 text-xs text-muted">
          <ShieldCheck className="size-3.5" aria-hidden /> Every action on this file is recorded in the audit trail. Total time since creation: {Math.round(daysBetween(app.createdAt))} days.
          <Link href={`/track?ref=${app.ref}`} className="inline-flex items-center gap-1 font-medium text-teal-700 hover:underline">
            Public tracking view <ArrowRight className="size-3" aria-hidden />
          </Link>
        </p>
      )}
    </div>
  );
}
