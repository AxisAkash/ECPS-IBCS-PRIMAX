/**
 * ECPS frontend domain model.
 *
 * These types describe the shape of data the frontend needs. They are written so a future
 * .NET / DotGov REST API can map onto them through the service layer (see src/lib/services).
 * Field names are proposals — confirm against the live ECPS data dictionary before integration.
 */

export type RoleKey =
  | "applicant"
  | "professional"
  | "officer"
  | "inspector"
  | "committee"
  | "estate"
  | "finance"
  | "management"
  | "admin"
  | "support";

export type Workspace = "public" | "workspace" | "rajuk";

export interface User {
  id: string;
  name: string;
  nameBn?: string;
  role: RoleKey;
  designation: string;
  department: DepartmentKey | "External";
  zone?: string;
  email: string;
  mobile: string;
  /** Professional body membership (illustrative, fictional numbers). */
  membership?: { body: "IAB" | "IEB" | "BIP" | "IDEB"; number: string; verified: boolean };
  discipline?: ProfessionalRole;
  employeeId?: string;
  status: "active" | "suspended" | "pending";
  lastActiveAt?: string;
}

export type DepartmentKey =
  | "development_control"
  | "town_planning"
  | "law"
  | "estate"
  | "finance"
  | "management"
  | "ict"
  | "committee";

export type ServiceType =
  | "PP"
  | "PP_PRIVATE_HOUSING"
  | "CP"
  | "RDC"
  | "LSP"
  | "OC"
  | "OC_APPEAL"
  | "PP_RENEWAL"
  | "APPEAL"
  | "CSN";

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "correction_requested"
  | "committee"
  | "signing"
  | "fee_pending"
  | "approved"
  | "rejected"
  | "appealed";

export type StageKey =
  | "draft"
  | "front_desk"
  | "building_inspector"
  | "chief_building_inspector"
  | "assistant_authorized_officer"
  | "authorized_officer"
  | "deputy_town_planner"
  | "town_planner"
  | "chief_town_planner"
  | "department_review"
  | "bc_committee"
  | "signing"
  | "fee_and_drawings"
  | "issued"
  | "closed";

export type ProfessionalRole = "architect" | "structural" | "electrical" | "plumbing" | "supervisor";

export interface ProfessionalParticipation {
  userId: string;
  role: ProfessionalRole;
  status: "invited" | "accepted" | "declined" | "replaced";
  invitedAt: string;
  respondedAt?: string;
  note?: string;
}

export type DocumentCategory =
  | "nid"
  | "tax_return"
  | "photo"
  | "ownership"
  | "drawing"
  | "certificate"
  | "plot_photo"
  | "road_photo"
  | "professional"
  | "noc"
  | "letter";

export interface DocumentRecord {
  id: string;
  name: string;
  category: DocumentCategory;
  /** Owner index when the document belongs to one of several applicants (TOR 2.9). */
  ownerIndex?: number;
  sizeKb: number;
  pages?: number;
  version: number;
  uploadedAt: string;
  uploadedBy: string;
  status: "uploaded" | "verified" | "rejected" | "superseded";
  /** Fictional sample — the prototype never stores real files. */
  sample: true;
  previewKind: "drawing" | "document" | "photo";
  drawingSheet?: DrawingSheetKind;
}

export type DrawingSheetKind = "site" | "ground" | "typical" | "elevation" | "section" | "far";

export interface PropertyInfo {
  zone: string;
  subZone: string;
  block?: string;
  area: string;
  mouza: string;
  rsDag: string;
  csDag?: string;
  plotNo?: string;
  plotAreaSqm: number;
  roadWidthM: number;
  address: string;
  housingProjectId?: string;
  ownershipType: "freehold" | "rajuk_lease" | "private_housing";
}

export interface LocationInfo {
  lat: number;
  lng: number;
  dapLandUse: string;
  confirmedOnMap: boolean;
}

export interface BuildingInfo {
  occupancy: OccupancyKey;
  storeys: number;
  basements: number;
  totalFloorAreaSqm: number;
  groundCoverageSqm: number;
  units: number;
  heightM: number;
  setbacks: { front: number; rear: number; left: number; right: number };
}

/** BNBC 2020 occupancy groups (A–M). */
export type OccupancyKey = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M";

