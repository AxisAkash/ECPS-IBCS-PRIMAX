"use client";

import { AlertTriangle, ArrowRight, BadgeCheck, Clock3, CreditCard, ExternalLink, FileText, Gavel, Hourglass, Mail, Repeat2, Send, ShieldCheck, Stamp, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { DecisionLetter, letterKindFor } from "@/components/domain/decision-letter";
import { DocumentPreview } from "@/components/domain/document-preview";
import { FileDrop, FileRow } from "@/components/domain/file-drop";
import { SiteMap } from "@/components/domain/site-map";
import { StageTrack, StatusBadge } from "@/components/domain/status";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, KeyValues, PageHeader, Panel, Timeline, type TimelineItem } from "@/components/ui/display";
import { Callout, EmptyState } from "@/components/ui/feedback";
import { Field, Select, Textarea } from "@/components/ui/form";
import { ConfirmDialog, Dialog, DialogContent, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";
import { toast } from "@/components/ui/toast";
import { useDomainLabels } from "@/features/wizard/steps";
import { serviceByType } from "@/lib/domain/catalog";
import type { Application, DocumentRecord, DrawingSheetKind, ProfessionalParticipation, WorkflowEvent } from "@/lib/domain/types";
import { flowFor, holdingInfo, STAGE_LABEL } from "@/lib/domain/workflow";
import { translate, useI18n, type MessageKey } from "@/lib/i18n";
import { ecps } from "@/lib/services";
import { useDemoStore, userName } from "@/lib/store/demo-store";
import { cn, daysBetween, formatBDT, formatDate, formatDateTime, formatRelative, workingDaysBetween, type Locale } from "@/lib/utils";
import { useApplication, useMe, useUsers } from "./hooks";
import { PaymentDialog } from "./payment-dialog";

type Labeler = (action: WorkflowEvent["action"]) => string;
const englishAction: Labeler = (a) => translate("en", `act.${a}` as MessageKey);

/** Converts workflow history into timeline items. Officer views pass `internal` to show internal notes. */
export function eventsToTimeline(app: Application, users: { id: string; name: string }[], opts: { internal?: boolean; label?: Labeler; stage?: (s: string) => string; simulated?: string; locale?: Locale } = {}): TimelineItem[] {
  const label = opts.label ?? englishAction;
  const stage = opts.stage ?? ((s: string) => STAGE_LABEL[s as keyof typeof STAGE_LABEL]);
  return [...app.history]
    .filter((h) => opts.internal || !(h.action === "observation" && h.note === "Internal note added."))
    .reverse()
    .map((h, i) => ({
      id: h.id,
      title: (
        <>
          {label(h.action)}
          {h.toStage && h.action !== "submitted" ? <span className="font-normal text-muted"> → {stage(h.toStage)}</span> : null}
          {h.simulated && <span className="ml-2 rounded-xs border border-dashed border-slate-ink/40 px-1 font-mono text-[0.5625rem] uppercase text-slate-ink">{opts.simulated ?? "Simulated"}</span>}
        </>
      ),
      meta: formatDateTime(h.at, opts.locale),
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

const EDITABLE_FOR_PRO = ["draft", "submitted", "in_review", "correction_requested", "fee_pending"];

export function ApplicationDetail({ id }: { id: string }) {
  const { t, locale } = useI18n();
  const L = useDomainLabels();
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
  const [letterOpen, setLetterOpen] = useState(false);
  const [correction, setCorrection] = useState("");
  const [correctionUploaded, setCorrectionUploaded] = useState<string | null>(null);
  const [resubmitting, setResubmitting] = useState(false);
  const [appealOpen, setAppealOpen] = useState(false);
  const [grounds, setGrounds] = useState("");
  const [appealErr, setAppealErr] = useState("");
  const [appealBusy, setAppealBusy] = useState(false);
  const [svcBusy, setSvcBusy] = useState(false);
  const appPayments = useMemo(() => payments.filter((p) => p.applicationId === id), [payments, id]);

  if (!app)
    return (
      <EmptyState
        title={t("ad.notFound")}
        body={t("wz.notFoundBody")}
        action={
          <Button asChild>
            <Link href="/workspace">{t("ad.back")}</Link>
          </Button>
        }
      />
    );

  const h = holdingInfo(app, limits);
  const elapsed = app.submittedAt ? workingDaysBetween(app.submittedAt) : 0;
  const flow = flowFor(app.type);
  const isOwner = me?.id === app.applicantId;
  const myParticipation = app.professionals.find((p) => p.userId === me?.id && p.status === "accepted");
  const liveDocs = app.documents.filter((d) => d.status !== "superseded");
  const groups = Array.from(new Set(liveDocs.map((d) => d.category)));
  const visibleObservations = app.observations.filter((o) => o.visibility === "applicant");
  const canAppeal = isOwner && app.status === "rejected";
  const letterKind = letterKindFor(app);
  const decided = ["approved", "rejected", "appealed"].includes(app.status);
  const svc = (k: "electrical" | "plumbing") => liveDocs.find((d) => d.service === k);
  const svcSubmitted = app.history.some((x) => x.action === "service_drawings");
  const nextLabel =
    app.status === "correction_requested"
      ? t("ad.next.correction")
      : app.status === "fee_pending"
        ? t("ad.next.fee")
        : app.status === "approved"
          ? t("ad.next.approved")
          : app.status === "rejected"
            ? t("ad.next.rejected")
            : L.stage(flow[flow.indexOf(app.stage) + 1] ?? "issued");

  const resubmit = async () => {
    if (!correctionUploaded) return toast.error(t("ad.corrFirst"));
    setResubmitting(true);
    await ecps.applications.resubmitCorrection(app.id, correction.trim() || `Uploaded ${correctionUploaded}`);
    setResubmitting(false);
    setCorrectionUploaded(null);
    setCorrection("");
    toast.success(t("ad.corrSent"), t("ad.corrSentBody"));
  };

  const fileAppeal = async () => {
    if (grounds.trim().length < 20) return setAppealErr(t("ad.appealShort"));
    setAppealBusy(true);
    const newId = await ecps.applications.fileAppeal(app.id, grounds.trim());
    setAppealBusy(false);
    setAppealOpen(false);
    toast.success(t("ad.appealFiled"), t("ad.appealFiledBody"));
    router.push(`/workspace/applications/${newId}`);
  };

  const submitServiceDrawings = async () => {
    setSvcBusy(true);
    await ecps.applications.submitServiceDrawings(app.id);
    setSvcBusy(false);
    toast.success(t("ad.svcSubmitted"), t("ad.svcSubmittedBody"));
  };

  const canUploadService = (k: "electrical" | "plumbing") => isOwner || myParticipation?.role === k;

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: t("nav.ws.dashboard"), href: "/workspace" }, { label: t("nav.ws.applications"), href: "/workspace/applications" }, { label: app.ref }]}
        kicker={t(serviceByType(app.type).nameKey as MessageKey)}
        title={app.title}
        meta={
          <>
            <StatusBadge status={app.status} />
            <span className="ref text-sm text-muted">{app.ref}</span>
            {app.permitNo && app.status === "approved" && (
              <Link href={`/public-register/${app.permitNo}`} className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline">
                {t("ad.publicRegister")} <ExternalLink className="size-3.5" aria-hidden />
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
            {letterKind && (
              <Button variant="secondary" onClick={() => setLetterOpen(true)}>
                <Mail /> {t("ad.viewLetter")}
              </Button>
            )}
            {canAppeal && (
              <Button variant="secondary" onClick={() => setAppealOpen(true)}>
                <Gavel /> {t("ad.appeal")}
              </Button>
            )}
          </>
        }
      />

      {app.status !== "draft" && (
        <section aria-label={t("track.result.stage")} className="mb-6 overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
          <div className="grid gap-px bg-line md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
            <div className="bg-surface p-5">
              <p className="text-xs text-muted">{t("track.result.stage")}</p>
              <p className="mt-1 font-display text-lg font-semibold text-ink-strong">
                {app.status === "approved" ? t("ad.issued") : app.status === "rejected" ? t("ad.decision") : app.stage === "fee_and_drawings" ? t("ad.awaitPay") : L.stage(app.stage)}
              </p>
              <StageTrack className="mt-4" type={app.type} stage={app.stage} status={app.status} showLabels />
            </div>
            <div className="bg-surface p-5">
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Clock3 className="size-3.5" aria-hidden /> {t("track.result.held")}
              </p>
              <p className={cn("tabular mt-1 font-display text-2xl font-semibold", h.state === "exceeded" ? "text-danger-700" : "text-ink-strong")}>{decided ? "—" : t("track.result.days", { n: h.days })}</p>
              <p className="mt-1 text-xs text-muted">{h.limit && !decided ? t("ad.serviceTarget", { n: h.limit }) : t("ad.workingDays")}</p>
            </div>
            <div className="bg-surface p-5">
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Hourglass className="size-3.5" aria-hidden /> {t("ad.since")}
              </p>
              <p className="tabular mt-1 font-display text-2xl font-semibold text-ink-strong">{t("track.result.days", { n: elapsed })}</p>
              <p className="mt-1 text-xs text-muted">{t("ad.submittedOn", { date: formatDate(app.submittedAt, locale) })}</p>
            </div>
            <div className="bg-surface p-5">
              <p className="text-xs text-muted">{t("ad.next")}</p>
              <p className="mt-1 text-sm font-medium text-ink-strong">{nextLabel}</p>
            </div>
          </div>
        </section>
      )}

      {app.status === "correction_requested" && (
        <section aria-labelledby="corr-title" className="mb-6 overflow-hidden rounded-xl border border-amber-500/40 bg-amber-50/60">
          <div className="flex items-start gap-3 border-b border-amber-500/30 px-5 py-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden />
            <div>
              <h2 id="corr-title" className="font-display font-semibold text-ink-strong">
                {t("ad.corrTitle", { stage: L.stage(app.stage) })}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink">{app.correctionNote}</p>
            </div>
          </div>
          {isOwner ? (
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <div>
                {correctionUploaded ? (
                  <FileRow name={correctionUploaded} sizeKb={1320} kind="photo" meta={t("up.sampleTag")} onRemove={() => setCorrectionUploaded(null)} />
                ) : (
                  <FileDrop
                    label={t("ad.corrUpload")}
                    sampleName="adjacent_road_daytime_sample.jpg"
                    onUploaded={(f) => {
                      addDocument(app.id, { name: f.name, sizeKb: f.sizeKb, category: "road_photo", previewKind: "photo" });
                      setCorrectionUploaded(f.name);
                    }}
                  />
                )}
              </div>
              <div className="space-y-3">
                <Field label={t("ad.corrNote")} optional>
                  {(a) => <Textarea {...a} rows={3} value={correction} onChange={(e) => setCorrection(e.target.value)} placeholder={t("ad.corrNotePh")} />}
                </Field>
                <Button onClick={resubmit} loading={resubmitting} disabled={!correctionUploaded}>
                  <Send /> {t("ad.corrSend")}
                </Button>
              </div>
            </div>
          ) : (
            <p className="px-5 py-3 text-sm text-muted">{t("ad.corrPro")}</p>
          )}
        </section>
      )}

      {app.status === "fee_pending" && (
        <section aria-labelledby="fee-title" className="mb-6 overflow-hidden rounded-xl border border-amber-500/40 bg-surface">
          <div className="flex items-start gap-3 border-b border-line bg-amber-50/60 px-5 py-4">
            <Stamp className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden />
            <div>
              <h2 id="fee-title" className="font-display font-semibold text-ink-strong">
                {t("ad.feeTitle")}
              </h2>
              <p className="mt-1 text-sm text-ink">{t("ad.feeBody")}</p>
            </div>
          </div>
          <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <ol className="grid gap-3 sm:grid-cols-2">
              {(["electrical", "plumbing"] as const).map((k) => {
                const d = svc(k);
                return (
                  <li key={k}>
                    <p className="mb-1.5 flex items-center gap-2 text-[0.8125rem] font-medium text-ink-strong">
                      {k === "electrical" ? t("ad.svcElectrical") : t("ad.svcPlumbing")}
                      {d && (
                        <Badge tone="success" icon={BadgeCheck}>
                          {t("ad.svcDone")}
                        </Badge>
                      )}
                    </p>
                    {d ? (
                      <FileRow name={d.name} sizeKb={d.sizeKb} kind="drawing" meta={`v${d.version} · ${userName(users, d.uploadedBy)}`} onPreview={() => setPreview(d)} />
                    ) : canUploadService(k) && !svcSubmitted ? (
                      <FileDrop
                        compact
                        label={t("ad.serviceUpload", { kind: k === "electrical" ? t("ad.svcElectrical") : t("ad.svcPlumbing") })}
                        accept=".pdf"
                        sampleName={`${k}_layout_sample.pdf`}
                        onUploaded={(f) => addDocument(app.id, { name: f.name, sizeKb: f.sizeKb, category: "drawing", service: k, previewKind: "drawing", pages: 1 })}
                      />
                    ) : (
                      <p className="rounded-lg border border-dashed border-line-strong px-3 py-3 text-xs text-muted">{t("ad.awaitingPayment")}</p>
                    )}
                  </li>
                );
              })}
            </ol>
            <div className="space-y-3">
              {!svcSubmitted ? (
                <Button className="w-full" variant="secondary" disabled={!svc("electrical") || !svc("plumbing") || !(isOwner || myParticipation)} loading={svcBusy} onClick={submitServiceDrawings}>
                  <Upload /> {t("ad.svcSubmit")}
                </Button>
              ) : (
                <p className="flex items-center gap-2 rounded-lg bg-success-100/60 px-3 py-2 text-sm text-success-700">
                  <BadgeCheck className="size-4" aria-hidden /> {t("ad.svcSubmitted")}
                </p>
              )}
              {isOwner && (
                <>
                  <Button className="w-full" onClick={() => setPayOpen(true)} disabled={!svcSubmitted} aria-describedby={!svcSubmitted ? "pay-why" : undefined}>
                    <CreditCard /> {t("ad.payNow", { amount: formatBDT(app.fee?.total ?? 0, locale) })}
                  </Button>
                  {!svcSubmitted && (
                    <p id="pay-why" className="text-xs text-muted">
                      {t("ad.payBlocked")}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {app.status === "rejected" && (
        <Callout tone="danger" className="mb-6" title={t("ad.rejected")}>
          {app.history.findLast((x) => x.action === "rejected")?.note ?? ""} {canAppeal && t("ad.canAppeal")}
        </Callout>
      )}

      {myParticipation && EDITABLE_FOR_PRO.includes(app.status) && <ProfessionalWorkPanel app={app} participation={myParticipation} />}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t("ad.tab.overview")}</TabsTrigger>
          <TabsTrigger value="documents">{t("ad.tab.documents", { n: liveDocs.length })}</TabsTrigger>
          <TabsTrigger value="professionals">{t("ad.tab.professionals")}</TabsTrigger>
          <TabsTrigger value="timeline">{t("ad.tab.timeline")}</TabsTrigger>
          <TabsTrigger value="payments">{t("ad.tab.payments")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-6">
              <Panel title={t("st.prop.title")}>
                <KeyValues
                  columns={3}
                  items={[
                    { k: t("ad.k.zone"), v: `${app.property.zone} · ${app.property.subZone}` },
                    { k: t("ad.k.block"), v: app.property.block, mono: true },
                    { k: t("ad.k.area"), v: app.property.area },
                    { k: t("ad.k.mouza"), v: app.property.mouza },
                    { k: t("ad.k.rsdag"), v: app.property.rsDag, mono: true },
                    { k: t("ad.k.plot"), v: `${app.property.plotAreaSqm} m²` },
                    { k: t("ad.k.road"), v: `${app.property.roadWidthM} m` },
                    { k: t("ad.k.ownership"), v: t(app.property.ownershipType === "rajuk_lease" ? "st.prop.lease" : app.property.ownershipType === "private_housing" ? "st.prop.private" : "st.prop.freehold") },
                    { k: t("ad.k.address"), v: app.property.address, full: true },
                  ]}
                />
              </Panel>
              {app.building && (
                <Panel title={t("ad.building")}>
                  <KeyValues
                    columns={3}
                    items={[
                      { k: t("ad.k.occupancy"), v: `${app.building.occupancy} · ${L.occ(app.building.occupancy)}` },
                      { k: t("ad.k.storeys"), v: `${app.building.storeys}${app.building.basements ? ` + B${app.building.basements}` : ""}` },
                      { k: t("ad.k.tfa"), v: `${app.building.totalFloorAreaSqm.toLocaleString("en-IN")} m²` },
                      { k: t("ad.k.units"), v: app.building.units },
                      { k: t("ad.k.height"), v: `${app.building.heightM} m` },
                      { k: t("ad.k.setbacks"), v: `${app.building.setbacks.front} / ${app.building.setbacks.rear} / ${app.building.setbacks.left} / ${app.building.setbacks.right} m` },
                    ]}
                  />
                </Panel>
              )}
              {visibleObservations.length > 0 && (
                <Panel title={t("ad.observations")}>
                  <ul className="space-y-3">
                    {visibleObservations.map((o) => (
                      <li key={o.id} className="rounded-lg border border-line bg-surface-2 p-3 text-sm">
                        <p className="text-ink">{o.text}</p>
                        <p className="mt-1 text-xs text-muted">
                          {L.stage(o.stage)} · {formatDateTime(o.at, locale)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
            </div>
            <div className="space-y-6">
              {app.location && <SiteMap lat={app.location.lat} lng={app.location.lng} height={220} label={t("st.loc.title")} />}
              <Panel title={t("ad.owners")}>
                <ul className="space-y-2.5">
                  {app.owners.map((o) => (
                    <li key={o.name} className="flex items-center gap-3">
                      <Avatar name={o.name} size="sm" />
                      <p className="text-sm font-medium text-ink-strong">{o.name}</p>
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
                <h3 className="mb-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-muted">{L.doc(g)}</h3>
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
          <ProfessionalsTab app={app} canReplace={isOwner && !["draft", "approved", "rejected", "appealed"].includes(app.status)} />
        </TabsContent>

        <TabsContent value="timeline" className="pt-6">
          <Panel>
            <Timeline items={eventsToTimeline(app, users, { label: (a) => t(`act.${a}` as MessageKey), stage: (s) => L.stage(s), simulated: t("ad2.simulated"), locale })} />
          </Panel>
        </TabsContent>

        <TabsContent value="payments" className="pt-6">
          <Panel bodyClassName="p-0">
            {appPayments.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={FileText} title={t("ad.noPayments")} />
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {appPayments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink-strong">{p.category === "application_fee" ? t("fee.application") : p.category === "permit_fee" ? t("fee.area") : p.category.replace("_", " ")}</p>
                      <p className="ref text-xs text-muted">{p.gatewayRef ?? t("ad.awaitingPayment")}</p>
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
        <DialogContent size="xl" eyebrow={t("ad.previewTitle")} title={preview?.name ?? ""} description={preview ? t("ad.version", { cat: L.doc(preview.category), v: preview.version }) : undefined}>
          {preview && <DocumentPreview doc={preview} app={app} />}
        </DialogContent>
      </Dialog>

      <Dialog open={letterOpen} onOpenChange={setLetterOpen}>
        <DialogContent size="xl" eyebrow={app.ref} title={t("ad.letter")}>
          {letterKind && <DecisionLetter app={app} users={users} kind={letterKind} />}
        </DialogContent>
      </Dialog>

      <PaymentDialog app={app} open={payOpen && app.status === "fee_pending" && svcSubmitted} onOpenChange={setPayOpen} />

      <ConfirmDialog
        open={appealOpen}
        onOpenChange={setAppealOpen}
        eyebrow={app.type === "OC" ? "OC appeal · TOR 2.4" : t("ad.appeal")}
        title={t("ad.appealTitle")}
        description={t("ad.appealBody")}
        confirmLabel={t("ad.appealYes")}
        cancelLabel={t("wiz.confirm.no")}
        loading={appealBusy}
        onConfirm={fileAppeal}
      >
        <Field label={t("ad.appealGrounds")} required error={appealErr}>
          {(a) => (
            <Textarea
              {...a}
              rows={4}
              value={grounds}
              onChange={(e) => {
                setGrounds(e.target.value);
                setAppealErr("");
              }}
            />
          )}
        </Field>
      </ConfirmDialog>

      {app.status !== "draft" && (
        <p className="mt-8 flex flex-wrap items-center gap-2 text-xs text-muted">
          <ShieldCheck className="size-3.5" aria-hidden /> {t("ad.audit")} ({Math.round(daysBetween(app.createdAt))} d)
          <Link href={`/track?ref=${app.ref}`} className="inline-flex items-center gap-1 font-medium text-teal-700 hover:underline">
            {t("ad.publicView")} <ArrowRight className="size-3" aria-hidden />
          </Link>
        </p>
      )}
    </div>
  );
}

/* ———————————————————————————— Professionals tab with replacement ———————————————————————————— */

function ProfessionalsTab({ app, canReplace }: { app: Application; canReplace: boolean }) {
  const { t, locale } = useI18n();
  const L = useDomainLabels();
  const users = useUsers();
  const [target, setTarget] = useState<ProfessionalParticipation | null>(null);
  const [newUser, setNewUser] = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const candidates = target ? users.filter((u) => u.role === "professional" && u.discipline === target.role && u.membership?.verified && u.id !== target.userId) : [];

  const confirm = async () => {
    if (reason.trim().length < 10) return setErr(t("ad.replaceReasonShort"));
    setBusy(true);
    await ecps.applications.replaceProfessional(app.id, target!.userId, newUser, reason.trim());
    setBusy(false);
    setTarget(null);
    toast.success(t("ad.replaced"), t("ad.replacedBody"));
  };

  return (
    <Panel bodyClassName="p-0">
      <ul className="divide-y divide-line">
        {app.professionals.map((p) => {
          const u = users.find((x) => x.id === p.userId);
          return (
            <li key={p.userId + p.role + p.invitedAt} className={cn("flex flex-wrap items-center gap-3 px-5 py-3.5", p.status === "replaced" && "opacity-60")}>
              <Avatar name={u?.name ?? "?"} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-strong">{u?.name}</p>
                <p className="text-xs text-muted">
                  {L.pro(p.role)} · {u?.membership?.body} <span className="ref">{u?.membership?.number}</span>
                </p>
                {p.status === "accepted" && (
                  <p className={cn("mt-0.5 text-xs", p.endorsedAt ? "text-success-700" : "text-subtle")}>{p.endorsedAt ? t("ad.endorsed", { when: formatRelative(p.endorsedAt, undefined, locale) }) : t("ad.notEndorsed")}</p>
                )}
                {p.replacementReason && <p className="mt-0.5 text-xs text-muted">“{p.replacementReason}”</p>}
              </div>
              <Badge tone={p.status === "accepted" ? "success" : p.status === "invited" ? "warning" : p.status === "declined" ? "danger" : "neutral"}>
                {p.status === "replaced" ? t("ad.replacedTag") : p.status === "accepted" ? t("st.pro.accepted") : p.status === "invited" ? t("st.pro.invited", { when: "" }).trim() : p.status}
              </Badge>
              {canReplace && ["accepted", "invited"].includes(p.status) && (
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={() => {
                    setTarget(p);
                    setReason("");
                    setErr("");
                    setNewUser(users.find((x) => x.role === "professional" && x.discipline === p.role && x.membership?.verified && x.id !== p.userId)?.id ?? "");
                  }}
                >
                  <Repeat2 /> {t("ad.replace")}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
        eyebrow={app.ref}
        title={target ? t("ad.replaceTitle", { role: L.pro(target.role).toLowerCase() }) : ""}
        description={t("ad.replaceBody")}
        confirmLabel={t("ad.replaceYes")}
        cancelLabel={t("wiz.confirm.no")}
        confirmDisabled={!newUser}
        loading={busy}
        onConfirm={confirm}
      >
        <div className="space-y-4">
          <Field label={t("ad.replaceWith")} required>
            {(a) =>
              candidates.length ? (
                <Select {...a} value={newUser} onChange={(e) => setNewUser(e.target.value)}>
                  {candidates.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.membership?.body} {u.membership?.number}
                    </option>
                  ))}
                </Select>
              ) : (
                <p className="text-sm text-muted">{t("st.pro.none")}</p>
              )
            }
          </Field>
          <Field label={t("ad.replaceReason")} required error={err}>
            {(a) =>
              <Textarea
                {...a}
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setErr("");
                }}
              />
            }
          </Field>
        </div>
      </ConfirmDialog>
    </Panel>
  );
}

/* ———————————————————————————— Professional's own work: revisions & endorsement ———————————————————————————— */

function ProfessionalWorkPanel({ app, participation }: { app: Application; participation: ProfessionalParticipation }) {
  const { t, locale } = useI18n();
  const L = useDomainLabels();
  const addDocument = useDemoStore((s) => s.addDocument);
  const [sheet, setSheet] = useState<DrawingSheetKind>("ground");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const sheets: DrawingSheetKind[] = ["site", "ground", "typical", "elevation", "section", "far"];
  const role = participation.role;

  const upload = (name: string, sizeKb: number) => {
    if (role === "architect") {
      const prior = app.documents.filter((d) => d.category === "drawing" && d.drawingSheet === sheet && d.status !== "superseded");
      addDocument(app.id, { name, sizeKb, category: "drawing", drawingSheet: sheet, previewKind: "drawing", pages: 1 });
      toast.success(t("ad.revisionToast"), t("ad.revisionBody", { v: (prior[0]?.version ?? 0) + 1 }));
    } else if (role === "electrical" || role === "plumbing") {
      addDocument(app.id, { name, sizeKb, category: "drawing", service: role, previewKind: "drawing", pages: 1 });
      toast.success(t("ad.revisionToast"), t("ad.revisionBody", { v: 1 }));
    } else {
      addDocument(app.id, { name, sizeKb, category: "professional", previewKind: "document", pages: 18 });
      toast.success(t("ad.revisionToast"), t("ad.revisionBody", { v: 1 }));
    }
  };

  const endorse = async () => {
    setBusy(true);
    await ecps.applications.endorseDrawings(app.id);
    setBusy(false);
    setConfirm(false);
    toast.success(t("ad.endorsedToast"));
  };

  return (
    <section aria-labelledby="mywork" className="mb-6 rounded-xl border border-teal-600/25 bg-teal-50/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="mywork" className="font-display font-semibold text-ink-strong">
            {t("ad.myWork")} · {L.pro(role)}
          </h2>
          <p className="mt-0.5 text-sm text-muted">{t("ad.myWorkLead")}</p>
        </div>
        {participation.endorsedAt ? (
          <Badge tone="success" icon={BadgeCheck}>
            {t("ad.endorsed", { when: formatRelative(participation.endorsedAt, undefined, locale) })}
          </Badge>
        ) : (
          <Button size="sm" onClick={() => setConfirm(true)}>
            <BadgeCheck /> {t("ad.endorse")}
          </Button>
        )}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[12rem_minmax(0,1fr)] md:items-end">
        {role === "architect" ? (
          <Field label={t("ad.sheetToReplace")}>
            {(a) => (
              <Select {...a} value={sheet} onChange={(e) => setSheet(e.target.value as DrawingSheetKind)}>
                {sheets.map((s) => (
                  <option key={s} value={s}>
                    {L.sheet(s)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        ) : (
          <span className="hidden md:block" />
        )}
        <FileDrop compact label={t("ad.uploadRevision")} accept=".pdf" sampleName={`${role}_${role === "architect" ? sheet : "drawing"}_revised_sample.pdf`} onUploaded={(f) => upload(f.name, f.sizeKb)} />
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        eyebrow={app.ref}
        title={t("ad.endorseTitle")}
        description={t("ad.endorseBody")}
        confirmLabel={t("ad.endorseYes")}
        cancelLabel={t("wiz.confirm.no")}
        loading={busy}
        onConfirm={endorse}
      />
    </section>
  );
}
