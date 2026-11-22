"use client";

import { AlertTriangle, BadgeCheck, Check, Clock3, Eye, Info, MapPin, Plus, Trash2, UserPlus, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { DrawingSheet } from "@/components/domain/drawing-sheet";
import { FileDrop, FileRow } from "@/components/domain/file-drop";
import { SiteMap } from "@/components/domain/site-map";
import { SERVICE_ICON } from "@/components/domain/status";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, SectionDivider } from "@/components/ui/display";
import { Callout, SimulatedTag } from "@/components/ui/feedback";
import { ChoiceCard, Field, Input, RadioGroup, Select, Textarea } from "@/components/ui/form";
import { Dialog, DialogContent, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";
import { HOUSING_PROJECTS } from "@/lib/data/seed";
import { AREAS, DOCUMENT_CATEGORY_LABEL, OCCUPANCY, PROFESSIONAL_ROLE_LABEL, serviceByType, ZONES } from "@/lib/domain/catalog";
import { calculateIllustrativeFee, ILLUSTRATIVE_RULESET } from "@/lib/domain/fees";
import type { Application, BuildingInfo, DocumentCategory, DocumentRecord, DrawingSheetKind, OccupancyKey, ProfessionalRole, ServiceType } from "@/lib/domain/types";
import { STAGE_LABEL, flowFor } from "@/lib/domain/workflow";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { ecps } from "@/lib/services";
import { useDemoStore } from "@/lib/store/demo-store";
import { cn, formatBDT, formatRelative } from "@/lib/utils";
import { farFor, requiredProfessionals, requiredSheets, sheetLabel, type Issue } from "./validation";

export interface StepProps {
  app: Application;
  update: (patch: Partial<Application>) => void;
  errors: Record<string, string>;
}

type DocInput = Omit<DocumentRecord, "id" | "uploadedAt" | "uploadedBy" | "sample" | "version" | "status">;

function useDocs(app: Application) {
  const add = useDemoStore((s) => s.addDocument);
  const remove = useDemoStore((s) => s.removeDocument);
  return {
    live: app.documents.filter((d) => d.status !== "superseded"),
    add: (d: DocInput) => add(app.id, d),
    remove: (id: string) => remove(app.id, id),
  };
}

function StepIntro({ title, lead, tor }: { title: string; lead: string; tor?: string }) {
  return (
    <div className="mb-6 border-b border-line pb-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-xl font-semibold text-ink-strong">{title}</h2>
        {tor && <span className="ref rounded-xs bg-surface-3 px-1.5 py-0.5 text-[0.625rem] text-slate-ink">TOR {tor}</span>}
      </div>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{lead}</p>
    </div>
  );
}

/* ———————————————————————————— 1. Type ———————————————————————————— */

export function TypeStep({ app, update }: StepProps) {
  const { t } = useI18n();
  const options: ServiceType[] = ["PP", "PP_PRIVATE_HOUSING", "CP"];
  return (
    <div>
      <StepIntro title={t("wiz.step.type")} lead="Confirm the permission you are applying for. You can change it while the application is a draft." />
      <RadioGroup
        value={app.type}
        onValueChange={(v) => update({ type: v as ServiceType, title: app.title.startsWith("New ") ? `New ${t(serviceByType(v as ServiceType).nameKey as MessageKey)} application` : app.title })}
        className="grid gap-3"
        aria-label={t("wiz.step.type")}
      >
        {options.map((o) => {
          const s = serviceByType(o);
          const Icon = SERVICE_ICON[o];
          return (
            <ChoiceCard
              key={o}
              value={o}
              icon={<Icon className="size-4 text-slate-ink" aria-hidden />}
              title={t(s.nameKey as MessageKey)}
              description={t(s.descKey as MessageKey)}
              meta={<Badge tone={s.scope === "new" ? "warning" : "neutral"}>{t(`svc.scope.${s.scope}`)}</Badge>}
            />
          );
        })}
      </RadioGroup>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Project title" hint="A short name you will recognise, e.g. “Six-storey residence, Dhanmondi”.">
          {(a) => <Input {...a} value={app.title} onChange={(e) => update({ title: e.target.value })} />}
        </Field>
        <div className="rounded-lg border border-line bg-surface-2 p-4 text-sm">
          <p className="text-xs text-muted">Review route (illustrative)</p>
          <p className="mt-1.5 leading-relaxed text-ink">{flowFor(app.type).map((s) => STAGE_LABEL[s]).join(" → ")}</p>
        </div>
      </div>
    </div>
  );
}

/* ———————————————————————————— 2. Property ———————————————————————————— */

export function PropertyStep({ app, update, errors }: StepProps) {
  const p = app.property;
  const set = (patch: Partial<typeof p>) => update({ property: { ...p, ...patch } });
  const housing = app.type === "PP_PRIVATE_HOUSING";
  const block = p.zone && p.subZone ? `B-${String(((p.rsDag.length * 37 + p.subZone.length * 11) % 240) + 1).padStart(3, "0")}` : undefined;
  return (
    <div>
      <StepIntro
        title="Property & plot"
        tor={housing ? "1.7 · 2.1" : "1.4 · 1.7"}
        lead="Identify the plot using standard land identifiers. Zone and sub-zone determine which desk receives the file."
      />
      {housing && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-50/50 p-4">
          <Field label="Approved private housing project" required error={errors.housingProjectId} hint="List would come from the housing data integration (NHA / PWD / approved private projects).">
            {(a) => (
              <Select
                {...a}
                value={p.housingProjectId ?? ""}
                onChange={(e) => {
                  const hp = HOUSING_PROJECTS.find((h) => h.id === e.target.value);
                  set({ housingProjectId: e.target.value || undefined, mouza: hp?.mouza ?? p.mouza, area: hp ? "Bashundhara" : p.area });
                }}
              >
                <option value="">Select project…</option>
                {HOUSING_PROJECTS.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <p className="mt-3 text-xs text-amber-700">Processed by Town Planning (HQ) under the new private-housing PP process.</p>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="RAJUK zone" required error={errors.zone}>
          {(a) => (
            <Select {...a} value={p.zone} onChange={(e) => set({ zone: e.target.value })}>
              <option value="">Select…</option>
              {ZONES.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Sub-zone" required error={errors.subZone}>
          {(a) => (
            <Select {...a} value={p.subZone} onChange={(e) => set({ subZone: e.target.value })} disabled={!p.zone}>
              <option value="">Select…</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={`${p.zone.replace("Zone ", "")}/${n}`}>
                  {p.zone.replace("Zone ", "")}/{n}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Area / locality" required error={errors.area}>
          {(a) => (
            <Input {...a} value={p.area} onChange={(e) => set({ area: e.target.value })} list="areas" />
          )}
        </Field>
      </div>
      <datalist id="areas">
        {AREAS.map((x) => (
          <option key={x} value={x} />
        ))}
      </datalist>
      {block && (
        <p className="mt-3 flex items-center gap-2 text-xs text-teal-800">
          <Info className="size-3.5" aria-hidden /> Routing preview: sub-zone {p.subZone} · block <span className="ref">{block}</span> → Front Desk, {p.zone} (TOR 1.4 block-based routing, illustrative)
        </p>
      )}
      <SectionDivider label="Land identifiers" />
      <div className="mt-3 grid gap-5 sm:grid-cols-4">
        <Field label="Mouza" required error={errors.mouza} className="sm:col-span-2">
          {(a) => <Input {...a} value={p.mouza} onChange={(e) => set({ mouza: e.target.value })} />}
        </Field>
        <Field label="RS dag no." required error={errors.rsDag}>
          {(a) => <Input {...a} value={p.rsDag} onChange={(e) => set({ rsDag: e.target.value })} className="ref" inputMode="numeric" />}
        </Field>
        <Field label="CS dag no." optional>
          {(a) => <Input {...a} value={p.csDag ?? ""} onChange={(e) => set({ csDag: e.target.value })} className="ref" inputMode="numeric" />}
        </Field>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-4">
        <Field label="Plot no." optional>
          {(a) => <Input {...a} value={p.plotNo ?? ""} onChange={(e) => set({ plotNo: e.target.value })} />}
        </Field>
        <Field label="Plot area (m²)" required error={errors.plotAreaSqm}>
          {(a) => <Input {...a} type="number" min={0} value={p.plotAreaSqm || ""} onChange={(e) => set({ plotAreaSqm: Number(e.target.value) })} className="tabular" />}
        </Field>
        <Field label="Access road width (m)" required error={errors.roadWidthM}>
          {(a) => <Input {...a} type="number" min={0} step={0.5} value={p.roadWidthM || ""} onChange={(e) => set({ roadWidthM: Number(e.target.value) })} className="tabular" />}
        </Field>
        <Field label="Ownership">
          {(a) => (
            <Select {...a} value={p.ownershipType} onChange={(e) => set({ ownershipType: e.target.value as typeof p.ownershipType })}>
              <option value="freehold">Freehold</option>
              <option value="rajuk_lease">RAJUK lease</option>
              <option value="private_housing">Private housing project</option>
            </Select>
          )}
        </Field>
      </div>
      {p.ownershipType === "rajuk_lease" && (
        <Callout tone="info" className="mt-4">
          Lease plots are routed to the Estate section for a no-objection certificate during review (TOR 2.13).
        </Callout>
      )}
      <Field label="Plot address" required error={errors.address} className="mt-5">
        {(a) => <Textarea {...a} rows={2} value={p.address} onChange={(e) => set({ address: e.target.value })} />}
      </Field>
    </div>
  );
}

/* ———————————————————————————— 3. Owners ———————————————————————————— */

export function OwnersStep({ app, update, errors }: StepProps) {
  const docs = useDocs(app);
  const [tab, setTab] = useState("0");
  const ownerDoc = (i: number, c: DocumentCategory) => docs.live.find((d) => d.category === c && d.ownerIndex === i);
  const addOwner = () => {
    update({ owners: [...app.owners, { name: "", relation: "Co-owner" }] });
    setTab(String(app.owners.length));
  };
  const removeOwner = (i: number) => {
    update({ owners: app.owners.filter((_, k) => k !== i), documents: app.documents.filter((d) => d.ownerIndex !== i).map((d) => (d.ownerIndex !== undefined && d.ownerIndex > i ? { ...d, ownerIndex: d.ownerIndex - 1 } : d)) });
    setTab("0");
  };
  const ownership = docs.live.find((d) => d.category === "ownership");
  return (
    <div>
      <StepIntro title="Owners" tor="2.9" lead="List every owner of the plot. Each owner's NID, tax-return slip and photograph are kept in their own tab." />
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-end justify-between gap-3">
          <TabsList className="flex-1">
            {app.owners.map((o, i) => {
              const complete = ownerDoc(i, "nid") && ownerDoc(i, "tax_return") && ownerDoc(i, "photo") && o.name.trim();
              return (
                <TabsTrigger key={i} value={String(i)}>
                  <span className={cn("grid size-4 place-items-center rounded-full", complete ? "bg-teal-600 text-white" : "border border-line-strong")}>{complete && <Check className="!size-2.5" strokeWidth={3} />}</span>
                  {o.name.split(" ")[0] || `Owner ${i + 1}`}
                </TabsTrigger>
              );
            })}
          </TabsList>
          <Button type="button" variant="ghost" size="sm" onClick={addOwner} className="mb-1.5">
            <Plus /> Add owner
          </Button>
        </div>
        {app.owners.map((o, i) => (
          <TabsContent key={i} value={String(i)} className="pt-5">
            <div className="grid gap-5 sm:grid-cols-[1fr_14rem_auto] sm:items-end">
              <Field label="Full name (as on NID)" required error={errors[`owner-${i}-name`]}>
                {(a) => <Input {...a} value={o.name} onChange={(e) => update({ owners: app.owners.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)) })} />}
              </Field>
              <Field label="Relation">
                {(a) => (
                  <Select {...a} value={o.relation} onChange={(e) => update({ owners: app.owners.map((x, k) => (k === i ? { ...x, relation: e.target.value } : x)) })}>
                    <option>Principal owner</option>
                    <option>Co-owner</option>
                    <option>Legal heir</option>
                    <option>Authorised representative</option>
                  </Select>
                )}
              </Field>
              {app.owners.length > 1 && (
                <Button type="button" variant="danger-outline" size="md" onClick={() => removeOwner(i)} aria-label={`Remove owner ${o.name || i + 1}`}>
                  <Trash2 />
                </Button>
              )}
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {(["nid", "tax_return", "photo"] as const).map((c) => {
                const d = ownerDoc(i, c);
                const err = errors[`owner-${i}-${c === "tax_return" ? "tax" : c}`];
                return (
                  <div key={c}>
                    <p className="mb-1.5 text-[0.8125rem] font-medium text-ink-strong">
                      {DOCUMENT_CATEGORY_LABEL[c]} <span className="text-danger-700">*</span>
                    </p>
                    {d ? (
                      <FileRow name={d.name} sizeKb={d.sizeKb} kind={c === "photo" ? "photo" : "document"} meta="sample" onRemove={() => docs.remove(d.id)} />
                    ) : (
                      <FileDrop compact label="Upload" hint="PDF / JPG" invalid={!!err} sampleName={`${c}_${(o.name.split(" ")[0] || "owner").toLowerCase()}_sample.${c === "photo" ? "jpg" : "pdf"}`} onUploaded={(f) => docs.add({ name: f.name, sizeKb: f.sizeKb, category: c, ownerIndex: i, previewKind: c === "photo" ? "photo" : "document", pages: 1 })} />
                    )}
                    {err && <p className="mt-1 text-xs font-medium text-danger-700">{err}</p>}
                  </div>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      <SectionDivider label="Plot ownership" />
      <div className="mt-3 max-w-xl">
        {ownership ? (
          <FileRow name={ownership.name} sizeKb={ownership.sizeKb} meta="Ownership record · sample" onRemove={() => docs.remove(ownership.id)} />
        ) : (
          <FileDrop label="Ownership record (mutation khatian, deed)" invalid={!!errors.ownership} sampleName="mutation_khatian_sample.pdf" onUploaded={(f) => docs.add({ name: f.name, sizeKb: f.sizeKb, category: "ownership", previewKind: "document", pages: 3 })} />
        )}
        {errors.ownership && <p className="mt-1 text-xs font-medium text-danger-700">{errors.ownership}</p>}
      </div>
      <Callout tone="demo" className="mt-6">
        Use invented names and sample files only. The prototype never uploads or stores real identity documents.
      </Callout>
    </div>
  );
}

/* ———————————————————————————— 4. Professionals ———————————————————————————— */

export function ProfessionalsStep({ app, errors }: StepProps) {
  const users = useDemoStore((s) => s.users);
  const [picker, setPicker] = useState<ProfessionalRole | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const required = requiredProfessionals(app);
  const roles: ProfessionalRole[] = app.type === "CP" ? ["architect", "structural", "electrical", "plumbing", "supervisor"] : ["architect", "structural"];
  const directory = users.filter((u) => u.role === "professional" && u.discipline === picker);

  const invite = async (userId: string) => {
    if (!picker) return;
    setBusy(userId);
    await ecps.applications.inviteProfessional(app.id, userId, picker);
    setBusy(null);
    setPicker(null);
  };

  return (
    <div>
      <StepIntro title="Professional participation" tor="3.2(a) · 1.4" lead="Invite the registered professionals who will prepare and endorse your drawings. They accept from their own workspace." />
      <ul className="divide-y divide-line rounded-xl border border-line">
        {roles.map((r) => {
          const current = app.professionals.filter((p) => p.role === r).at(-1);
          const u = current ? users.find((x) => x.id === current.userId) : undefined;
          const req = required.includes(r);
          return (
            <li key={r} className="flex flex-wrap items-center gap-4 px-4 py-4">
              <div className="w-48 shrink-0">
                <p className="text-sm font-medium text-ink-strong">{PROFESSIONAL_ROLE_LABEL[r]}</p>
                <p className={cn("text-xs", req ? "text-danger-700" : "text-subtle")}>{req ? "Required" : "Optional at this stage"}</p>
              </div>
              <div className="min-w-0 flex-1">
                {u && current && current.status !== "declined" ? (
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-strong">{u.name}</p>
                      <p className="text-xs text-muted">
                        {u.membership?.body} <span className="ref">{u.membership?.number}</span>
                      </p>
                    </div>
                    {current.status === "accepted" ? (
                      <Badge tone="success" icon={Check}>
                        Accepted
                      </Badge>
                    ) : (
                      <Badge tone="warning" icon={Clock3}>
                        Invited {formatRelative(current.invitedAt)}
                      </Badge>
                    )}
                  </div>
                ) : current?.status === "declined" ? (
                  <p className="flex items-center gap-1.5 text-sm text-danger-700">
                    <X className="size-4" aria-hidden /> Declined{current.note ? ` — “${current.note}”` : ""}. Invite another professional.
                  </p>
                ) : (
                  <p className={cn("text-sm", errors[`pro-${r}`] ? "font-medium text-danger-700" : "text-muted")}>{errors[`pro-${r}`] ?? "Not invited yet"}</p>
                )}
              </div>
              <Button type="button" variant={u && current?.status !== "declined" ? "ghost" : "secondary"} size="sm" onClick={() => setPicker(r)}>
                <UserPlus /> {u && current?.status !== "declined" ? "Change" : "Invite"}
              </Button>
            </li>
          );
        })}
      </ul>
      <Callout tone="info" className="mt-5">
        Replacing a professional after submission follows a recorded process approved by RAJUK (TOR 1.4, 1.5). Pending invitations do not block saving your draft.
      </Callout>

      <Dialog open={picker !== null} onOpenChange={(o) => !o && setPicker(null)}>
        <DialogContent title={`Invite ${picker ? PROFESSIONAL_ROLE_LABEL[picker].toLowerCase() : ""}`} description="Directory of registered professionals (fictional). Verification status comes from the professional body integration." size="md">
          {directory.length === 0 ? (
            <p className="text-sm text-muted">No registered professionals in this discipline in the demo directory.</p>
          ) : (
            <ul className="space-y-2">
              {directory.map((u) => (
                <li key={u.id} className="flex items-center gap-3 rounded-lg border border-line p-3">
                  <Avatar name={u.name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-strong">{u.name}</p>
                    <p className="text-xs text-muted">
                      {u.membership?.body} <span className="ref">{u.membership?.number}</span>
                    </p>
                  </div>
                  {u.membership?.verified ? (
                    <Badge tone="success" icon={BadgeCheck}>
                      Verified
                    </Badge>
                  ) : (
                    <Badge tone="warning">Unverified</Badge>
                  )}
                  <Button size="sm" disabled={!u.membership?.verified} loading={busy === u.id} onClick={() => invite(u.id)}>
                    Invite
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ———————————————————————————— 5. Location ———————————————————————————— */

const AREA_CENTRES: Record<string, [number, number]> = {
  Dhanmondi: [23.7461, 90.3742],
  Mirpur: [23.8069, 90.3687],
  Uttara: [23.8747, 90.3984],
  Gulshan: [23.7925, 90.4153],
  Mohammadpur: [23.7621, 90.3586],
  Badda: [23.7805, 90.4265],
  Banani: [23.7941, 90.4043],
  Bashundhara: [23.8151, 90.4312],
  Khilgaon: [23.7522, 90.4271],
  Purbachal: [23.8402, 90.5035],
  Tejgaon: [23.7601, 90.3925],
};

export function LocationStep({ app, update, errors }: StepProps) {
  const docs = useDocs(app);
  const centre = AREA_CENTRES[app.property.area] ?? [23.7806, 90.4074];
  const loc = app.location ?? { lat: centre[0], lng: centre[1], dapLandUse: "Residential zone (urban)", confirmedOnMap: false };
  const setLoc = (patch: Partial<typeof loc>) => update({ location: { ...loc, ...patch } });
  const plotPhotos = docs.live.filter((d) => d.category === "plot_photo");
  const roadPhotos = docs.live.filter((d) => d.category === "road_photo");
  return (
    <div>
      <StepIntro title="Location & map" tor="2.3 · 2.9" lead="Geographic coordinates, plot photographs and an adjacent-road photograph are mandatory so officers and inspectors can locate the plot and check it against the Detailed Area Plan." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <SiteMap lat={loc.lat} lng={loc.lng} onChange={(p) => setLoc({ ...p, confirmedOnMap: false })} height={340} />
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
            <Field label="Latitude">
              {(a) => <Input {...a} className="ref" type="number" step="0.000001" value={loc.lat} onChange={(e) => setLoc({ lat: Number(e.target.value), confirmedOnMap: false })} />}
            </Field>
            <Field label="Longitude">
              {(a) => <Input {...a} className="ref" type="number" step="0.000001" value={loc.lng} onChange={(e) => setLoc({ lng: Number(e.target.value), confirmedOnMap: false })} />}
            </Field>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => setLoc({ lat: +(centre[0] + 0.0004).toFixed(6), lng: +(centre[1] + 0.0003).toFixed(6), confirmedOnMap: false })}
          >
            <MapPin /> Use my current location <SimulatedTag className="ml-1" />
          </Button>
          <div className="rounded-lg border border-line bg-surface-2 p-3 text-sm">
            <p className="text-xs text-muted">DAP land use at pin (illustrative)</p>
            <p className="mt-0.5 font-medium text-ink-strong">{loc.dapLandUse}</p>
          </div>
          <Button type="button" className="w-full" variant={loc.confirmedOnMap ? "subtle" : "primary"} onClick={() => setLoc({ confirmedOnMap: true })}>
            {loc.confirmedOnMap ? (
              <>
                <Check /> Position confirmed
              </>
            ) : (
              "Confirm plot position"
            )}
          </Button>
          {errors.location && <p className="text-xs font-medium text-danger-700">{errors.location}</p>}
        </div>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {(
          [
            ["plot_photo", "Plot photographs", plotPhotos, "plot_corner_sample.jpg"],
            ["road_photo", "Adjacent-road photographs", roadPhotos, "adjacent_road_sample.jpg"],
          ] as const
        ).map(([cat, label, list, sample]) => (
          <div key={cat}>
            <p className="mb-2 text-[0.8125rem] font-medium text-ink-strong">
              {label} <span className="text-danger-700">*</span>
            </p>
            <div className="space-y-2">
              {list.map((d) => (
                <FileRow key={d.id} name={d.name} sizeKb={d.sizeKb} kind="photo" meta={`v${d.version}`} onRemove={() => docs.remove(d.id)} />
              ))}
              <FileDrop compact label={list.length ? "Add another" : "Upload photograph"} accept=".jpg,.jpeg,.png" hint="JPG or PNG, daylight, full view" invalid={!!errors[cat]} sampleName={sample} onUploaded={(f) => docs.add({ name: f.name, sizeKb: f.sizeKb, category: cat, previewKind: "photo" })} />
              {errors[cat] && <p className="text-xs font-medium text-danger-700">{errors[cat]}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ———————————————————————————— 6. Building ———————————————————————————— */

export function BuildingStep({ app, update, errors }: StepProps) {
  const far = useDemoStore((s) => s.far);
  const b: BuildingInfo = app.building ?? { occupancy: "A", storeys: 0, basements: 0, totalFloorAreaSqm: 0, groundCoverageSqm: 0, units: 0, heightM: 0, setbacks: { front: 0, rear: 0, left: 0, right: 0 } };
  const set = (patch: Partial<BuildingInfo>) => update({ building: { ...b, ...patch } });
  const plot = app.property.plotAreaSqm;
  const limits = farFor(far, plot, app.property.roadWidthM);
  const proposedFar = plot > 0 ? b.totalFloorAreaSqm / plot : 0;
  const coverage = plot > 0 ? (b.groundCoverageSqm / plot) * 100 : 0;
  const num = (label: string, key: keyof BuildingInfo, unit?: string, step = 1) => (
    <Field label={`${label}${unit ? ` (${unit})` : ""}`} required={["storeys", "totalFloorAreaSqm", "groundCoverageSqm"].includes(key)} error={errors[key]}>
      {(a) => <Input {...a} type="number" min={0} step={step} className="tabular" value={(b[key] as number) || ""} onChange={(e) => set({ [key]: Number(e.target.value) } as Partial<BuildingInfo>)} />}
    </Field>
  );
  return (
    <div>
      <StepIntro title="Project & building details" tor="1.4 · 1.15" lead="These values drive the FAR check and the fee calculation. Checks below use illustrative parameters from Admin → DAP & FAR." />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Occupancy group (BNBC 2020)" required>
          {(a) => (
            <Select {...a} value={b.occupancy} onChange={(e) => set({ occupancy: e.target.value as OccupancyKey })}>
              {(Object.keys(OCCUPANCY) as OccupancyKey[]).map((k) => (
                <option key={k} value={k}>
                  {k} — {OCCUPANCY[k]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-5">
          {num("Storeys above ground", "storeys")}
          {num("Basements", "basements")}
        </div>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-4">
        {num("Total floor area", "totalFloorAreaSqm", "m²")}
        {num("Ground coverage", "groundCoverageSqm", "m²")}
        {num("Dwelling / units", "units")}
        {num("Height", "heightM", "m", 0.1)}
      </div>
      <SectionDivider label="Setbacks (m)" />
      <div className="mt-3 grid grid-cols-2 gap-5 sm:grid-cols-4">
        {(["front", "rear", "left", "right"] as const).map((k) => (
          <Field key={k} label={k[0]!.toUpperCase() + k.slice(1)}>
            {(a) => <Input {...a} type="number" min={0} step={0.1} className="tabular" value={b.setbacks[k] || ""} onChange={(e) => set({ setbacks: { ...b.setbacks, [k]: Number(e.target.value) } })} />}
          </Field>
        ))}
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <CheckTile label="Proposed FAR" value={proposedFar ? proposedFar.toFixed(2) : "—"} limit={limits ? `Limit ${limits.far.toFixed(1)}` : "Enter plot area"} ok={!limits || !proposedFar || proposedFar <= limits.far} />
        <CheckTile label="Ground coverage" value={coverage ? `${coverage.toFixed(1)}%` : "—"} limit={limits ? `Max ${limits.maxGroundCoveragePct}%` : "—"} ok={!limits || !coverage || coverage <= limits.maxGroundCoveragePct} />
        <CheckTile label="Road width" value={app.property.roadWidthM ? `${app.property.roadWidthM} m` : "—"} limit={limits ? `Min ${limits.roadWidthMinM} m` : "—"} ok={!limits || limits.roadOk} />
      </div>
      <p className="mt-2 text-xs text-muted">
        Illustrative checks only. Approved FAR values per TOR 1.15 must be configured by RAJUK. <SimulatedTag>Illustrative</SimulatedTag>
      </p>
    </div>
  );
}

function CheckTile({ label, value, limit, ok }: { label: string; value: string; limit: string; ok: boolean }) {
  return (
    <div className={cn("rounded-lg border p-4", ok ? "border-line bg-surface-2" : "border-amber-500/50 bg-amber-50")}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">{label}</p>
        {ok ? <Check className="size-4 text-success-600" aria-label="Within limit" /> : <AlertTriangle className="size-4 text-amber-600" aria-label="Exceeds limit" />}
      </div>
      <p className="tabular mt-1 font-display text-xl font-semibold text-ink-strong">{value}</p>
      <p className={cn("text-xs", ok ? "text-muted" : "font-medium text-amber-700")}>{limit}</p>
    </div>
  );
}

/* ———————————————————————————— 7. Documents ———————————————————————————— */

export function DocumentsStep({ app, errors }: StepProps) {
  const docs = useDocs(app);
  const [preview, setPreview] = useState<DrawingSheetKind | null>(null);
  const sheets: DrawingSheetKind[] = app.type === "CP" ? ["site", "ground", "typical", "elevation", "section", "far"] : ["site", "ground", "elevation"];
  const required = requiredSheets(app);
  const extras = docs.live.filter((d) => ["certificate", "professional"].includes(d.category));
  return (
    <div>
      <StepIntro title="Drawings & supporting documents" tor="1.13 · 2.9" lead="Upload each drawing sheet separately so reviewers and signatories always work on the right page. Replacing a sheet keeps the previous version on record." />
      <ul className="divide-y divide-line rounded-xl border border-line">
        {sheets.map((s) => {
          const d = docs.live.find((x) => x.category === "drawing" && x.drawingSheet === s);
          const prior = app.documents.filter((x) => x.category === "drawing" && x.drawingSheet === s && x.status === "superseded").length;
          return (
            <li key={s} className="grid gap-3 px-4 py-3.5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center">
              <div>
                <p className="text-sm font-medium capitalize text-ink-strong">{sheetLabel(s)}</p>
                <p className={cn("text-xs", required.includes(s) ? "text-danger-700" : "text-subtle")}>{required.includes(s) ? "Required" : "Optional"}{prior ? ` · ${prior} earlier version${prior > 1 ? "s" : ""}` : ""}</p>
              </div>
              {d ? (
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <FileRow name={d.name} sizeKb={d.sizeKb} kind="drawing" meta={`v${d.version} · sample`} onPreview={() => setPreview(s)} onRemove={() => docs.remove(d.id)} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setPreview(s)} aria-label={`Preview ${sheetLabel(s)}`}>
                    <Eye />
                  </Button>
                </div>
              ) : (
                <FileDrop compact label="Upload sheet" accept=".pdf" hint="Single-sheet PDF" invalid={!!errors[`sheet-${s}`]} sampleName={`${s}_sheet_sample.pdf`} onUploaded={(f) => docs.add({ name: f.name, sizeKb: f.sizeKb, category: "drawing", drawingSheet: s, previewKind: "drawing", pages: 1 })} />
              )}
            </li>
          );
        })}
      </ul>
      <SectionDivider label="Certificates & professional attachments" />
      <div className="mt-3 space-y-2">
        {extras.map((d) => (
          <FileRow key={d.id} name={d.name} sizeKb={d.sizeKb} meta={DOCUMENT_CATEGORY_LABEL[d.category]} onRemove={() => docs.remove(d.id)} />
        ))}
        <div className="grid gap-3 md:grid-cols-2">
          <FileDrop compact label={app.type === "CP" ? "Soil test report *" : "Supporting certificate"} invalid={!!errors.certificate} sampleName="soil_test_report_sample.pdf" onUploaded={(f) => docs.add({ name: f.name, sizeKb: f.sizeKb, category: "certificate", previewKind: "document", pages: 12 })} />
          <FileDrop compact label="Professional attachment" sampleName="structural_design_basis_sample.pdf" onUploaded={(f) => docs.add({ name: f.name, sizeKb: f.sizeKb, category: "professional", previewKind: "document", pages: 20 })} />
        </div>
        {errors.certificate && <p className="text-xs font-medium text-danger-700">{errors.certificate}</p>}
      </div>
      <Dialog open={preview !== null} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent size="xl" eyebrow="Document preview · sample" title={preview ? sheetLabel(preview)[0]!.toUpperCase() + sheetLabel(preview).slice(1) : ""} description="Fictional sheet rendered for the prototype. The file number is stamped automatically after submission (TOR 1.4).">
          {preview && (
            <div className="overflow-hidden rounded-lg border border-line">
              <DrawingSheet kind={preview} title={sheetLabel(preview)} page={sheets.indexOf(preview) + 1} total={sheets.length} appRef={app.ref} project={app.title} version={docs.live.find((d) => d.drawingSheet === preview)?.version ?? 1} storeys={app.building?.storeys || 6} signable={preview !== "far"} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ———————————————————————————— 8. Review ———————————————————————————— */

export function ReviewStep({ app, issues, onEdit, declared, setDeclared }: StepProps & { issues: Array<Issue & { step: string }>; onEdit: (step: number) => void; declared: boolean; setDeclared: (v: boolean) => void }) {
  const { t, locale } = useI18n();
  const users = useDemoStore((s) => s.users);
  const fee = useMemo(() => (app.building ? calculateIllustrativeFee({ type: app.type, occupancy: app.building.occupancy, totalFloorAreaSqm: app.building.totalFloorAreaSqm }) : undefined), [app.type, app.building]);
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const stepIndex: Record<string, number> = { type: 0, property: 1, owners: 2, professionals: 3, location: 4, building: 5, documents: 6 };
  const section = (title: string, step: number, children: ReactNode) => (
    <div className="rounded-lg border border-line">
      <div className="flex items-center justify-between border-b border-line bg-surface-2 px-4 py-2.5">
        <p className="text-sm font-semibold text-ink-strong">{title}</p>
        <button type="button" onClick={() => onEdit(step)} className="text-xs font-medium text-teal-700 hover:underline">
          Edit
        </button>
      </div>
      <div className="px-4 py-3 text-sm">{children}</div>
    </div>
  );
  const b = app.building;
  return (
    <div>
      <StepIntro title={t("wiz.step.review")} lead="Check every section before submitting. Once submitted, the application is locked and stamped with a file number." />
      {errors.length > 0 && (
        <Callout tone="danger" title={`${errors.length} item${errors.length > 1 ? "s" : ""} must be completed before you can submit`} className="mb-4">
          <ul className="mt-1 space-y-1">
            {errors.map((i) => (
              <li key={i.step + i.field}>
                <button type="button" className="text-left underline" onClick={() => onEdit(stepIndex[i.step] ?? 0)}>
                  {i.message}
                </button>
              </li>
            ))}
          </ul>
        </Callout>
      )}
      {warnings.length > 0 && (
        <Callout tone="warning" title="Please note" className="mb-4">
          <ul className="space-y-1">
            {warnings.map((i) => (
              <li key={i.step + i.field}>{i.message}</li>
            ))}
          </ul>
        </Callout>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {section("Property & plot", 1, (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            <dt className="text-muted">Zone / sub-zone</dt>
            <dd className="text-ink-strong">{app.property.zone} · {app.property.subZone || "—"}</dd>
            <dt className="text-muted">Mouza / RS dag</dt>
            <dd className="text-ink-strong">{app.property.mouza || "—"} · <span className="ref">{app.property.rsDag || "—"}</span></dd>
            <dt className="text-muted">Plot area</dt>
            <dd className="tabular text-ink-strong">{app.property.plotAreaSqm || "—"} m²</dd>
            <dt className="text-muted">Road width</dt>
            <dd className="tabular text-ink-strong">{app.property.roadWidthM || "—"} m</dd>
          </dl>
        ))}
        {section("Owners & professionals", 2, (
          <ul className="space-y-1.5">
            {app.owners.map((o, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="text-ink-strong">{o.name || `Owner ${i + 1}`}</span>
                <span className="text-muted">{o.relation}</span>
              </li>
            ))}
            {app.professionals.filter((p) => !["declined", "replaced"].includes(p.status)).map((p) => (
              <li key={p.userId + p.role} className="flex justify-between gap-3">
                <span className="text-ink-strong">{users.find((u) => u.id === p.userId)?.name}</span>
                <span className="text-muted">
                  {PROFESSIONAL_ROLE_LABEL[p.role]} · {p.status}
                </span>
              </li>
            ))}
          </ul>
        ))}
        {section("Location", 4, (
          <p className="text-ink-strong">
            {app.location ? (
              <>
                <span className="ref">{app.location.lat.toFixed(5)}, {app.location.lng.toFixed(5)}</span> · {app.location.dapLandUse} {app.location.confirmedOnMap ? "· confirmed" : "· not confirmed"}
              </>
            ) : (
              "Not set"
            )}
          </p>
        ))}
        {section("Building", 5, (
          b ? (
            <p className="text-ink-strong">
              Group {b.occupancy} ({OCCUPANCY[b.occupancy]}) · {b.storeys} storeys{b.basements ? ` + ${b.basements} basement` : ""} · {b.totalFloorAreaSqm.toLocaleString("en-IN")} m² · {b.units} units
            </p>
          ) : (
            <p className="text-muted">Not entered</p>
          )
        ))}
      </div>
      <div className="mt-4">
        {section("Documents", 6, (
          <p className="text-ink-strong">
            {app.documents.filter((d) => d.status !== "superseded").length} files · {app.documents.filter((d) => d.category === "drawing" && d.status !== "superseded").length} drawing sheets
          </p>
        ))}
      </div>

      {/* Fee preview */}
      <section aria-labelledby="fee-title" className="mt-8 overflow-hidden rounded-xl border border-line">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-navy-900 px-5 py-4 text-on-dark">
          <div>
            <h3 id="fee-title" className="font-display font-semibold text-white">
              Fee preview
            </h3>
            <p className="ref mt-0.5 text-[0.6875rem] text-on-dark-muted">{ILLUSTRATIVE_RULESET.id} · {ILLUSTRATIVE_RULESET.label}</p>
          </div>
          <span className="rounded-xs border border-dashed border-amber-500/60 px-1.5 py-0.5 font-mono text-[0.625rem] uppercase tracking-wider text-amber-200">Illustrative</span>
        </div>
        {fee ? (
          <div className="divide-y divide-line">
            <div className="grid grid-cols-3 gap-4 bg-surface-2 px-5 py-3 text-xs">
              <div>
                <p className="text-muted">Occupancy</p>
                <p className="font-medium text-ink-strong">Group {b?.occupancy}</p>
              </div>
              <div>
                <p className="text-muted">Total project area</p>
                <p className="tabular font-medium text-ink-strong">{b?.totalFloorAreaSqm.toLocaleString("en-IN")} m²</p>
              </div>
              <div>
                <p className="text-muted">Application type</p>
                <p className="font-medium text-ink-strong">{app.type}</p>
              </div>
            </div>
            {fee.lines.map((l) => (
              <div key={l.key} className="flex items-start justify-between gap-4 px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink-strong">{l.label}</p>
                  <p className="ref mt-0.5 text-xs text-muted">{l.basis}</p>
                </div>
                <p className="tabular font-medium text-ink-strong">{formatBDT(l.amount, locale)}</p>
              </div>
            ))}
            <div className="flex items-center justify-between bg-surface-2 px-5 py-3.5">
              <p className="text-sm font-semibold text-ink-strong">Estimated total</p>
              <p className="tabular font-display text-xl font-semibold text-ink-strong">{formatBDT(fee.total, locale)}</p>
            </div>
            <p className="px-5 py-3 text-xs leading-relaxed text-muted">
              Demonstration only: rates are placeholders, not RAJUK fees. The application fee is collected on submission through the payment gateway (simulated); the permit fee is requested after approval.
            </p>
          </div>
        ) : (
          <p className="px-5 py-4 text-sm text-muted">Enter building details to see the fee breakdown.</p>
        )}
      </section>

      <label className="mt-6 flex items-start gap-3 rounded-lg border border-line p-4 text-sm text-ink">
        <input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} className="mt-0.5 size-4 accent-teal-600" />
        I declare that the information and documents provided are correct, and that the participating professionals have agreed to their roles. (Demonstration — no legal declaration is made.)
      </label>
    </div>
  );
}
