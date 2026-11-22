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
import { AREAS, OCCUPANCY, serviceByType, ZONES } from "@/lib/domain/catalog";
import { calculateIllustrativeFee, ILLUSTRATIVE_RULESET } from "@/lib/domain/fees";
import type { Application, BuildingInfo, DocumentCategory, DocumentRecord, DrawingSheetKind, FeeLine, OccupancyKey, ProfessionalRole, ServiceType } from "@/lib/domain/types";
import { flowFor } from "@/lib/domain/workflow";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { ecps } from "@/lib/services";
import { useDemoStore } from "@/lib/store/demo-store";
import { cn, formatBDT, formatRelative } from "@/lib/utils";
import { farFor, requiredProfessionals, requiredSheets, type Issue } from "./validation";

export interface StepProps {
  app: Application;
  update: (patch: Partial<Application>) => void;
  errors: Record<string, string>;
}

type DocInput = Omit<DocumentRecord, "id" | "uploadedAt" | "uploadedBy" | "sample" | "version" | "status">;

/** Small helpers so translated labels for domain enums are consistent everywhere. */
export function useDomainLabels() {
  const { t } = useI18n();
  return {
    stage: (s: string) => t(`stage.${s}` as MessageKey),
    occ: (o: OccupancyKey) => t(`occ.${o}` as MessageKey),
    pro: (r: ProfessionalRole) => t(`pro.${r}` as MessageKey),
    doc: (c: DocumentCategory) => t(`doc.${c}` as MessageKey),
    sheet: (s: DrawingSheetKind) => t(`sheet.${s}` as MessageKey),
    feeLine: (l: FeeLine) => t(l.key === "application" ? "fee.application" : l.label.startsWith("Planning") ? "fee.scrutiny" : "fee.area"),
  };
}

function useDocs(app: Application) {
  const add = useDemoStore((s) => s.addDocument);
  const remove = useDemoStore((s) => s.removeDocument);
  return {
    live: app.documents.filter((d) => d.status !== "superseded"),
    add: (d: DocInput) => add(app.id, d),
    remove: (id: string) => remove(app.id, id),
  };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
  const L = useDomainLabels();
  const options: ServiceType[] = ["PP", "PP_PRIVATE_HOUSING", "CP"];
  return (
    <div>
      <StepIntro title={t("wiz.step.type")} lead={t("st.type.lead")} />
      <RadioGroup
        value={app.type}
        onValueChange={(v) => update({ type: v as ServiceType, title: app.title.startsWith("New ") ? `New ${serviceByType(v as ServiceType).short} application` : app.title })}
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
        <Field label={t("st.type.title")} hint={t("st.type.titleHint")}>
          {(a) => <Input {...a} value={app.title} onChange={(e) => update({ title: e.target.value })} />}
        </Field>
        <div className="rounded-lg border border-line bg-surface-2 p-4 text-sm">
          <p className="text-xs text-muted">{t("st.type.route")}</p>
          <p className="mt-1.5 leading-relaxed text-ink">{flowFor(app.type).map((s) => L.stage(s)).join(" → ")}</p>
        </div>
      </div>
    </div>
  );
}

/* ———————————————————————————— 2. Property ———————————————————————————— */

