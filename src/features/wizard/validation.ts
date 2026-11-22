import type { Application, DocumentCategory, DrawingSheetKind, FarRow, ProfessionalRole } from "@/lib/domain/types";

export const STEP_KEYS = ["type", "property", "owners", "professionals", "location", "building", "documents", "review"] as const;
export type StepKey = (typeof STEP_KEYS)[number];

export interface Issue {
  field: string;
  message: string;
  /** Warnings are shown on review but do not block submission. */
  severity: "error" | "warning";
}

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

export function validateStep(app: Application, step: StepKey, far: FarRow[]): Issue[] {
  const issues: Issue[] = [];
  const e = (field: string, message: string) => issues.push({ field, message, severity: "error" });
  const w = (field: string, message: string) => issues.push({ field, message, severity: "warning" });
  const p = app.property;
  switch (step) {
    case "type":
      break;
    case "property":
      if (app.type === "PP_PRIVATE_HOUSING" && !p.housingProjectId) e("housingProjectId", "Select the approved housing project.");
      if (!p.zone) e("zone", "Select the RAJUK zone.");
      if (!p.subZone) e("subZone", "Select the sub-zone so the file can be routed to the right desk.");
      if (!p.area.trim()) e("area", "Enter the area or locality.");
      if (!p.mouza.trim()) e("mouza", "Enter the mouza name.");
      if (!p.rsDag.trim()) e("rsDag", "Enter the RS dag number.");
      if (!(p.plotAreaSqm > 0)) e("plotAreaSqm", "Enter the plot area in square metres.");
      if (!(p.roadWidthM > 0)) e("roadWidthM", "Enter the width of the access road.");
      if (!p.address.trim()) e("address", "Enter the plot address.");
      break;
    case "owners":
      if (app.owners.length === 0) e("owners", "Add at least one owner.");
      app.owners.forEach((o, i) => {
        if (!o.name.trim()) e(`owner-${i}-name`, `Owner ${i + 1}: enter the full name.`);
        if (!has(app, "nid", i)) e(`owner-${i}-nid`, `${o.name || `Owner ${i + 1}`}: upload the NID document.`);
        if (!has(app, "tax_return", i)) e(`owner-${i}-tax`, `${o.name || `Owner ${i + 1}`}: upload the tax-return slip.`);
        if (!has(app, "photo", i)) e(`owner-${i}-photo`, `${o.name || `Owner ${i + 1}`}: upload a photograph.`);
      });
      if (!has(app, "ownership")) e("ownership", "Upload the ownership record (e.g. mutation khatian).");
      break;
    case "professionals":
      requiredProfessionals(app).forEach((r) => {
        const pr = app.professionals.find((x) => x.role === r && x.status !== "declined" && x.status !== "replaced");
        if (!pr) e(`pro-${r}`, `Invite a ${r === "architect" ? "registered architect" : `${r} engineer`}.`);
        else if (pr.status === "invited") w(`pro-${r}`, `The ${r === "architect" ? "architect" : `${r} engineer`} has not accepted yet.`);
      });
      break;
    case "location":
      if (!app.location) e("location", "Place the plot on the map or enter its coordinates.");
      else if (!app.location.confirmedOnMap) e("location", "Confirm the plot position on the map.");
      if (!has(app, "plot_photo")) e("plot_photo", "Upload at least one photograph of the plot (TOR 2.3).");
      if (!has(app, "road_photo")) e("road_photo", "Upload a photograph of the adjacent road (TOR 2.3).");
      break;
    case "building": {
      const b = app.building;
      if (!b) {
        e("building", "Enter the building details.");
        break;
      }
      if (!(b.storeys > 0)) e("storeys", "Enter the number of storeys.");
      if (!(b.totalFloorAreaSqm > 0)) e("totalFloorAreaSqm", "Enter the total floor area.");
      if (!(b.groundCoverageSqm > 0)) e("groundCoverageSqm", "Enter the ground coverage.");
      if (p.plotAreaSqm > 0 && b.totalFloorAreaSqm > 0) {
        const f = farFor(far, p.plotAreaSqm, p.roadWidthM);
        const proposed = b.totalFloorAreaSqm / p.plotAreaSqm;
        if (f && proposed > f.far) w("far", `Proposed FAR ${proposed.toFixed(2)} exceeds the configured limit of ${f.far.toFixed(1)} (illustrative parameters).`);
        if (f && (b.groundCoverageSqm / p.plotAreaSqm) * 100 > f.maxGroundCoveragePct) w("coverage", `Ground coverage exceeds the configured ${f.maxGroundCoveragePct}% (illustrative).`);
      }
      break;
    }
    case "documents":
      requiredSheets(app).forEach((s) => {
        if (!live(app).some((d) => d.category === "drawing" && d.drawingSheet === s)) e(`sheet-${s}`, `Upload the ${sheetLabel(s)} drawing.`);
      });
      if (app.type === "CP" && !has(app, "certificate")) e("certificate", "Upload the soil test report.");
      break;
    case "review":
      break;
  }
  return issues;
}

export function sheetLabel(s: DrawingSheetKind) {
  return { site: "site plan", ground: "ground floor plan", typical: "typical floor plan", elevation: "elevation", section: "section", far: "FAR calculation sheet" }[s];
}

export function allIssues(app: Application, far: FarRow[]) {
  return STEP_KEYS.flatMap((s) => validateStep(app, s, far).map((i) => ({ ...i, step: s })));
}
