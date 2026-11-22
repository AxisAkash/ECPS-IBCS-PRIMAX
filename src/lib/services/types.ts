/**
 * ECPS service contracts.
 *
 * UI components call these interfaces for every state-changing action. The prototype ships a mock
 * adapter (./mock) that operates on in-browser demo state. A future team implements the same
 * contracts in ./http against the .NET / DotGov REST API (see INTEGRATION_NOTES.md).
 */
import type {
  Application,
  ChecklistItemState,
  DepartmentKey,
  Inspection,
  ProfessionalRole,
  RoleKey,
  ServiceType,
  StageKey,
  Ticket,
} from "@/lib/domain/types";

export interface AuthService {
  /** Demo-only role selection. Production uses server-side authentication with MFA/OTP. */
  demoSignIn(role: RoleKey): Promise<{ userId: string; role: RoleKey }>;
  verifyOtp(code: string): Promise<boolean>;
  signOut(): Promise<void>;
}

export interface ApplicationService {
  createDraft(type: ServiceType): Promise<string>;
  saveDraft(id: string, patch: Partial<Application>): Promise<void>;
  submit(id: string): Promise<void>;
  resubmitCorrection(id: string, note: string): Promise<void>;
  inviteProfessional(id: string, userId: string, role: ProfessionalRole): Promise<void>;
  respondToInvitation(id: string, userId: string, accept: boolean, note?: string): Promise<void>;
  payFee(id: string, channel: "Card" | "Mobile banking" | "Internet banking"): Promise<void>;
  fileAppeal(id: string, grounds: string): Promise<string>;
}

export interface FileProcessingService {
  take(id: string): Promise<void>;
  forward(id: string, toStage: StageKey, toUserId: string | undefined, note: string): Promise<void>;
  routeToDepartment(id: string, dept: DepartmentKey, note: string): Promise<void>;
  requestCorrection(id: string, note: string): Promise<void>;
  setChecklistItem(id: string, item: ChecklistItemState): Promise<void>;
  addObservation(id: string, text: string, visibility: "internal" | "applicant"): Promise<void>;
  listForCommittee(id: string): Promise<void>;
  decide(id: string, decision: "approved" | "rejected", note: string): Promise<void>;
}

export interface SigningService {
  /** SIMULATED: a real implementation calls the approved signing service / dongle middleware. */
  validateCertificate(): Promise<{ serial: string; issuer: string; validTo: string; simulated: true }>;
  sign(packageId: string): Promise<void>;
}

export interface InspectionService {
  saveDraft(id: string, patch: Partial<Inspection>): Promise<void>;
  submit(id: string, outcome: Inspection["outcome"]): Promise<void>;
}

export interface HelpdeskService {
  create(t: Pick<Ticket, "category" | "subject" | "description" | "priority" | "applicationRef">): Promise<Ticket>;
  reply(id: string, text: string): Promise<void>;
  setStatus(id: string, status: Ticket["status"]): Promise<void>;
}

export interface EcpsServices {
  mode: "mock" | "http";
  auth: AuthService;
  applications: ApplicationService;
  files: FileProcessingService;
  signing: SigningService;
  inspections: InspectionService;
  helpdesk: HelpdeskService;
}