export interface WorkflowEvent {
  id: string;
  at: string;
  actorId: string;
  action:
    | "created"
    | "submitted"
    | "received"
    | "assigned"
    | "forwarded"
    | "routed"
    | "returned"
    | "correction_requested"
    | "resubmitted"
    | "checklist_completed"
    | "observation"
    | "committee_listed"
    | "committee_decision"
    | "signed"
    | "fee_requested"
    | "payment_received"
    | "approved"
    | "rejected"
    | "inspection"
    | "noc_uploaded"
    | "revert_requested"
    | "reverted"
    | "appeal_filed";
  fromStage?: StageKey;
  toStage?: StageKey;
  toUserId?: string;
  note?: string;
  /** Marks actions performed through a simulated control (MFA, signing). */
  simulated?: boolean;
}

export interface Observation {
  id: string;
  at: string;
  authorId: string;
  visibility: "internal" | "applicant";
  text: string;
  stage: StageKey;
}

export interface ChecklistItemState {
  id: string;
  result: "pass" | "fail" | "na" | null;
  note?: string;
}

export interface FeeLine {
  key: string;
  label: string;
  basis: string;
  amount: number;
}

export interface FeeAssessment {
  ruleSetId: string;
  ruleSetLabel: string;
  lines: FeeLine[];
  total: number;
  status: "not_assessed" | "assessed" | "requested" | "paid";
  requestedAt?: string;
  paidAt?: string;
  transactionId?: string;
}

export interface Application {
  id: string;
  ref: string;
  type: ServiceType;
  title: string;
  applicantId: string;
  owners: Array<{ name: string; relation: string }>;
  professionals: ProfessionalParticipation[];
  property: PropertyInfo;
  location?: LocationInfo;
  building?: BuildingInfo;
  documents: DocumentRecord[];
  status: ApplicationStatus;
  stage: StageKey;
  holderId?: string;
  department?: DepartmentKey;
  stageEnteredAt: string;
  createdAt: string;
  submittedAt?: string;
  decidedAt?: string;
  priority: "normal" | "high";
  presentations: number;
  history: WorkflowEvent[];
  observations: Observation[];
  checklist: Record<string, ChecklistItemState>;
  fee?: FeeAssessment;
  draftStep?: number;
  linkedApplicationId?: string;
  permitNo?: string;
  correctionNote?: string;
  /** Records migrated from the legacy "Construction Permit (CP) system" (TOR 2.11). */
  legacy?: boolean;
}

export interface SignatureRecord {
  id: string;
  signerId: string;
  signedAt: string;
  certificateSerial: string;
  pages: number[];
  slot: number;
  simulated: true;
}

export interface SigningPackage {
  id: string;
  applicationId: string;
  title: string;
  version: number;
  versions: Array<{ version: number; label: string; createdAt: string; status: "approved" | "superseded" | "draft" }>;
  sheets: Array<{ page: number; kind: DrawingSheetKind; title: string; signable: boolean }>;
  signatures: SignatureRecord[];
  status: "awaiting" | "signed";
  requiredSignerIds: string[];
  audit: Array<{ at: string; actorId: string; text: string; simulated?: boolean }>;
}

export interface CommitteeMeeting {
  id: string;
  title: string;
  committee: "BC_REGULAR" | "BC_LSP";
  date: string;
  venue: string;
  memberIds: string[];
  status: "scheduled" | "in_session" | "concluded";
  items: CommitteeItem[];
}

export interface CommitteeItem {
  id: string;
  applicationId: string;
  presentation: 1 | 2;
  votes: Array<{ memberId: string; vote: "approve" | "correction" | "reject"; at: string; remark?: string }>;
  decision?: "approved" | "correction" | "rejected";
  decidedAt?: string;
  minutesNote?: string;
}

export interface Inspection {
  id: string;
  applicationId: string;
  kind: "construction_start" | "plinth" | "frcm_monitoring" | "occupancy" | "complaint";
  scheduledFor: string;
  inspectorId: string;
  status: "assigned" | "draft" | "submitted";
  checklist: Record<string, ChecklistItemState>;
  observations: string;
  photos: Array<{ id: string; caption: string; takenAt: string; sample: true; dataUrl?: string }>;
  gps?: { lat: number; lng: number; accuracyM: number; capturedAt: string; simulated: boolean };
  submittedAt?: string;
  outcome?: "compliant" | "minor_deviation" | "major_deviation";
}

