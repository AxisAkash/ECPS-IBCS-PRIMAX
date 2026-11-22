import { workingDaysBetween } from "@/lib/utils";
import type { Application, ApplicationStatus, DepartmentKey, ServiceType, StageKey } from "./types";

/**
 * ILLUSTRATIVE workflow definitions.
 *
 * The TOR requires routing improvements (1.3, 1.4), sub-zone/block routing from the Front Desk to the
 * Authorized Officer, Assistant Authorized Officer, Chief Building Inspector and Building Inspector
 * (1.4), PP stages up to TP and CTP (1.10), and BC Committee processing (1.4, 1.13).
 * The exact sequences below are proposals for the prototype and must be confirmed with RAJUK.
 */
export const STAGE_LABEL: Record<StageKey, string> = {
  draft: "Draft",
  front_desk: "Front Desk",
  building_inspector: "Building Inspector",
  chief_building_inspector: "Chief Building Inspector",
  assistant_authorized_officer: "Assistant Authorized Officer",
  authorized_officer: "Authorized Officer",
  deputy_town_planner: "Deputy Town Planner",
  town_planner: "Town Planner",
  chief_town_planner: "Chief Town Planner",
  department_review: "Department review",
  bc_committee: "BC Committee",
  signing: "Approval signing",
  fee_and_drawings: "Fees & service drawings",
  issued: "Issued",
  closed: "Closed",
};

export const STAGE_SHORT: Record<StageKey, string> = {
  draft: "Draft",
  front_desk: "FD",
  building_inspector: "BI",
  chief_building_inspector: "CBI",
  assistant_authorized_officer: "AAO",
  authorized_officer: "AO",
  deputy_town_planner: "DTP",
  town_planner: "TP",
  chief_town_planner: "CTP",
  department_review: "Dept",
  bc_committee: "BCC",
  signing: "Sign",
  fee_and_drawings: "Fee",
  issued: "Issued",
  closed: "Closed",
};

const CP_FLOW: StageKey[] = [
  "front_desk",
  "building_inspector",
  "chief_building_inspector",
  "assistant_authorized_officer",
  "authorized_officer",
  "bc_committee",
  "signing",
  "fee_and_drawings",
  "issued",
];

const PP_FLOW: StageKey[] = [
  "front_desk",
  "deputy_town_planner",
  "town_planner",
  "chief_town_planner",
  "signing",
  "issued",
];

const SIMPLE_FLOW: StageKey[] = [
  "front_desk",
  "building_inspector",
  "assistant_authorized_officer",
  "authorized_officer",
  "signing",
  "issued",
];

export function flowFor(type: ServiceType): StageKey[] {
  switch (type) {
    case "PP":
    case "PP_PRIVATE_HOUSING":
    case "PP_RENEWAL":
      return PP_FLOW;
    case "CP":
    case "RDC":
    case "LSP":
      return CP_FLOW;
    default:
      return SIMPLE_FLOW;
  }
}

export function nextStage(app: Pick<Application, "type" | "stage">): StageKey | undefined {
  const flow = flowFor(app.type);
  const i = flow.indexOf(app.stage);
  if (i < 0) return flow[0];
  return flow[i + 1];
}

export function stageProgress(app: Pick<Application, "type" | "stage" | "status">): number {
  if (app.status === "draft") return 0;
  if (app.status === "approved" || app.stage === "issued") return 1;
  const flow = flowFor(app.type);
  const i = flow.indexOf(app.stage === "department_review" ? "front_desk" : app.stage);
  return Math.max(0.05, (i + 0.5) / flow.length);
}

export const DEPARTMENT_LABEL: Record<DepartmentKey, string> = {
  development_control: "Development Control",
  town_planning: "Town Planning",
  law: "Law",
  estate: "Estate",
  finance: "Finance",
  management: "Management",
  ict: "ICT / System",
  committee: "Committees",
};

/** Departments to which a file may be routed for an opinion (TOR 1.3 / 1.4). */
export const ROUTABLE_DEPARTMENTS: DepartmentKey[] = ["town_planning", "law", "estate", "management"];

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "Under review",
  correction_requested: "Correction requested",
  committee: "At committee",
  signing: "Awaiting signature",
  fee_pending: "Fee payment due",
  approved: "Approved",
  rejected: "Rejected",
  appealed: "Under appeal",
};

export type Tone = "neutral" | "info" | "progress" | "warning" | "danger" | "success" | "accent";

export const STATUS_TONE: Record<ApplicationStatus, Tone> = {
  draft: "neutral",
  submitted: "info",
  in_review: "progress",
  correction_requested: "warning",
  committee: "accent",
  signing: "accent",
  fee_pending: "warning",
  approved: "success",
  rejected: "danger",
  appealed: "info",
};

/** Default holding limits in working days per stage (illustrative; configurable in Admin → Workflow). */
export const DEFAULT_HOLDING_LIMITS: Partial<Record<StageKey, number>> = {
  front_desk: 2,
  building_inspector: 5,
  chief_building_inspector: 3,
  assistant_authorized_officer: 3,
  authorized_officer: 3,
  deputy_town_planner: 5,
  town_planner: 4,
  chief_town_planner: 3,
  department_review: 7,
  bc_committee: 15,
  signing: 2,
  fee_and_drawings: 30,
};

export type HoldingState = "ok" | "approaching" | "exceeded";

export function holdingInfo(
  app: Pick<Application, "stage" | "stageEnteredAt" | "status">,
  limits: Partial<Record<StageKey, number>> = DEFAULT_HOLDING_LIMITS,
  now = Date.now(),
): { days: number; limit?: number; state: HoldingState } {
  const days = workingDaysBetween(app.stageEnteredAt, now);
  const limit = limits[app.stage];
  if (!limit || ["approved", "rejected", "draft"].includes(app.status)) return { days, limit, state: "ok" };
  if (days > limit) return { days, limit, state: "exceeded" };
  if (days >= limit - 1) return { days, limit, state: "approaching" };
  return { days, limit, state: "ok" };
}

/** Next action description for officer tables. */
export function nextActionFor(app: Application): string {
  switch (app.status) {
    case "submitted":
      return "Scrutinise & assign";
    case "correction_requested":
      return "Awaiting applicant";
    case "committee":
      return "Committee decision";
    case "signing":
      return "Sign approval documents";
    case "fee_pending":
      return "Awaiting fee payment";
    case "approved":
      return "—";
    case "rejected":
      return "—";
    default:
      switch (app.stage) {
        case "building_inspector":
          return "Site & drawing review";
        case "chief_building_inspector":
          return "Verify inspection report";
        case "assistant_authorized_officer":
          return "Recommend decision";
        case "authorized_officer":
          return "Decide / list for BCC";
        case "department_review":
          return "Department opinion";
        case "deputy_town_planner":
          return "Planning scrutiny";
        case "town_planner":
          return "TP recommendation";
        case "chief_town_planner":
          return "CTP decision";
        default:
          return "Review";
      }
  }
}
