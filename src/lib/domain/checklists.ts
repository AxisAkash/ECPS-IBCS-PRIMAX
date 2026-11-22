/**
 * Review and inspection checklists.
 *
 * TOR 1.11 / 1.12 require Structural Design and Fire Safety Design checklists to be enhanced from
 * DCQR project outputs. Those outputs were not available, so the items below are representative
 * prompts written for the prototype. Replace them with the approved DCQR checklist items.
 */
export interface ChecklistItem {
  id: string;
  label: string;
  hint?: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  source: string;
  items: ChecklistItem[];
}

export const REVIEW_CHECKLIST: ChecklistSection[] = [
  {
    id: "docs",
    title: "Applicant documentation",
    source: "TOR 2.9",
    items: [
      { id: "docs.owners", label: "Every owner listed with NID, tax-return slip and photograph in a separate tab" },
      { id: "docs.ownership", label: "Ownership record matches mouza and RS dag stated in the application" },
      { id: "docs.gps", label: "Geographic coordinates, plot photographs and adjacent-road photographs attached", hint: "TOR 2.3 makes these mandatory." },
    ],
  },
  {
    id: "planning",
    title: "Planning compliance",
    source: "DAP 2022–2035 · Imarat Bidhimala 2025",
    items: [
      { id: "planning.landuse", label: "Proposed occupancy is permitted in the DAP land-use zone" },
      { id: "planning.far", label: "Floor area ratio is within the configured FAR limit" },
      { id: "planning.setback", label: "Setbacks and ground coverage satisfy configured parameters" },
      { id: "planning.road", label: "Access road width recorded and consistent with site plan" },
    ],
  },
  {
    id: "structural",
    title: "Structural design",
    source: "TOR 1.11 · DCQR checklist (pending)",
    items: [
      { id: "structural.signed", label: "Structural drawings endorsed by the participating structural engineer" },
      { id: "structural.seismic", label: "Seismic design parameters stated per BNBC 2020" },
      { id: "structural.soil", label: "Soil test report attached and referenced in foundation design" },
    ],
  },
  {
    id: "fire",
    title: "Fire safety design",
    source: "TOR 1.11 · DCQR checklist (pending)",
    items: [
      { id: "fire.egress", label: "Means of escape and stair widths shown on floor plans" },
      { id: "fire.refuge", label: "Fire-fighting access and hydrant locations indicated where applicable" },
    ],
  },
];

export const INSPECTION_CHECKLIST: ChecklistSection[] = [
  {
    id: "site",
    title: "Site & location",
    source: "TOR 2.3",
    items: [
      { id: "site.gps", label: "On-site GPS position matches the plot recorded in the application" },
      { id: "site.board", label: "Permit display board visible at the site entrance" },
      { id: "site.road", label: "Adjacent road condition matches submitted photographs" },
    ],
  },
  {
    id: "construction",
    title: "Construction progress",
    source: "FRCM inspection (representative)",
    items: [
      { id: "construction.setback", label: "Setbacks on site match approved drawings" },
      { id: "construction.storeys", label: "Number of storeys does not exceed approved limit" },
      { id: "construction.plinth", label: "Plinth level reached within the approval validity period", hint: "Approval letter wording per TOR 1.4." },
    ],
  },
  {
    id: "safety",
    title: "Safety & supervision",
    source: "FRCM inspection (representative)",
    items: [
      { id: "safety.supervisor", label: "Construction Supervision Engineer present or contactable" },
      { id: "safety.ppe", label: "Basic site safety measures in place (barricading, PPE)" },
      { id: "safety.fire", label: "Fire-safety provisions under construction per approved fire drawing" },
    ],
  },
];

export function checklistCompletion(
  sections: ChecklistSection[],
  state: Record<string, { result: string | null } | undefined>,
) {
  const all = sections.flatMap((s) => s.items);
  const done = all.filter((i) => state[i.id]?.result).length;
  const failed = all.filter((i) => state[i.id]?.result === "fail").length;
  return { done, total: all.length, failed, complete: done === all.length };
}
