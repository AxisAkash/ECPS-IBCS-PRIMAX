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
import { OCCUPANCY, SERVICE_SHORT_LABEL } from "@/lib/domain/catalog";
import type { Inspection } from "@/lib/domain/types";
import { ecps } from "@/lib/services";
import { useDemoStore } from "@/lib/store/demo-store";
import { cn, formatDate, formatDateTime, uid } from "@/lib/utils";

const KIND_LABEL: Record<Inspection["kind"], string> = {
  construction_start: "Construction start verification",
  plinth: "Plinth-level inspection",
  frcm_monitoring: "FRCM monitoring visit",
  occupancy: "Occupancy Certificate inspection",
  complaint: "Complaint / site verification",
};

function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dy = (a.lat - b.lat) * 111_320;
  const dx = (a.lng - b.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.round(Math.hypot(dx, dy));
}

export function InspectionList() {
  const session = useDemoStore((s) => s.session);
  const inspections = useDemoStore((s) => s.inspections);
  const applications = useDemoStore((s) => s.applications);
  const [tab, setTab] = useState<"open" | "submitted">("open");
  const mine = useMemo(() => inspections.filter((i) => session?.role !== "inspector" || i.inspectorId === session.userId), [inspections, session]);
  const list = mine.filter((i) => (tab === "open" ? i.status !== "submitted" : i.status === "submitted")).sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader kicker="Field inspections · TOR 1.12 · 2.3" title="Inspections" description="Assigned site visits with location, checklist and photographs. Designed for use on a phone in the field." />
      <SegmentedControl
        className="mb-4"
        label="Inspection status"
        value={tab}
        onChange={setTab}
        options={[
          { value: "open", label: "To do", count: mine.filter((i) => i.status !== "submitted").length },
          { value: "submitted", label: "Submitted", count: mine.filter((i) => i.status === "submitted").length },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState title="No inspections here" />
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
                        {today && i.status !== "submitted" && <Badge tone="danger">Today</Badge>}
                        <Badge tone={i.status === "submitted" ? "success" : i.status === "draft" ? "warning" : "info"}>{i.status === "assigned" ? "Assigned" : i.status === "draft" ? "Draft saved" : "Submitted"}</Badge>
                      </div>
                      <p className="mt-2 font-display text-base font-semibold text-ink-strong">{KIND_LABEL[i.kind]}</p>
                      <p className="mt-0.5 text-sm text-muted">{a.property.address}</p>
                    </div>
                    <ChevronRight className="mt-1 size-5 shrink-0 text-subtle group-hover:text-teal-700" aria-hidden />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="ref text-ink">{a.ref}</span>
                    <span>{formatDateTime(i.scheduledFor)}</span>
                    {i.status !== "assigned" && <span>{c.done}/{c.total} checks · {i.photos.length} photo(s)</span>}
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

  if (!inspection || !app) return <EmptyState title="Inspection not found" action={<Button asChild><Link href="/rajuk/inspections">Back</Link></Button>} />;
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
    toast.success("Photo attached");
  };

  const saveDraft = async () => {
    setBusy(true);
    await ecps.inspections.saveDraft(inspection.id, { observations: notes, outcome });
    setBusy(false);
    toast.success("Draft saved", "You can finish later, even offline in the field app.");
  };

  const submit = async () => {
    setBusy(true);
    await ecps.inspections.saveDraft(inspection.id, { observations: notes });
    await ecps.inspections.submit(inspection.id, outcome);
    setBusy(false);
    setConfirm(false);
    toast.success("Inspection submitted", "The file holder has been notified.");
  };

  return (
    <div className="mx-auto max-w-3xl pb-28">
      <Link href="/rajuk/inspections" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink-strong">
        <ArrowLeft className="size-4" aria-hidden /> Inspections
      </Link>
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={locked ? "success" : inspection.status === "draft" ? "warning" : "info"}>{locked ? "Submitted" : inspection.status === "draft" ? "Draft" : "Assigned"}</Badge>
          <span className="ref text-sm text-muted">{app.ref}</span>
        </div>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink-strong">{KIND_LABEL[inspection.kind]}</h1>
        <p className="mt-1 text-sm text-muted">
          {app.property.address} · scheduled {formatDateTime(inspection.scheduledFor)}
        </p>
      </div>

      {locked && (
        <Callout tone="success" className="mb-5" title={`Submitted ${formatDate(inspection.submittedAt)} · outcome: ${inspection.outcome?.replace("_", " ")}`}>
          The record is locked. Corrections require a new inspection entry.
        </Callout>
      )}

      {/* Location */}
      <section aria-labelledby="loc" className="mb-5 overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <h2 id="loc" className="flex items-center gap-2 font-display text-[0.9375rem] font-semibold text-ink-strong">
            <MapPin className="size-4 text-amber-600" aria-hidden /> Location
          </h2>
          {canEdit && (
            <Button size="sm" variant={inspection.gps ? "ghost" : "primary"} onClick={capture} loading={capturing}>
              <Crosshair /> {inspection.gps ? "Re-capture" : "Capture GPS"}
            </Button>
          )}
        </div>
        <SiteMap lat={plot.lat} lng={plot.lng} device={inspection.gps} height={240} label="Plot and inspector position" className="rounded-none border-x-0 border-b-0" />
        <div className="grid grid-cols-2 gap-px border-t border-line bg-line text-sm">
          <div className="bg-surface px-4 py-2.5">
            <p className="text-xs text-muted">Device position</p>
            <p className="ref text-ink-strong">{inspection.gps ? `${inspection.gps.lat.toFixed(5)}, ${inspection.gps.lng.toFixed(5)}` : "Not captured"}</p>
          </div>
          <div className="bg-surface px-4 py-2.5">
            <p className="text-xs text-muted">Distance to recorded plot</p>
            <p className={cn("font-medium", dist === undefined ? "text-muted" : dist <= 30 ? "text-success-700" : "text-amber-700")}>
              {dist === undefined ? "—" : `${dist} m ${dist <= 30 ? "· on site" : "· check position"}`} {inspection.gps?.simulated && <SimulatedTag className="ml-1" />}
            </p>
          </div>
        </div>
      </section>

      {/* Project summary */}
      <section className="mb-5 rounded-xl border border-line bg-surface p-4 text-sm">
        <h2 className="mb-3 font-display text-[0.9375rem] font-semibold text-ink-strong">Approved project</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted">Permit</dt>
            <dd className="font-medium text-ink-strong">{SERVICE_SHORT_LABEL[app.type]}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Storeys</dt>
            <dd className="font-medium text-ink-strong">{app.building?.storeys ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Use</dt>
            <dd className="font-medium text-ink-strong">{app.building ? OCCUPANCY[app.building.occupancy] : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Front setback</dt>
            <dd className="font-medium text-ink-strong">{app.building?.setbacks.front ?? "—"} m</dd>
          </div>
        </dl>
      </section>

      {/* Checklist */}
      <section aria-labelledby="chk" className="mb-5 rounded-xl border border-line bg-surface">
        <div className="border-b border-line px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 id="chk" className="font-display text-[0.9375rem] font-semibold text-ink-strong">
              Checklist
            </h2>
            <span className="tabular text-xs text-muted">
              {c.done}/{c.total}
            </span>
          </div>
          <ProgressBar value={c.done / c.total} className="mt-2" tone={c.failed ? "amber" : "teal"} label="Checklist progress" />
        </div>
        {INSPECTION_CHECKLIST.map((sec) => (
          <fieldset key={sec.id} className="border-b border-line px-4 py-3 last:border-0">
            <legend className="sr-only">{sec.title}</legend>
            <p className="mb-2 flex items-center justify-between text-xs">
              <span className="font-mono uppercase tracking-[0.12em] text-muted">{sec.title}</span>
              <span className="text-subtle">{sec.source}</span>
            </p>
            <ul className="space-y-3">
              {sec.items.map((it) => {
                const st = inspection.checklist[it.id]?.result ?? null;
                return (
                  <li key={it.id}>
                    <p className="text-sm text-ink">{it.label}</p>
                    <div role="radiogroup" aria-label={it.label} className="mt-2 grid grid-cols-3 gap-2">
                      {(
                        [
                          ["pass", "Yes", Check, "border-success-600 bg-success-600 text-white"],
                          ["fail", "No", X, "border-danger-600 bg-danger-600 text-white"],
                          ["na", "N/A", Minus, "border-slate-ink bg-slate-ink text-white"],
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
            Photographs
          </h2>
          <span className="text-xs text-muted">{inspection.photos.length} attached</span>
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
                Take / choose photo
              </Button>
              <Button size="xs" variant="subtle" onClick={() => addPhoto(`Site photo ${inspection.photos.length + 1} (sample)`)}>
                Use sample photo
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                tabIndex={-1}
                aria-label="Photograph"
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
        <p className="mt-3 text-xs text-muted">Photos stay in this browser for the demo. Production uploads would include timestamp and GPS metadata.</p>
      </section>

      {/* Observations & outcome */}
      <section className="mb-5 space-y-4 rounded-xl border border-line bg-surface p-4">
        <div>
          <label htmlFor="obs" className="font-display text-[0.9375rem] font-semibold text-ink-strong">
            Observations
          </label>
          <Textarea id="obs" className="mt-2" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={!canEdit} placeholder="What did you observe on site?" />
        </div>
        <div>
          <p className="mb-2 font-display text-[0.9375rem] font-semibold text-ink-strong">Outcome</p>
          <RadioGroup value={outcome} onValueChange={(v) => setOutcome(v as Inspection["outcome"])} disabled={!canEdit} className="grid gap-2" aria-label="Outcome">
            <ChoiceCard value="compliant" title="Compliant" icon={<CircleDot className="size-4 text-success-600" />} />
            <ChoiceCard value="minor_deviation" title="Minor deviation" description="Corrective action can be completed without stopping work." icon={<CircleDot className="size-4 text-amber-600" />} />
            <ChoiceCard value="major_deviation" title="Major deviation" description="Escalate to the Authorized Officer (may open a 2C file)." icon={<CircleDot className="size-4 text-danger-600" />} />
          </RadioGroup>
        </div>
      </section>

      {/* Sticky actions — thumb-reachable on mobile */}
      {canEdit && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:left-64">
          <div className="mx-auto flex max-w-3xl gap-2">
            <Button variant="secondary" size="lg" className="flex-1" onClick={saveDraft} loading={busy && !confirm}>
              <Save /> Save draft
            </Button>
            <Button size="lg" className="flex-1" onClick={() => setConfirm(true)} disabled={!inspection.gps || c.done < c.total}>
              <Send /> Submit
            </Button>
          </div>
          {(!inspection.gps || c.done < c.total) && <p className="mx-auto mt-1.5 max-w-3xl text-center text-xs text-muted">Capture GPS and complete all checks to submit.</p>}
        </div>
      )}
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Submit this inspection?" description="The record is locked after submission and sent to the file holder." confirmLabel="Yes, submit" loading={busy} onConfirm={submit} />
    </div>
  );
}