export interface Payment {
  id: string;
  applicationId?: string;
  applicationRef: string;
  zone: string;
  category: "application_fee" | "permit_fee" | "renewal_fee" | "appeal_fee" | "oc_fee";
  amount: number;
  status: "pending" | "paid" | "failed" | "refunded";
  channel: "Card" | "Mobile banking" | "Internet banking" | "—";
  gatewayRef?: string;
  paidAt?: string;
  createdAt: string;
  reconciled: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  at: string;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  kind: "action" | "info" | "success" | "warning";
}

export interface AuditEntry {
  id: string;
  at: string;
  actorId: string;
  action: string;
  target: string;
  detail?: string;
  ip?: string;
  severity: "info" | "notice" | "warning";
}

export interface Ticket {
  id: string;
  ref: string;
  raisedBy: string;
  category: "account" | "application" | "payment" | "signature" | "technical" | "other";
  subject: string;
  description: string;
  status: "open" | "in_progress" | "awaiting_user" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
  assigneeId?: string;
  applicationRef?: string;
  thread: Array<{ at: string; authorId: string; text: string }>;
}

export interface PublicPermit {
  permitNo: string;
  type: "PP" | "CP";
  approvedOn: string;
  validUntil?: string;
  owners: string[];
  area: string;
  zone: string;
  mouza: string;
  plotRef: string;
  landUse: string;
  occupancy: OccupancyKey;
  floorLimit: string;
  units: number;
  setbacks: { front: number; rear: number; left: number; right: number };
  status: "valid" | "expired" | "revoked";
  verificationCode: string;
}

export interface Integration {
  key: string;
  name: string;
  owner: string;
  purpose: string;
  torRef: string;
  direction: "inbound" | "outbound" | "bidirectional";
  /** Status in the live ECPS per TOR; the prototype always uses a mock adapter. */
  state: "existing_upgrade" | "new_required" | "conditional";
  lastCheckAt?: string;
  lastCheckResult?: "ok" | "degraded" | "unreachable";
}

export interface MigrationBatch {
  id: string;
  label: string;
  sourceRange: string;
  records: number;
  migrated: number;
  failed: number;
  status: "queued" | "validating" | "reconciled" | "exceptions";
  startedAt?: string;
}

export interface RevertRequest {
  id: string;
  applicationId: string;
  fromState: "on_process" | "archive" | "approved" | "rejected";
  toStage: StageKey;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  status: "pending" | "approved" | "declined";
  decidedBy?: string;
  decidedAt?: string;
}

export interface TwoCFile {
  id: string;
  fileNo: string;
  subject: string;
  premises: string;
  openedOn: string;
  status: "open" | "notice_issued" | "hearing" | "closed";
  custodianId: string;
  documents: Array<{ name: string; addedOn: string }>;
  movements: Array<{ at: string; fromId: string; toId: string; note: string }>;
}

export interface NocRecord {
  id: string;
  applicationId: string;
  issuedOn: string;
  issuedBy: string;
  memoNo: string;
  status: "uploaded" | "verified";
}

export interface SystemNotice {
  id: string;
  title: string;
  titleBn?: string;
  body: string;
  bodyBn?: string;
  kind: "maintenance" | "regulatory" | "general";
  publishedAt: string;
  visibleOnPortal: boolean;
}

export interface SchedulerJob {
  id: string;
  name: string;
  cron: string;
  description: string;
  enabled: boolean;
  lastRunAt?: string;
  lastResult?: "success" | "failed";
}

export interface SecuritySettings {
  idleTimeoutMinutes: number;
  warnBeforeSeconds: number;
  mfaOnApproval: boolean;
  otpForUntrustedDevice: boolean;
  forcePasswordChangeOnFirstLogin: boolean;
  password: { minLength: number; expiryDays: number; history: number; requireSymbols: boolean };
  maxFailedAttempts: number;
}

export interface FarRow {
  id: string;
  plotFromSqm: number;
  plotToSqm: number;
  roadWidthMinM: number;
  far: number;
  maxGroundCoveragePct: number;
}

export interface DapZone {
  id: string;
  code: string;
  label: string;
  permittedOccupancies: OccupancyKey[];
  notes: string;
}
