import type { FeeAssessment, FeeLine, OccupancyKey, ServiceType } from "./types";

/**
 * ILLUSTRATIVE fee calculation.
 *
 * TOR 1.4 requires fees to be determined automatically from Occupancy Type and Total Project Area
 * according to the 2025 Rules. The official schedule was not available to this prototype, so every
 * rate below is a placeholder chosen only to demonstrate the calculation UI. None of these amounts
 * are RAJUK fees. Rates must be configured from the approved schedule before any real use.
 */
export const ILLUSTRATIVE_RULESET = {
  id: "DEMO-FEE-0.3",
  label: "Illustrative rule set v0.3 — not an official RAJUK schedule",
  effectiveFrom: "Prototype only",
  applicationFee: { PP: 5000, PP_PRIVATE_HOUSING: 5000, CP: 10000, RDC: 6000, LSP: 25000, OC: 8000, OC_APPEAL: 2000, PP_RENEWAL: 2500, APPEAL: 2000, CSN: 0 } as Record<ServiceType, number>,
  /** Placeholder Taka per square metre of total floor area, by BNBC occupancy group. */
  areaRate: { A: 40, B: 30, C: 30, D: 35, E: 60, F: 70, G: 55, H: 45, I: 65, J: 90, K: 25, L: 20, M: 40 } as Record<OccupancyKey, number>,
  /** Placeholder multipliers for larger projects. */
  slabs: [
    { upToSqm: 1000, multiplier: 1, label: "≤ 1,000 m²" },
    { upToSqm: 5000, multiplier: 1.15, label: "1,001 – 5,000 m²" },
    { upToSqm: Infinity, multiplier: 1.3, label: "> 5,000 m²" },
  ],
};

export interface FeeInput {
  type: ServiceType;
  occupancy: OccupancyKey;
  totalFloorAreaSqm: number;
}

export function calculateIllustrativeFee(input: FeeInput): FeeAssessment {
  const rs = ILLUSTRATIVE_RULESET;
  const lines: FeeLine[] = [];
  const appFee = rs.applicationFee[input.type] ?? 0;
  lines.push({ key: "application", label: "Application fee", basis: `Flat amount for ${input.type}`, amount: appFee });

  if (["CP", "RDC", "LSP", "PP", "PP_PRIVATE_HOUSING"].includes(input.type)) {
    const rate = rs.areaRate[input.occupancy];
    const slab = rs.slabs.find((s) => input.totalFloorAreaSqm <= s.upToSqm)!;
    const factor = input.type.startsWith("PP") ? 0.25 : 1;
    const areaAmount = Math.round(input.totalFloorAreaSqm * rate * slab.multiplier * factor);
    lines.push({
      key: "area",
      label: input.type.startsWith("PP") ? "Planning scrutiny charge" : "Permit fee (area-based)",
      basis: `${input.totalFloorAreaSqm.toLocaleString("en-IN")} m² × ৳${rate} (Group ${input.occupancy}) × ${slab.multiplier} slab${factor !== 1 ? ` × ${factor}` : ""}`,
      amount: areaAmount,
    });
  }

  const total = lines.reduce((s, l) => s + l.amount, 0);
  return { ruleSetId: rs.id, ruleSetLabel: rs.label, lines, total, status: "assessed" };
}
