import { translate, type MessageKey } from "@/lib/i18n";
import type { Application, DocumentCategory, DrawingSheetKind, FarRow, ProfessionalRole } from "@/lib/domain/types";

export const STEP_KEYS = ["type", "property", "owners", "professionals", "location", "building", "documents", "review"] as const;
export type StepKey = (typeof STEP_KEYS)[number];

export interface Issue {
  field: string;
  message: string;
  /** Warnings are shown on review but do not block submission. */
  severity: "error" | "warning";
}

export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;
const english: Translate = (k, v) => translate("en", k, v);

export function requiredProfessionals(app: Application): ProfessionalRole[] {
  return app.type === "CP" ? ["architect", "structural", "electrical", "plumbing"] : ["architect"];
}

export function requiredSheets(app: Application): DrawingSheetKind[] {
  return app.type === "CP" ? ["site", "ground", "typical", "elevation", "section", "far"] : ["site"];
}

const live = (a: Application) => a.documents.filter((d) => d.status !== "superseded");
const has = (a: Application, c: DocumentCategory, owner?: number) => live(a).some((d) => d.category === c && (owner === undefined || d.ownerIndex === owner));

export function farFor(far: FarRow[], plotAreaSqm: number, roadWidthM: number) {
  const row = far.find((r) => plotAreaSqm >= r.plotFromSqm && plotAreaSqm < r.plotToSqm);
  if (!row) return undefined;
  return { ...row, roadOk: roadWidthM >= row.roadWidthMinM };
}

export function validateStep(app: Application, step: StepKey, far: FarRow[], t: Translate = english): Issue[] {
  const issues: Issue[] = [];
  const e = (field: string, key: MessageKey, vars?: Record<string, string | number>) => issues.push({ field, message: t(key, vars), severity: "error" });
  const w = (field: string, key: MessageKey, vars?: Record<string, string | number>) => issues.push({ field, message: t(key, vars), severity: "warning" });
  const p = app.property;
  switch (step) {
    case "type":
      break;
    case "property":
      if (app.type === "PP_PRIVATE_HOUSING" && !p.housingProjectId) e("housingProjectId", "val.housing");
      if (!p.zone) e("zone", "val.zone");
      if (!p.subZone) e("subZone", "val.subzone");
      if (!p.area.trim()) e("area", "val.area");
      if (!p.mouza.trim()) e("mouza", "val.mouza");
      if (!p.rsDag.trim()) e("rsDag", "val.rsdag");
      if (!(p.plotAreaSqm > 0)) e("plotAreaSqm", "val.plotarea");
      if (!(p.roadWidthM > 0)) e("roadWidthM", "val.road");
      if (!p.address.trim()) e("address", "val.address");
      break;
    case "owners":
      if (app.owners.length === 0) e("owners", "val.owners");
      app.owners.forEach((o, i) => {
        const name = o.name || t("st.own.owner", { n: i + 1 });
        if (!o.name.trim()) e(`owner-${i}-name`, "val.ownerName", { n: i + 1 });
        if (!has(app, "nid", i)) e(`owner-${i}-nid`, "val.ownerNid", { name });
        if (!has(app, "tax_return", i)) e(`owner-${i}-tax`, "val.ownerTax", { name });
        if (!has(app, "photo", i)) e(`owner-${i}-photo`, "val.ownerPhoto", { name });
      });
      if (!has(app, "ownership")) e("ownership", "val.ownership");
      break;
    case "professionals":
      requiredProfessionals(app).forEach((r) => {
        const pr = app.professionals.find((x) => x.role === r && x.status !== "declined" && x.status !== "replaced");
        const role = t(`pro.${r}` as MessageKey).toLowerCase();
        if (!pr) e(`pro-${r}`, "val.proInvite", { role });
        else if (pr.status === "invited") w(`pro-${r}`, "val.proPending", { role });
      });
      break;
    case "location":
      if (!app.location) e("location", "val.location");
      else if (!app.location.confirmedOnMap) e("location", "val.locationConfirm");
      if (!has(app, "plot_photo")) e("plot_photo", "val.plotPhoto");
      if (!has(app, "road_photo")) e("road_photo", "val.roadPhoto");
      break;
    case "building": {
      const b = app.building;
      if (!b) {
        e("building", "val.building");
        break;
      }
      if (!(b.storeys > 0)) e("storeys", "val.storeys");
      if (!(b.totalFloorAreaSqm > 0)) e("totalFloorAreaSqm", "val.tfa");
      if (!(b.groundCoverageSqm > 0)) e("groundCoverageSqm", "val.coverage");
      if (p.plotAreaSqm > 0 && b.totalFloorAreaSqm > 0) {
        const f = farFor(far, p.plotAreaSqm, p.roadWidthM);
        const proposed = b.totalFloorAreaSqm / p.plotAreaSqm;
        if (f && proposed > f.far) w("far", "val.far", { p: proposed.toFixed(2), l: f.far.toFixed(1) });
        if (f && (b.groundCoverageSqm / p.plotAreaSqm) * 100 > f.maxGroundCoveragePct) w("coverage", "val.coverageMax", { pct: f.maxGroundCoveragePct });
      }
      break;
    }
    case "documents":
      requiredSheets(app).forEach((s) => {
        if (!live(app).some((d) => d.category === "drawing" && d.drawingSheet === s)) e(`sheet-${s}`, "val.sheet", { sheet: t(`sheet.${s}` as MessageKey) });
      });
      if (app.type === "CP" && !has(app, "certificate")) e("certificate", "val.soil");
      break;
    case "review":
      break;
  }
  return issues;
}

/** English sheet label (kept for non-localised internal views). */
export function sheetLabel(s: DrawingSheetKind) {
  return translate("en", `sheet.${s}` as MessageKey);
}

export function allIssues(app: Application, far: FarRow[], t: Translate = english) {
  return STEP_KEYS.flatMap((s) => validateStep(app, s, far, t).map((i) => ({ ...i, step: s })));
}