export function PropertyStep({ app, update, errors }: StepProps) {
  const { t } = useI18n();
  const p = app.property;
  const set = (patch: Partial<typeof p>) => update({ property: { ...p, ...patch } });
  const housing = app.type === "PP_PRIVATE_HOUSING";
  const block = p.zone && p.subZone ? `B-${String(((p.rsDag.length * 37 + p.subZone.length * 11) % 240) + 1).padStart(3, "0")}` : undefined;
  return (
    <div>
      <StepIntro title={t("st.prop.title")} tor={housing ? "1.7 · 2.1" : "1.4 · 1.7"} lead={t("st.prop.lead")} />
      {housing && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-50/50 p-4">
          <Field label={t("st.prop.housing")} required error={errors.housingProjectId} hint={t("st.prop.housingHint")}>
            {(a) => (
              <Select
                {...a}
                value={p.housingProjectId ?? ""}
                onChange={(e) => {
                  const hp = HOUSING_PROJECTS.find((h) => h.id === e.target.value);
                  set({ housingProjectId: e.target.value || undefined, mouza: hp?.mouza ?? p.mouza, area: hp ? "Bashundhara" : p.area });
                }}
              >
                <option value="">{t("st.prop.housingSelect")}</option>
                {HOUSING_PROJECTS.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <p className="mt-3 text-xs text-amber-700">{t("st.prop.housingNote")}</p>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label={t("st.prop.zone")} required error={errors.zone}>
          {(a) => (
            <Select {...a} value={p.zone} onChange={(e) => set({ zone: e.target.value })}>
              <option value="">{t("st.prop.select")}</option>
              {ZONES.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("st.prop.subzone")} required error={errors.subZone}>
          {(a) => (
            <Select {...a} value={p.subZone} onChange={(e) => set({ subZone: e.target.value })} disabled={!p.zone}>
              <option value="">{t("st.prop.select")}</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={`${p.zone.replace("Zone ", "")}/${n}`}>
                  {p.zone.replace("Zone ", "")}/{n}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("st.prop.area")} required error={errors.area}>
          {(a) => <Input {...a} value={p.area} onChange={(e) => set({ area: e.target.value })} list="areas" />}
        </Field>
      </div>
      <datalist id="areas">
        {AREAS.map((x) => (
          <option key={x} value={x} />
        ))}
      </datalist>
      {block && (
        <p className="mt-3 flex items-center gap-2 text-xs text-teal-800">
          <Info className="size-3.5 shrink-0" aria-hidden /> {t("st.prop.routing", { sub: p.subZone, block, zone: p.zone })}
        </p>
      )}
      <SectionDivider label={t("st.prop.ids")} />
      <div className="mt-3 grid gap-5 sm:grid-cols-4">
        <Field label={t("st.prop.mouza")} required error={errors.mouza} className="sm:col-span-2">
          {(a) => <Input {...a} value={p.mouza} onChange={(e) => set({ mouza: e.target.value })} />}
        </Field>
        <Field label={t("st.prop.rsdag")} required error={errors.rsDag}>
          {(a) => <Input {...a} value={p.rsDag} onChange={(e) => set({ rsDag: e.target.value })} className="ref" inputMode="numeric" />}
        </Field>
        <Field label={t("st.prop.csdag")} optional>
          {(a) => <Input {...a} value={p.csDag ?? ""} onChange={(e) => set({ csDag: e.target.value })} className="ref" inputMode="numeric" />}
        </Field>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-4">
        <Field label={t("st.prop.plotno")} optional>
          {(a) => <Input {...a} value={p.plotNo ?? ""} onChange={(e) => set({ plotNo: e.target.value })} />}
        </Field>
        <Field label={t("st.prop.plotarea")} required error={errors.plotAreaSqm}>
          {(a) => <Input {...a} type="number" min={0} value={p.plotAreaSqm || ""} onChange={(e) => set({ plotAreaSqm: Number(e.target.value) })} className="tabular" />}
        </Field>
        <Field label={t("st.prop.road")} required error={errors.roadWidthM}>
          {(a) => <Input {...a} type="number" min={0} step={0.5} value={p.roadWidthM || ""} onChange={(e) => set({ roadWidthM: Number(e.target.value) })} className="tabular" />}
        </Field>
        <Field label={t("st.prop.ownership")}>
          {(a) => (
            <Select {...a} value={p.ownershipType} onChange={(e) => set({ ownershipType: e.target.value as typeof p.ownershipType })}>
              <option value="freehold">{t("st.prop.freehold")}</option>
              <option value="rajuk_lease">{t("st.prop.lease")}</option>
              <option value="private_housing">{t("st.prop.private")}</option>
            </Select>
          )}
        </Field>
      </div>
      {p.ownershipType === "rajuk_lease" && (
        <Callout tone="info" className="mt-4">
          {t("st.prop.leaseNote")}
        </Callout>
      )}
      <Field label={t("st.prop.address")} required error={errors.address} className="mt-5">
        {(a) => <Textarea {...a} rows={2} value={p.address} onChange={(e) => set({ address: e.target.value })} />}
      </Field>
    </div>
  );
}

/* ———————————————————————————— 3. Owners ———————————————————————————— */

export function OwnersStep({ app, update, errors }: StepProps) {
  const { t } = useI18n();
  const L = useDomainLabels();
  const docs = useDocs(app);
  const [tab, setTab] = useState("0");
  const ownerDoc = (i: number, c: DocumentCategory) => docs.live.find((d) => d.category === c && d.ownerIndex === i);
  const relations = [
    ["Principal owner", "st.own.principal"],
    ["Co-owner", "st.own.co"],
    ["Legal heir", "st.own.heir"],
    ["Authorised representative", "st.own.rep"],
  ] as const;
  const addOwner = () => {
    update({ owners: [...app.owners, { name: "", relation: "Co-owner" }] });
    setTab(String(app.owners.length));
  };
  const removeOwner = (i: number) => {
    update({
      owners: app.owners.filter((_, k) => k !== i),
      documents: app.documents.filter((d) => d.ownerIndex !== i).map((d) => (d.ownerIndex !== undefined && d.ownerIndex > i ? { ...d, ownerIndex: d.ownerIndex - 1 } : d)),
    });
    setTab("0");
  };
  const ownership = docs.live.find((d) => d.category === "ownership");
  return (
    <div>
      <StepIntro title={t("st.own.title")} tor="2.9" lead={t("st.own.lead")} />
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-end justify-between gap-3">
          <TabsList className="flex-1">
            {app.owners.map((o, i) => {
              const complete = ownerDoc(i, "nid") && ownerDoc(i, "tax_return") && ownerDoc(i, "photo") && o.name.trim();
              return (
                <TabsTrigger key={i} value={String(i)}>
                  <span className={cn("grid size-4 place-items-center rounded-full", complete ? "bg-teal-600 text-white" : "border border-line-strong")}>{complete && <Check className="!size-2.5" strokeWidth={3} />}</span>
                  {o.name.split(" ")[0] || t("st.own.owner", { n: i + 1 })}
                </TabsTrigger>
              );
            })}
          </TabsList>
          <Button type="button" variant="ghost" size="sm" onClick={addOwner} className="mb-1.5">
            <Plus /> {t("st.own.add")}
          </Button>
        </div>
        {app.owners.map((o, i) => (
          <TabsContent key={i} value={String(i)} className="pt-5">
            <div className="grid gap-5 sm:grid-cols-[1fr_14rem_auto] sm:items-end">
              <Field label={t("st.own.name")} required error={errors[`owner-${i}-name`]}>
                {(a) => <Input {...a} value={o.name} onChange={(e) => update({ owners: app.owners.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)) })} />}
              </Field>
              <Field label={t("st.own.relation")}>
                {(a) => (
                  <Select {...a} value={o.relation} onChange={(e) => update({ owners: app.owners.map((x, k) => (k === i ? { ...x, relation: e.target.value } : x)) })}>
                    {relations.map(([v, k]) => (
                      <option key={v} value={v}>
                        {t(k)}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              {app.owners.length > 1 && (
                <Button type="button" variant="danger-outline" size="md" onClick={() => removeOwner(i)} aria-label={t("st.own.remove", { name: o.name || String(i + 1) })}>
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
                      {L.doc(c)} <span className="text-danger-700">*</span>
                    </p>
                    {d ? (
                      <FileRow name={d.name} sizeKb={d.sizeKb} kind={c === "photo" ? "photo" : "document"} meta={t("up.sampleTag")} onRemove={() => docs.remove(d.id)} />
                    ) : (
                      <FileDrop
                        compact
                        label={t("st.own.upload")}
                        hint="PDF / JPG"
                        invalid={!!err}
                        sampleName={`${c}_${(o.name.split(" ")[0] || "owner").toLowerCase()}_sample.${c === "photo" ? "jpg" : "pdf"}`}
                        onUploaded={(f) => docs.add({ name: f.name, sizeKb: f.sizeKb, category: c, ownerIndex: i, previewKind: c === "photo" ? "photo" : "document", pages: 1 })}
                      />
                    )}
                    {err && <p className="mt-1 text-xs font-medium text-danger-700">{err}</p>}
                  </div>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      <SectionDivider label={t("st.own.plot")} />
      <div className="mt-3 max-w-xl">
        {ownership ? (
          <FileRow name={ownership.name} sizeKb={ownership.sizeKb} meta={`${L.doc("ownership")} · ${t("up.sampleTag")}`} onRemove={() => docs.remove(ownership.id)} />
        ) : (
          <FileDrop label={t("st.own.ownershipDrop")} invalid={!!errors.ownership} sampleName="mutation_khatian_sample.pdf" onUploaded={(f) => docs.add({ name: f.name, sizeKb: f.sizeKb, category: "ownership", previewKind: "document", pages: 3 })} />
        )}
        {errors.ownership && <p className="mt-1 text-xs font-medium text-danger-700">{errors.ownership}</p>}
      </div>
      <Callout tone="demo" className="mt-6">
        {t("st.own.demo")}
      </Callout>
    </div>
  );
}

/* ———————————————————————————— 4. Professionals ———————————————————————————— */

export function ProfessionalsStep({ app, errors }: StepProps) {
  const { t, locale } = useI18n();
  const L = useDomainLabels();
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
      <StepIntro title={t("st.pro.title")} tor="3.2(a) · 1.4" lead={t("st.pro.lead")} />
      <ul className="divide-y divide-line rounded-xl border border-line">
        {roles.map((r) => {
          const current = app.professionals.filter((p) => p.role === r && p.status !== "replaced").at(-1);
          const u = current ? users.find((x) => x.id === current.userId) : undefined;
          const req = required.includes(r);
          return (
            <li key={r} className="flex flex-wrap items-center gap-4 px-4 py-4">
              <div className="w-full shrink-0 sm:w-48">
                <p className="text-sm font-medium text-ink-strong">{L.pro(r)}</p>
                <p className={cn("text-xs", req ? "text-danger-700" : "text-subtle")}>{req ? t("st.pro.required") : t("st.pro.optional")}</p>
              </div>
              <div className="min-w-0 flex-1">
                {u && current && current.status !== "declined" ? (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <Avatar name={u.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-strong">{u.name}</p>
                      <p className="text-xs text-muted">
                        {u.membership?.body} <span className="ref">{u.membership?.number}</span>
                      </p>
                    </div>
                    {current.status === "accepted" ? (
                      <Badge tone="success" icon={Check}>
                        {t("st.pro.accepted")}
                      </Badge>
                    ) : (
                      <Badge tone="warning" icon={Clock3}>
                        {t("st.pro.invited", { when: formatRelative(current.invitedAt, undefined, locale) })}
                      </Badge>
                    )}
                  </div>
                ) : current?.status === "declined" ? (
                  <p className="flex items-center gap-1.5 text-sm text-danger-700">
                    <X className="size-4" aria-hidden /> {t("st.pro.declined", { note: current.note ? ` — “${current.note}”` : "" })}
                  </p>
                ) : (
                  <p className={cn("text-sm", errors[`pro-${r}`] ? "font-medium text-danger-700" : "text-muted")}>{errors[`pro-${r}`] ?? t("st.pro.notInvited")}</p>
                )}
              </div>
              <Button type="button" variant={u && current?.status !== "declined" ? "ghost" : "secondary"} size="sm" onClick={() => setPicker(r)}>
                <UserPlus /> {u && current?.status !== "declined" ? t("st.pro.change") : t("st.pro.invite")}
              </Button>
            </li>
          );
        })}
      </ul>
      <Callout tone="info" className="mt-5">
        {t("st.pro.note")}
      </Callout>

      <Dialog open={picker !== null} onOpenChange={(o) => !o && setPicker(null)}>
        <DialogContent title={picker ? t("st.pro.dialog", { role: L.pro(picker) }) : ""} description={t("st.pro.dialogLead")} size="md">
          {directory.length === 0 ? (
            <p className="text-sm text-muted">{t("st.pro.none")}</p>
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
                      {t("st.pro.verified")}
                    </Badge>
                  ) : (
                    <Badge tone="warning">{t("st.pro.unverified")}</Badge>
                  )}
                  <Button size="sm" disabled={!u.membership?.verified} loading={busy === u.id} onClick={() => invite(u.id)}>
                    {t("st.pro.invite")}
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
  const { t } = useI18n();
  const docs = useDocs(app);
  const centre = AREA_CENTRES[app.property.area] ?? [23.7806, 90.4074];
  const loc = app.location ?? { lat: centre[0], lng: centre[1], dapLandUse: "Residential zone (urban)", confirmedOnMap: false };
  const setLoc = (patch: Partial<typeof loc>) => update({ location: { ...loc, ...patch } });
  const plotPhotos = docs.live.filter((d) => d.category === "plot_photo");
  const roadPhotos = docs.live.filter((d) => d.category === "road_photo");
  return (
    <div>
      <StepIntro title={t("st.loc.title")} tor="2.3 · 2.9" lead={t("st.loc.lead")} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <SiteMap lat={loc.lat} lng={loc.lng} onChange={(p) => setLoc({ ...p, confirmedOnMap: false })} height={340} />
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
            <Field label={t("st.loc.lat")}>
              {(a) => <Input {...a} className="ref" type="number" step="0.000001" value={loc.lat} onChange={(e) => setLoc({ lat: Number(e.target.value), confirmedOnMap: false })} />}
            </Field>
            <Field label={t("st.loc.lng")}>
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
            <MapPin /> {t("st.loc.current")} <SimulatedTag className="ml-1">{t("common.simulated")}</SimulatedTag>
          </Button>
          <div className="rounded-lg border border-line bg-surface-2 p-3 text-sm">
            <p className="text-xs text-muted">{t("st.loc.dap")}</p>
            <p className="mt-0.5 font-medium text-ink-strong">{loc.dapLandUse}</p>
          </div>
          <Button type="button" className="w-full" variant={loc.confirmedOnMap ? "subtle" : "primary"} onClick={() => setLoc({ confirmedOnMap: true })}>
            {loc.confirmedOnMap ? (
              <>
                <Check /> {t("st.loc.confirmed")}
              </>
            ) : (
              t("st.loc.confirm")
            )}
          </Button>
          {errors.location && <p className="text-xs font-medium text-danger-700">{errors.location}</p>}
        </div>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {(
          [
            ["plot_photo", t("st.loc.plotPhotos"), plotPhotos, "plot_corner_sample.jpg"],
            ["road_photo", t("st.loc.roadPhotos"), roadPhotos, "adjacent_road_sample.jpg"],
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
              <FileDrop
                compact
                label={list.length ? t("st.loc.addAnother") : t("st.loc.uploadPhoto")}
                accept=".jpg,.jpeg,.png"
                hint={t("st.loc.photoHint")}
                invalid={!!errors[cat]}
                sampleName={sample}
                onUploaded={(f) => docs.add({ name: f.name, sizeKb: f.sizeKb, category: cat, previewKind: "photo" })}
              />
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
  const { t } = useI18n();
  const L = useDomainLabels();
  const far = useDemoStore((s) => s.far);
  const b: BuildingInfo = app.building ?? { occupancy: "A", storeys: 0, basements: 0, totalFloorAreaSqm: 0, groundCoverageSqm: 0, units: 0, heightM: 0, setbacks: { front: 0, rear: 0, left: 0, right: 0 } };
  const set = (patch: Partial<BuildingInfo>) => update({ building: { ...b, ...patch } });
  const plot = app.property.plotAreaSqm;
  const limits = farFor(far, plot, app.property.roadWidthM);
  const proposedFar = plot > 0 ? b.totalFloorAreaSqm / plot : 0;
  const coverage = plot > 0 ? (b.groundCoverageSqm / plot) * 100 : 0;
  const num = (label: string, key: keyof BuildingInfo, step = 1) => (
    <Field label={label} required={["storeys", "totalFloorAreaSqm", "groundCoverageSqm"].includes(key)} error={errors[key]}>
      {(a) => <Input {...a} type="number" min={0} step={step} className="tabular" value={(b[key] as number) || ""} onChange={(e) => set({ [key]: Number(e.target.value) } as Partial<BuildingInfo>)} />}
    </Field>
  );
  return (
    <div>
      <StepIntro title={t("st.bld.title")} tor="1.4 · 1.15" lead={t("st.bld.lead")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("st.bld.occ")} required>
          {(a) => (
            <Select {...a} value={b.occupancy} onChange={(e) => set({ occupancy: e.target.value as OccupancyKey })}>
              {(Object.keys(OCCUPANCY) as OccupancyKey[]).map((k) => (
                <option key={k} value={k}>
                  {k} — {L.occ(k)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-5">
          {num(t("st.bld.storeys"), "storeys")}
          {num(t("st.bld.basements"), "basements")}
        </div>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-4">
        {num(t("st.bld.tfa"), "totalFloorAreaSqm")}
        {num(t("st.bld.coverage"), "groundCoverageSqm")}
        {num(t("st.bld.units"), "units")}
        {num(t("st.bld.height"), "heightM", 0.1)}
      </div>
      <SectionDivider label={t("st.bld.setbacks")} />
      <div className="mt-3 grid grid-cols-2 gap-5 sm:grid-cols-4">
        {(["front", "rear", "left", "right"] as const).map((k) => (
          <Field key={k} label={t(`st.bld.${k}`)}>
            {(a) => <Input {...a} type="number" min={0} step={0.1} className="tabular" value={b.setbacks[k] || ""} onChange={(e) => set({ setbacks: { ...b.setbacks, [k]: Number(e.target.value) } })} />}
          </Field>
        ))}
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <CheckTile label={t("st.bld.far")} value={proposedFar ? proposedFar.toFixed(2) : "—"} limit={limits ? t("st.bld.limit", { v: limits.far.toFixed(1) }) : t("st.bld.enterPlot")} ok={!limits || !proposedFar || proposedFar <= limits.far} />
        <CheckTile label={t("st.bld.cov")} value={coverage ? `${coverage.toFixed(1)}%` : "—"} limit={limits ? t("st.bld.max", { v: limits.maxGroundCoveragePct }) : "—"} ok={!limits || !coverage || coverage <= limits.maxGroundCoveragePct} />
        <CheckTile label={t("st.bld.roadw")} value={app.property.roadWidthM ? `${app.property.roadWidthM} m` : "—"} limit={limits ? t("st.bld.min", { v: limits.roadWidthMinM }) : "—"} ok={!limits || limits.roadOk} />
      </div>
      <p className="mt-2 text-xs text-muted">
        {t("st.bld.note")} <SimulatedTag>{t("common.illustrative")}</SimulatedTag>
      </p>
    </div>
  );
}

function CheckTile({ label, value, limit, ok }: { label: string; value: string; limit: string; ok: boolean }) {
  const { t } = useI18n();
  return (
    <div className={cn("rounded-lg border p-4", ok ? "border-line bg-surface-2" : "border-amber-500/50 bg-amber-50")}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">{label}</p>
        {ok ? <Check className="size-4 text-success-600" aria-label={t("st.bld.within")} /> : <AlertTriangle className="size-4 text-amber-600" aria-label={t("st.bld.exceeds")} />}
      </div>
      <p className="tabular mt-1 font-display text-xl font-semibold text-ink-strong">{value}</p>
      <p className={cn("text-xs", ok ? "text-muted" : "font-medium text-amber-700")}>{limit}</p>
    </div>
  );
}

/* ———————————————————————————— 7. Documents ———————————————————————————— */

export function DocumentsStep({ app, errors }: StepProps) {
  const { t } = useI18n();
  const L = useDomainLabels();
  const docs = useDocs(app);
  const [preview, setPreview] = useState<DrawingSheetKind | null>(null);
  const sheets: DrawingSheetKind[] = app.type === "CP" ? ["site", "ground", "typical", "elevation", "section", "far"] : ["site", "ground", "elevation"];
  const required = requiredSheets(app);
  const extras = docs.live.filter((d) => ["certificate", "professional"].includes(d.category));
  return (
    <div>
      <StepIntro title={t("st.doc.title")} tor="1.13 · 2.9" lead={t("st.doc.lead")} />
      <ul className="divide-y divide-line rounded-xl border border-line">
        {sheets.map((s) => {
          const d = docs.live.find((x) => x.category === "drawing" && x.drawingSheet === s);
          const prior = app.documents.filter((x) => x.category === "drawing" && x.drawingSheet === s && x.status === "superseded").length;
          return (
            <li key={s} className="grid gap-3 px-4 py-3.5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center">
              <div>
                <p className="text-sm font-medium text-ink-strong">{cap(L.sheet(s))}</p>
                <p className={cn("text-xs", required.includes(s) ? "text-danger-700" : "text-subtle")}>
                  {required.includes(s) ? t("wiz.required") : t("wiz.optional")}
                  {prior ? ` · ${t("st.doc.earlier", { n: prior })}` : ""}
                </p>
              </div>
              {d ? (
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <FileRow name={d.name} sizeKb={d.sizeKb} kind="drawing" meta={`v${d.version} · ${t("up.sampleTag")}`} onPreview={() => setPreview(s)} onRemove={() => docs.remove(d.id)} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setPreview(s)} aria-label={t("st.doc.preview", { sheet: L.sheet(s) })}>
                    <Eye />
                  </Button>
                </div>
              ) : (
                <FileDrop
                  compact
                  label={t("st.doc.uploadSheet")}
                  accept=".pdf"
                  hint={t("st.doc.singlePdf")}
                  invalid={!!errors[`sheet-${s}`]}
                  sampleName={`${s}_sheet_sample.pdf`}
                  onUploaded={(f) => docs.add({ name: f.name, sizeKb: f.sizeKb, category: "drawing", drawingSheet: s, previewKind: "drawing", pages: 1 })}
                />
              )}
            </li>
          );
        })}
      </ul>
      <SectionDivider label={t("st.doc.extras")} />
      <div className="mt-3 space-y-2">
        {extras.map((d) => (
          <FileRow key={d.id} name={d.name} sizeKb={d.sizeKb} meta={L.doc(d.category)} onRemove={() => docs.remove(d.id)} />
        ))}
        <div className="grid gap-3 md:grid-cols-2">
          <FileDrop compact label={app.type === "CP" ? `${t("st.doc.soil")} *` : t("st.doc.cert")} invalid={!!errors.certificate} sampleName="soil_test_report_sample.pdf" onUploaded={(f) => docs.add({ name: f.name, sizeKb: f.sizeKb, category: "certificate", previewKind: "document", pages: 12 })} />
          <FileDrop compact label={t("st.doc.proAttach")} sampleName="structural_design_basis_sample.pdf" onUploaded={(f) => docs.add({ name: f.name, sizeKb: f.sizeKb, category: "professional", previewKind: "document", pages: 20 })} />
        </div>
        {errors.certificate && <p className="text-xs font-medium text-danger-700">{errors.certificate}</p>}
      </div>
      <Dialog open={preview !== null} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent size="xl" eyebrow={t("st.doc.previewTitle")} title={preview ? cap(L.sheet(preview)) : ""} description={t("st.doc.previewLead")}>
          {preview && (
            <div className="overflow-hidden rounded-lg border border-line">
              <DrawingSheet
                kind={preview}
                title={cap(L.sheet(preview))}
                page={sheets.indexOf(preview) + 1}
                total={sheets.length}
                appRef={app.ref}
                project={app.title}
                version={docs.live.find((d) => d.drawingSheet === preview)?.version ?? 1}
                storeys={app.building?.storeys || 6}
                signable={preview !== "far"}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ———————————————————————————— 8. Review ———————————————————————————— */

export function ReviewStep({
  app,
  issues,
  onEdit,
  declared,
  setDeclared,
}: StepProps & { issues: Array<Issue & { step: string }>; onEdit: (step: number) => void; declared: boolean; setDeclared: (v: boolean) => void }) {
  const { t, locale } = useI18n();
  const L = useDomainLabels();
  const users = useDemoStore((s) => s.users);
  const fee = useMemo(() => (app.building ? calculateIllustrativeFee({ type: app.type, occupancy: app.building.occupancy, totalFloorAreaSqm: app.building.totalFloorAreaSqm }) : undefined), [app.type, app.building]);
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const stepIndex: Record<string, number> = { type: 0, property: 1, owners: 2, professionals: 3, location: 4, building: 5, documents: 6 };
  const relationLabel: Record<string, MessageKey> = { "Principal owner": "st.own.principal", "Co-owner": "st.own.co", "Legal heir": "st.own.heir", "Authorised representative": "st.own.rep" };
  const section = (title: string, step: number, children: ReactNode) => (
    <div className="rounded-lg border border-line">
      <div className="flex items-center justify-between border-b border-line bg-surface-2 px-4 py-2.5">
        <p className="text-sm font-semibold text-ink-strong">{title}</p>
        <button type="button" onClick={() => onEdit(step)} className="text-xs font-medium text-teal-700 hover:underline">
          {t("st.rev.edit")}
        </button>
      </div>
      <div className="px-4 py-3 text-sm">{children}</div>
    </div>
  );
  const b = app.building;
  const liveDocs = app.documents.filter((d) => d.status !== "superseded");
  return (
    <div>
      <StepIntro title={t("wiz.step.review")} lead={t("st.rev.lead")} />
      {errors.length > 0 && (
        <Callout tone="danger" title={t("st.rev.errors", { n: errors.length })} className="mb-4">
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
        <Callout tone="warning" title={t("st.rev.note")} className="mb-4">
          <ul className="space-y-1">
            {warnings.map((i) => (
              <li key={i.step + i.field}>{i.message}</li>
            ))}
          </ul>
        </Callout>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {section(
          t("st.rev.property"),
          1,
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            <dt className="text-muted">{t("st.rev.zone")}</dt>
            <dd className="text-ink-strong">
              {app.property.zone} · {app.property.subZone || "—"}
            </dd>
            <dt className="text-muted">{t("st.rev.mouza")}</dt>
            <dd className="text-ink-strong">
              {app.property.mouza || "—"} · <span className="ref">{app.property.rsDag || "—"}</span>
            </dd>
            <dt className="text-muted">{t("st.prop.plotarea")}</dt>
            <dd className="tabular text-ink-strong">{app.property.plotAreaSqm || "—"}</dd>
            <dt className="text-muted">{t("st.prop.road")}</dt>
            <dd className="tabular text-ink-strong">{app.property.roadWidthM || "—"}</dd>
          </dl>,
        )}
        {section(
          t("st.rev.people"),
          2,
          <ul className="space-y-1.5">
            {app.owners.map((o, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="text-ink-strong">{o.name || t("st.own.owner", { n: i + 1 })}</span>
                <span className="text-muted">{relationLabel[o.relation] ? t(relationLabel[o.relation]!) : o.relation}</span>
              </li>
            ))}
            {app.professionals
              .filter((p) => !["declined", "replaced"].includes(p.status))
              .map((p) => (
                <li key={p.userId + p.role} className="flex justify-between gap-3">
                  <span className="text-ink-strong">{users.find((u) => u.id === p.userId)?.name}</span>
                  <span className="text-muted">
                    {L.pro(p.role)} · {p.status === "accepted" ? t("st.pro.accepted") : t("st.pro.invited", { when: "" }).trim()}
                  </span>
                </li>
              ))}
          </ul>,
        )}
        {section(
          t("st.rev.location"),
          4,
          <p className="text-ink-strong">
            {app.location ? (
              <>
                <span className="ref">
                  {app.location.lat.toFixed(5)}, {app.location.lng.toFixed(5)}
                </span>{" "}
                · {app.location.dapLandUse} · {app.location.confirmedOnMap ? t("st.rev.confirmed") : t("st.rev.unconfirmed")}
              </>
            ) : (
              t("st.rev.notSet")
            )}
          </p>,
        )}
        {section(
          t("st.rev.building"),
          5,
          b ? (
            <p className="text-ink-strong">
              {t("st.rev.buildingLine", { g: b.occupancy, occ: L.occ(b.occupancy), s: b.storeys + (b.basements ? ` + B${b.basements}` : ""), a: b.totalFloorAreaSqm.toLocaleString("en-IN"), u: b.units })}
            </p>
          ) : (
            <p className="text-muted">{t("st.rev.notEntered")}</p>
          ),
        )}
      </div>
      <div className="mt-4">
        {section(t("st.rev.documents"), 6, <p className="text-ink-strong">{t("st.rev.files", { n: liveDocs.length, d: liveDocs.filter((d) => d.category === "drawing").length })}</p>)}
      </div>

      <section aria-labelledby="fee-title" className="mt-8 overflow-hidden rounded-xl border border-line">
        <div className="on-dark flex flex-wrap items-center justify-between gap-3 border-b border-line bg-navy-900 px-5 py-4 text-on-dark">
          <div>
            <h3 id="fee-title" className="font-display font-semibold text-white">
              {t("st.rev.fee")}
            </h3>
            <p className="ref mt-0.5 text-[0.6875rem] text-on-dark-muted">
              {ILLUSTRATIVE_RULESET.id} · {ILLUSTRATIVE_RULESET.label}
            </p>
          </div>
          <span className="rounded-xs border border-dashed border-amber-500/60 px-1.5 py-0.5 font-mono text-[0.625rem] uppercase tracking-wider text-amber-200">{t("st.rev.illustrative")}</span>
        </div>
        {fee ? (
          <div className="divide-y divide-line">
            <div className="grid grid-cols-3 gap-4 bg-surface-2 px-5 py-3 text-xs">
              <div>
                <p className="text-muted">{t("st.rev.occupancy")}</p>
                <p className="font-medium text-ink-strong">
                  {b?.occupancy} · {b ? L.occ(b.occupancy) : ""}
                </p>
              </div>
              <div>
                <p className="text-muted">{t("st.rev.area")}</p>
                <p className="tabular font-medium text-ink-strong">{b?.totalFloorAreaSqm.toLocaleString("en-IN")} m²</p>
              </div>
              <div>
                <p className="text-muted">{t("st.rev.type")}</p>
                <p className="font-medium text-ink-strong">{app.type}</p>
              </div>
            </div>
            {fee.lines.map((l) => (
              <div key={l.key} className="flex items-start justify-between gap-4 px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink-strong">{L.feeLine(l)}</p>
                  <p className="ref mt-0.5 text-xs text-muted">{l.basis}</p>
                </div>
                <p className="tabular font-medium text-ink-strong">{formatBDT(l.amount, locale)}</p>
              </div>
            ))}
            <div className="flex items-center justify-between bg-surface-2 px-5 py-3.5">
              <p className="text-sm font-semibold text-ink-strong">{t("st.rev.total")}</p>
              <p className="tabular font-display text-xl font-semibold text-ink-strong">{formatBDT(fee.total, locale)}</p>
            </div>
            <p className="px-5 py-3 text-xs leading-relaxed text-muted">{t("st.rev.feeNote")}</p>
          </div>
        ) : (
          <p className="px-5 py-4 text-sm text-muted">{t("st.rev.feeEmpty")}</p>
        )}
      </section>

      <label className="mt-6 flex items-start gap-3 rounded-lg border border-line p-4 text-sm text-ink">
        <input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} className="mt-0.5 size-4 accent-teal-600" />
        {t("st.rev.declare")}
      </label>
    </div>
  );
}
