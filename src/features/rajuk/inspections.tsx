"use client";

import { ArrowLeft, Camera, Check, ChevronRight, CircleDot, Crosshair, MapPin, Minus, Save, Send, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { PhotoPlaceholder } from "@/components/domain/document-preview";
import { SiteMap } from "@/components/domain/site-map";
import { Button } from "@/components/ui/button";
import { Badge, PageHeader } from "@/components/ui/display";
import { Callout, EmptyState, ProgressBar, SimulatedTag } from "@/components/ui/feedback";
import { ChoiceCard, RadioGroup, SegmentedControl, Textarea } from "@/components/ui/form";
import { ConfirmDialog } from "@/components/ui/overlay";
import { toast } from "@/components/ui/toast";
import { checklistCompletion, INSPECTION_CHECKLIST } from "@/lib/domain/checklists";
import type { Inspection } from "@/lib/domain/types";
import { ecps } from "@/lib/services";
import { useDemoStore } from "@/lib/store/demo-store";
import { cn, formatDate, formatDateTime, uid } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useLabels } from "@/lib/i18n/labels";


function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dy = (a.lat - b.lat) * 111_320;
  const dx = (a.lng - b.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.round(Math.hypot(dx, dy));
}

export function InspectionList() {
  const { t, locale } = useI18n();
  const session = useDemoStore((s) => s.session);
  const inspections = useDemoStore((s) => s.inspections);
  const applications = useDemoStore((s) => s.applications);
  const [tab, setTab] = useState<"open" | "submitted">("open");
  const mine = useMemo(() => inspections.filter((i) => session?.role !== "inspector" || i.inspectorId === session.userId), [inspections, session]);
  const list = mine.filter((i) => (tab === "open" ? i.status !== "submitted" : i.status === "submitted")).sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader kicker={t("in.kicker")} title={t("in.title")} description={t("in.desc")} />
      <SegmentedControl
        className="mb-4"
        label={t("in.statusLabel")}
        value={tab}
        onChange={setTab}
        options={[
          { value: "open", label: t("in.todo"), count: mine.filter((i) => i.status !== "submitted").length },
          { value: "submitted", label: t("in.submitted"), count: mine.filter((i) => i.status === "submitted").length },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState title={t("in.none")} />
      ) : (
        <ul className="space-y-3">
          {list.map((i) => {
            const a = applications.find((x) => x.id === i.applicationId)!;
            const c = checklistCompletion(INSPECTION_CHECKLIST, i.checklist);
            const today = new Date(i.scheduledFor).toDateString() === new Date().toDateString();
            return (
              <li key={i.id}>
                <Link href={`/rajuk/inspections/${i.id}`} className="group block rounded-xl border border-line bg-surface p-4 shadow-xs transition-colors hover:border-teal-600/40 active:bg-surface-2 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {today && i.status !== "submitted" && <Badge tone="danger">{t("in.today")}</Badge>}
                        <Badge tone={i.status === "submitted" ? "success" : i.status === "draft" ? "warning" : "info"}>{i.status === "assigned" ? t("in.assigned") : i.status === "draft" ? t("in.draftSaved") : t("in.submitted")}</Badge>
                      </div>
                      <p className="mt-2 font-display text-base font-semibold text-ink-strong">{t(`inkind.${i.kind}`)}</p>
                      <p className="mt-0.5 text-sm text-muted">{a.property.address}</p>
                    </div>
                    <ChevronRight className="mt-1 size-5 shrink-0 text-subtle group-hover:text-teal-700" aria-hidden />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="ref text-ink">{a.ref}</span>
                    <span>{formatDateTime(i.scheduledFor, locale)}</span>
                    {i.status !== "assigned" && <span>{t("in.progress", { done: c.done, total: c.total, n: i.photos.length })}</span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function InspectionForm({ id }: { id: string }) {
  const { t, locale } = useI18n();
  const L = useLabels();
  const inspection = useDemoStore((s) => s.inspections.find((i) => i.id === id));
  const app = useDemoStore((s) => s.applications.find((a) => a.id === inspection?.applicationId));
  const setItem = useDemoStore((s) => s.setInspectionChecklist);
  const session = useDemoStore((s) => s.session);
  const fileRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState(inspection?.observations ?? "");
  const [outcome, setOutcome] = useState<Inspection["outcome"]>(inspection?.outcome ?? "compliant");
  const [capturing, setCapturing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!inspection || !app) return <EmptyState title={t("in.notFound")} action={<Button asChild><Link href="/rajuk/inspections">{t("in.back")}</Link></Button>} />;
  const locked = inspection.status === "submitted";
  const canEdit = !locked && (session?.role === "inspector" ? inspection.inspectorId === session.userId : false);
  const c = checklistCompletion(INSPECTION_CHECKLIST, inspection.checklist);
  const plot = app.location ?? { lat: 23.78, lng: 90.4 };
  const dist = inspection.gps ? distanceM(inspection.gps, plot) : undefined;

  const capture = async () => {
    setCapturing(true);
    await new Promise((r) => setTimeout(r, 900));
    await ecps.inspections.saveDraft(inspection.id, { gps: { lat: +(plot.lat + 0.00012).toFixed(6), lng: +(plot.lng - 0.00009).toFixed(6), accuracyM: 7, capturedAt: new Date().toISOString(), simulated: true } });
    setCapturing(false);
  };

  const addPhoto = async (caption: string, dataUrl?: string) => {
    await ecps.inspections.saveDraft(inspection.id, { photos: [...inspection.photos, { id: uid("ph"), caption, takenAt: new Date().toISOString(), sample: true, dataUrl }] });
    toast.success(t("in.photoAttached"));
  };

  const saveDraft = async () => {
    setBusy(true);
    await ecps.inspections.saveDraft(inspection.id, { observations: notes, outcome });
    setBusy(false);
    toast.success(t("in.toast.draft"), t("in.toast.draftBody"));
  };

  const submit = async () => {
    setBusy(true);
    await ecps.inspections.saveDraft(inspection.id, { observations: notes });
    await ecps.inspections.submit(inspection.id, outcome);
    setBusy(false);
    setConfirm(false);
    toast.success(t("in.toast.submitted"), t("in.toast.submittedBody"));
  };

  return (
    <div className="mx-auto max-w-3xl pb-28">
      <Link href="/rajuk/inspections" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink-strong">
        <ArrowLeft className="size-4" aria-hidden /> {t("in.title")}
      </Link>
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={locked ? "success" : inspection.status === "draft" ? "warning" : "info"}>{locked ? t("in.submitted") : inspection.status === "draft" ? t("in.draft") : t("in.assigned")}</Badge>
          <span className="ref text-sm text-muted">{app.ref}</span>
        </div>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink-strong">{t(`inkind.${inspection.kind}`)}</h1>
        <p className="mt-1 text-sm text-muted">
          {t("in.scheduled", { address: app.property.address, when: formatDateTime(inspection.scheduledFor, locale) })}
        </p>
      </div>

      {locked && (
        <Callout tone="success" className="mb-5" title={t("in.lockedTitle", { date: formatDate(inspection.submittedAt, locale), outcome: L.outcome(inspection.outcome ?? "compliant") })}>
          {t("in.lockedBody")}
        </Callout>
      )}

      {/* Location */}
      <section aria-labelledby="loc" className="mb-5 overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <h2 id="loc" className="flex items-center gap-2 font-display text-[0.9375rem] font-semibold text-ink-strong">
            <MapPin className="size-4 text-amber-700" aria-hidden /> {t("in.location")}
          </h2>
          {canEdit && (
            <Button size="sm" variant={inspection.gps ? "ghost" : "primary"} onClick={capture} loading={capturing}>
              <Crosshair /> {inspection.gps ? t("in.recapture") : t("in.capture")}
            </Button>
          )}
        </div>
        <SiteMap lat={plot.lat} lng={plot.lng} device={inspection.gps} height={240} label={t("in.mapLabel")} className="rounded-none border-x-0 border-b-0" />
        <div className="grid grid-cols-2 gap-px border-t border-line bg-line text-sm">
          <div className="bg-surface px-4 py-2.5">
            <p className="text-xs text-muted">{t("in.device")}</p>
            <p className="ref text-ink-strong">{inspection.gps ? `${inspection.gps.lat.toFixed(5)}, ${inspection.gps.lng.toFixed(5)}` : t("in.notCaptured")}</p>
          </div>
          <div className="bg-surface px-4 py-2.5">
            <p className="text-xs text-muted">{t("in.distance")}</p>
            <p className={cn("font-medium", dist === undefined ? "text-muted" : dist <= 30 ? "text-success-700" : "text-amber-700")}>
              {dist === undefined ? "—" : dist <= 30 ? t("in.onSite", { m: dist }) : t("in.check", { m: dist })} {inspection.gps?.simulated && <SimulatedTag className="ml-1" />}
            </p>
          </div>
        </div>
      </section>

      {/* Project summary */}
      <section className="mb-5 rounded-xl border border-line bg-surface p-4 text-sm">
        <h2 className="mb-3 font-display text-[0.9375rem] font-semibold text-ink-strong">{t("in.approved")}</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted">{t("in.permit")}</dt>
            <dd className="font-medium text-ink-strong">{L.service(app.type)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t("in.storeys")}</dt>
            <dd className="font-medium text-ink-strong">{app.building?.storeys ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t("in.use")}</dt>
            <dd className="font-medium text-ink-strong">{app.building ? L.occ(app.building.occupancy) : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t("in.setback")}</dt>
            <dd className="font-medium text-ink-strong">{app.building ? t("in.meters", { n: app.building.setbacks.front }) : "—"}</dd>
          </div>
        </dl>
      </section>

      {/* Checklist */}
      <section aria-labelledby="chk" className="mb-5 rounded-xl border border-line bg-surface">
        <div className="border-b border-line px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 id="chk" className="font-display text-[0.9375rem] font-semibold text-ink-strong">
              {t("in.checklist")}
            </h2>
            <span className="tabular text-xs text-muted">
              {c.done}/{c.total}
            </span>
          </div>
          <ProgressBar value={c.done / c.total} className="mt-2" tone={c.failed ? "amber" : "teal"} label={t("in.chkProgress")} />
        </div>
        {INSPECTION_CHECKLIST.map((sec) => (
          <fieldset key={sec.id} className="border-b border-line px-4 py-3 last:border-0">
            <legend className="sr-only">{L.chkSection(sec.id)}</legend>
            <p className="mb-2 flex items-center justify-between text-xs">
              <span className="font-mono uppercase tracking-[0.12em] text-muted [:lang(bn)_&]:font-sans [:lang(bn)_&]:normal-case [:lang(bn)_&]:tracking-normal">{L.chkSection(sec.id)}</span>
              <span className="text-subtle">{L.chkSource(sec.id)}</span>
            </p>
            <ul className="space-y-3">
              {sec.items.map((it) => {
                const st = inspection.checklist[it.id]?.result ?? null;
                return (
                  <li key={it.id}>
                    <p className="text-sm text-ink">{L.chkItem(it.id)}</p>
                    <div role="radiogroup" aria-label={L.chkItem(it.id)} className="mt-2 grid grid-cols-3 gap-2">
                      {(
                        [
                          ["pass", t("in.yes"), Check, "border-success-600 bg-success-600 text-white"],
                          ["fail", t("in.no"), X, "border-danger-600 bg-danger-600 text-white"],
                          ["na", t("in.na"), Minus, "border-muted bg-muted text-surface"],
                        ] as const
                      ).map(([v, label, Icon, on]) => (
                        <button
                          key={v}
                          type="button"
                          role="radio"
                          aria-checked={st === v}
                          disabled={!canEdit}
                          onClick={() => setItem(inspection.id, { id: it.id, result: st === v ? null : v })}
                          className={cn("flex h-11 items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition-colors disabled:cursor-not-allowed", st === v ? on : "border-line-strong bg-surface text-ink hover:bg-surface-2")}
                        >
                          <Icon className="size-4" aria-hidden /> {label}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ))}
      </section>

      {/* Photos */}
      <section aria-labelledby="ph" className="mb-5 rounded-xl border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="ph" className="font-display text-[0.9375rem] font-semibold text-ink-strong">
            {t("in.photos")}
          </h2>
          <span className="text-xs text-muted">{t("in.attached", { n: inspection.photos.length })}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {inspection.photos.map((p) =>
            p.dataUrl ? (
              <figure key={p.id} className="overflow-hidden rounded-lg border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.dataUrl} alt={p.caption} className="aspect-[4/3] w-full object-cover" />
                <figcaption className="truncate px-2 py-1 text-xs text-muted">{p.caption}</figcaption>
              </figure>
            ) : (
              <PhotoPlaceholder key={p.id} label={p.caption} kind="site" />
            ),
          )}
          {canEdit && (
            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong bg-surface-2 p-3 text-center">
              <Camera className="size-6 text-teal-700" aria-hidden />
              <Button size="xs" variant="secondary" onClick={() => fileRef.current?.click()}>
                {t("in.take")}
              </Button>
              <Button size="xs" variant="subtle" onClick={() => addPhoto(t("in.sampleCaption", { n: inspection.photos.length + 1 }))}>
                {t("in.sample")}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                tabIndex={-1}
                aria-label={t("in.photoLabel")}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    // Downscale to keep demo storage small.
                    const img = new Image();
                    img.onload = () => {
                      const canvas = document.createElement("canvas");
                      const scale = Math.min(1, 480 / img.width);
                      canvas.width = img.width * scale;
                      canvas.height = img.height * scale;
                      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
                      void addPhoto(f.name, canvas.toDataURL("image/jpeg", 0.7));
                    };
                    img.src = String(reader.result);
                  };
                  reader.readAsDataURL(f);
                }}
              />
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-muted">{t("in.photoNote")}</p>
      </section>

      {/* Observations & outcome */}
      <section className="mb-5 space-y-4 rounded-xl border border-line bg-surface p-4">
        <div>
          <label htmlFor="obs" className="font-display text-[0.9375rem] font-semibold text-ink-strong">
            {t("in.observations")}
          </label>
          <Textarea id="obs" className="mt-2" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={!canEdit} placeholder={t("in.obsPlaceholder")} />
        </div>
        <div>
          <p className="mb-2 font-display text-[0.9375rem] font-semibold text-ink-strong">{t("in.outcome")}</p>
          <RadioGroup value={outcome} onValueChange={(v) => setOutcome(v as Inspection["outcome"])} disabled={!canEdit} className="grid gap-2" aria-label={t("in.outcome")}>
            <ChoiceCard value="compliant" title={L.outcome("compliant")} icon={<CircleDot className="size-4 text-success-700" />} />
            <ChoiceCard value="minor_deviation" title={L.outcome("minor_deviation")} description={t("in.minorDesc")} icon={<CircleDot className="size-4 text-amber-700" />} />
            <ChoiceCard value="major_deviation" title={L.outcome("major_deviation")} description={t("in.majorDesc")} icon={<CircleDot className="size-4 text-danger-700" />} />
          </RadioGroup>
        </div>
      </section>

      {/* Sticky actions — thumb-reachable on mobile */}
      {canEdit && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:left-64">
          <div className="mx-auto flex max-w-3xl gap-2">
            <Button variant="secondary" size="lg" className="flex-1" onClick={saveDraft} loading={busy && !confirm}>
              <Save /> {t("in.saveDraft")}
            </Button>
            <Button size="lg" className="flex-1" onClick={() => setConfirm(true)} disabled={!inspection.gps || c.done < c.total}>
              <Send /> {t("in.submit")}
            </Button>
          </div>
          {(!inspection.gps || c.done < c.total) && <p className="mx-auto mt-1.5 max-w-3xl text-center text-xs text-muted">{t("in.needAll")}</p>}
        </div>
      )}
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title={t("in.q")} description={t("in.qDesc")} confirmLabel={t("in.yesSubmit")} loading={busy} onConfirm={submit} />
    </div>
  );
}
