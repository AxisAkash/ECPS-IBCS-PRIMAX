"use client";

/**
 * Demonstration state store.
 *
 * Holds all fictional records for the prototype and persists them to localStorage so a presenter can
 * move between roles and refresh the page without losing progress. "Reset demo" restores the seed.
 * In a production build this store is replaced by server state fetched through src/lib/services.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createSeed, DEMO_PERSONAS, type DemoSeed } from "@/lib/data/seed";
import { calculateIllustrativeFee } from "@/lib/domain/fees";
import { roleMeta } from "@/lib/domain/roles";
import type {
  Application,
  ChecklistItemState,
  DepartmentKey,
  DocumentRecord,
  Inspection,
  Notification,
  ProfessionalRole,
  RoleKey,
  SecuritySettings,
  ServiceType,
  SigningPackage,
  StageKey,
  Ticket,
  WorkflowEvent,
  FarRow,
} from "@/lib/domain/types";
import { DEPARTMENT_LABEL, nextStage, STAGE_LABEL } from "@/lib/domain/workflow";
import { SERVICE_SHORT_LABEL } from "@/lib/domain/catalog";
import { pad, uid } from "@/lib/utils";

export interface Session {
  role: RoleKey;
  userId: string;
  signedInAt: string;
  /** Set when the user completes the simulated MFA challenge for approvals. */
  mfaVerifiedAt?: string;
}

interface DemoState extends DemoSeed {
  hydrated: boolean;
  session?: Session;
}

interface DemoActions {
  // session
  signInAs: (role: RoleKey) => Session;
  signOut: () => void;
  markMfaVerified: () => void;
  resetDemo: () => void;

  // applicant
  createDraft: (type: ServiceType) => string;
  updateApplication: (id: string, patch: Partial<Application>) => void;
  addDocument: (appId: string, doc: Omit<DocumentRecord, "id" | "uploadedAt" | "uploadedBy" | "sample" | "version" | "status">) => void;
  removeDocument: (appId: string, docId: string) => void;
  inviteProfessional: (appId: string, userId: string, role: ProfessionalRole) => void;
  replaceProfessional: (appId: string, oldUserId: string, newUserId: string) => void;
  respondInvitation: (appId: string, userId: string, accept: boolean, note?: string) => void;
  submitApplication: (id: string) => void;
  resubmitCorrection: (id: string, note: string) => void;
  payFee: (appId: string, channel: "Card" | "Mobile banking" | "Internet banking") => void;
  fileAppeal: (appId: string, grounds: string) => string;

  // officer
  takeFile: (appId: string) => void;
  forwardFile: (appId: string, toStage: StageKey, toUserId: string | undefined, note: string) => void;
  routeToDepartment: (appId: string, dept: DepartmentKey, note: string) => void;
  requestCorrection: (appId: string, note: string) => void;
  setChecklistItem: (appId: string, item: ChecklistItemState) => void;
  addObservation: (appId: string, text: string, visibility: "internal" | "applicant") => void;
  listForCommittee: (appId: string) => void;
  decideFile: (appId: string, decision: "approved" | "rejected", note: string) => void;

  // signing
  signPackage: (pkgId: string) => void;

  // committee
  castVote: (meetingId: string, itemId: string, vote: "approve" | "correction" | "reject", remark?: string) => void;
  concludeItem: (meetingId: string, itemId: string, opts: { autoSign: boolean }) => void;

  // inspections
  updateInspection: (id: string, patch: Partial<Inspection>) => void;
  setInspectionChecklist: (id: string, item: ChecklistItemState) => void;
  submitInspection: (id: string, outcome: Inspection["outcome"]) => void;

  // notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // helpdesk
  createTicket: (t: Pick<Ticket, "category" | "subject" | "description" | "priority" | "applicationRef">) => Ticket;
  replyTicket: (id: string, text: string) => void;
  setTicketStatus: (id: string, status: Ticket["status"]) => void;
  assignTicket: (id: string, assigneeId: string) => void;

  // admin
  updateSecurity: (patch: Partial<SecuritySettings>) => void;
  setHoldingLimit: (stage: StageKey, days: number) => void;
  setUserStatus: (userId: string, status: "active" | "suspended") => void;
  mergeDuplicateUser: (dupId: string) => void;
  toggleJob: (id: string) => void;
  runJob: (id: string) => void;
  updateFarRow: (id: string, patch: Partial<FarRow>) => void;
  toggleNotice: (id: string) => void;
  publishNotice: (title: string, body: string, kind: "maintenance" | "regulatory" | "general") => void;

  // other sections
  requestRevert: (appId: string, fromState: "on_process" | "archive" | "approved" | "rejected", reason: string) => void;
  decideRevert: (id: string, approve: boolean) => void;
  uploadNoc: (appId: string, memoNo: string) => void;
  runIntegrationCheck: (key: string) => void;
  reconcilePayment: (id: string) => void;
  advanceMigration: (id: string) => void;
  moveTwoC: (id: string, toId: string, note: string) => void;
}

export type DemoStore = DemoState & DemoActions;

const STORAGE_KEY = "ecps-demo-state-v1";

function event(actorId: string, action: WorkflowEvent["action"], extra: Partial<WorkflowEvent> = {}): WorkflowEvent {
  return { id: uid("ev"), at: new Date().toISOString(), actorId, action, ...extra };
}

export const useDemoStore = create<DemoStore>()(
  persist(
    (set, get) => {
      const me = () => get().session?.userId ?? "system";

      const patchApp = (id: string, fn: (a: Application) => Application) =>
        set((s) => ({ applications: s.applications.map((a) => (a.id === id ? fn(a) : a)) }));

      const notify = (userId: string, n: Omit<Notification, "id" | "userId" | "at" | "read">) =>
        set((s) => ({
          notifications: [{ id: uid("n"), userId, at: new Date().toISOString(), read: false, ...n }, ...s.notifications],
        }));

      const audit = (action: string, target: string, detail?: string, severity: "info" | "notice" | "warning" = "info") =>
        set((s) => ({
          audit: [
            { id: uid("au"), at: new Date().toISOString(), actorId: me(), action, target, detail, severity, ip: "10.20.0.15 (demo)" },
            ...s.audit,
          ],
        }));

      const app = (id: string) => get().applications.find((a) => a.id === id);

      return {
        ...createSeed(),
        hydrated: false,
        session: undefined,

        signInAs: (role) => {
          const session: Session = { role, userId: DEMO_PERSONAS[role], signedInAt: new Date().toISOString() };
          set({ session });
          audit("auth.demo_sign_in", roleMeta(role).label, "Demo role selector (no credentials)", "notice");
          return session;
        },
        signOut: () => set({ session: undefined }),
        markMfaVerified: () => set((s) => (s.session ? { session: { ...s.session, mfaVerifiedAt: new Date().toISOString() } } : {})),
        resetDemo: () => {
          const session = get().session;
          set({ ...createSeed(), hydrated: true, session });
        },

        createDraft: (type) => {
          const counter = get().counters.application + 1;
          const id = `a-${counter}`;
          const now = new Date().toISOString();
          const draft: Application = {
            id,
            ref: `DRAFT-${pad(counter, 5)}`,
            type,
            title: `New ${SERVICE_SHORT_LABEL[type]} application`,
            applicantId: me(),
            owners: [{ name: get().users.find((u) => u.id === me())?.name ?? "Applicant", relation: "Principal owner" }],
            professionals: [],
            property: { zone: "Zone 4", subZone: "", area: "", mouza: "", rsDag: "", plotAreaSqm: 0, roadWidthM: 0, address: "", ownershipType: type === "PP_PRIVATE_HOUSING" ? "private_housing" : "freehold" },
            documents: [],
            status: "draft",
            stage: "draft",
            stageEnteredAt: now,
            createdAt: now,
            priority: "normal",
            presentations: 0,
            history: [event(me(), "created")],
            observations: [],
            checklist: {},
            draftStep: 0,
          };
          set((s) => ({ applications: [draft, ...s.applications], counters: { ...s.counters, application: counter } }));
          return id;
        },

        updateApplication: (id, patch) => patchApp(id, (a) => ({ ...a, ...patch })),

        addDocument: (appId, doc) =>
          patchApp(appId, (a) => {
            const prior = a.documents.filter((d) => d.category === doc.category && d.ownerIndex === doc.ownerIndex && d.drawingSheet === doc.drawingSheet && d.status !== "superseded");
            const replaced = ["plot_photo", "road_photo"].includes(doc.category) || doc.category === "drawing";
            const version = replaced && prior.length ? Math.max(...prior.map((p) => p.version)) + 1 : 1;
            return {
              ...a,
              documents: [
                ...a.documents.map((d) => (replaced && prior.includes(d) ? { ...d, status: "superseded" as const } : d)),
                { ...doc, id: uid("doc"), uploadedAt: new Date().toISOString(), uploadedBy: me(), sample: true, version, status: "uploaded" },
              ],
            };
          }),

        removeDocument: (appId, docId) => patchApp(appId, (a) => ({ ...a, documents: a.documents.filter((d) => d.id !== docId) })),

        inviteProfessional: (appId, userId, role) => {
          patchApp(appId, (a) => ({
            ...a,
            professionals: [...a.professionals.filter((p) => p.role !== role || p.status === "declined"), { userId, role, status: "invited", invitedAt: new Date().toISOString() }],
          }));
          const a = app(appId)!;
          notify(userId, { title: "New invitation", body: `${get().users.find((u) => u.id === me())?.name} invited you to participate in "${a.title}".`, kind: "action", href: "/workspace/invitations" });
          audit("professional.invite", a.ref, `Invited ${userId} as ${role}`);
        },

        replaceProfessional: (appId, oldUserId, newUserId) => {
          const a = app(appId)!;
          const old = a.professionals.find((p) => p.userId === oldUserId)!;
          patchApp(appId, (x) => ({
            ...x,
            professionals: [
              ...x.professionals.map((p) => (p.userId === oldUserId ? { ...p, status: "replaced" as const } : p)),
              { userId: newUserId, role: old.role, status: "invited", invitedAt: new Date().toISOString(), note: `Replaces ${oldUserId}` },
            ],
          }));
          notify(newUserId, { title: "Replacement invitation", body: `You are invited to replace a ${old.role} on "${a.title}".`, kind: "action", href: "/workspace/invitations" });
          audit("professional.replace", a.ref, `${oldUserId} → ${newUserId}`, "notice");
        },

        respondInvitation: (appId, userId, accept, note) => {
          patchApp(appId, (a) => ({
            ...a,
            professionals: a.professionals.map((p) =>
              p.userId === userId && p.status === "invited" ? { ...p, status: accept ? "accepted" : "declined", respondedAt: new Date().toISOString(), note } : p,
            ),
          }));
          const a = app(appId)!;
          const who = get().users.find((u) => u.id === userId)?.name;
          notify(a.applicantId, {
            title: accept ? "Invitation accepted" : "Invitation declined",
            body: `${who} ${accept ? "accepted" : "declined"} your invitation for "${a.title}".${note ? ` Note: ${note}` : ""}`,
            kind: accept ? "success" : "warning",
            href: `/workspace/applications/${a.id}`,
          });
          audit("professional.respond", a.ref, accept ? "accepted" : "declined");
        },

        submitApplication: (id) => {
          const a = app(id)!;
          const z = a.property.zone.replace("Zone ", "Z");
          const short = a.type === "PP_PRIVATE_HOUSING" ? "PPH" : a.type;
          const ref = `${short}-26-${z}-${pad(1400 + get().counters.application * 7, 5)}`;
          const now = new Date().toISOString();
          const fee = a.building ? calculateIllustrativeFee({ type: a.type, occupancy: a.building.occupancy, totalFloorAreaSqm: a.building.totalFloorAreaSqm }) : undefined;
          patchApp(id, (x) => ({
            ...x,
            ref,
            status: "submitted",
            stage: "front_desk",
            holderId: undefined,
            submittedAt: now,
            stageEnteredAt: now,
            draftStep: undefined,
            fee: fee ? { ...fee, status: "paid", paidAt: now, transactionId: `SSLCZ-DEMO-${uid("tx").slice(-6).toUpperCase()}` } : x.fee,
            history: [...x.history, event(me(), "submitted", { toStage: "front_desk", note: "Submitted by applicant. Application fee paid (simulated)." , simulated: true})],
          }));
          set((s) => ({
            payments: [
              { id: uid("p"), applicationId: id, applicationRef: ref, zone: a.property.zone, category: "application_fee", amount: fee?.lines[0]?.amount ?? 0, status: "paid", channel: "Mobile banking", gatewayRef: `SSLCZ-DEMO-${uid("g").slice(-6).toUpperCase()}`, paidAt: now, createdAt: now, reconciled: false },
              ...s.payments,
            ],
          }));
          notify("u-off-01", { title: "New application received", body: `${ref} — ${a.title} arrived at Front Desk, ${a.property.zone}.`, kind: "info", href: `/rajuk/files/${id}` });
          notify(a.applicantId, { title: "Application submitted", body: `${ref} was submitted and received at the Front Desk.`, kind: "success", href: `/workspace/applications/${id}` });
          audit("application.submit", ref, a.title);
        },

        resubmitCorrection: (id, note) => {
          const a = app(id)!;
          patchApp(id, (x) => ({
            ...x,
            status: "in_review",
            correctionNote: undefined,
            stageEnteredAt: new Date().toISOString(),
            history: [...x.history, event(me(), "resubmitted", { note })],
          }));
          if (a.holderId) notify(a.holderId, { title: "Correction resubmitted", body: `${a.ref}: applicant uploaded the requested correction.`, kind: "action", href: `/rajuk/files/${id}` });
          audit("application.resubmit", a.ref, note);
        },

        payFee: (appId, channel) => {
          const a = app(appId)!;
          const now = new Date().toISOString();
          const permitNo = a.ref.replace(/^(CP|PP|PPH|RDC|LSP)-/, (m) => m).replace("-Z", "-Z");
          set((s) => ({
            payments: s.payments.map((p) => (p.applicationId === appId && p.status === "pending" ? { ...p, status: "paid", channel, paidAt: now, gatewayRef: `SSLCZ-DEMO-${uid("g").slice(-6).toUpperCase()}` } : p)),
          }));
          patchApp(appId, (x) => ({
            ...x,
            status: "approved",
            stage: "issued",
            decidedAt: now,
            permitNo,
            stageEnteredAt: now,
            fee: x.fee ? { ...x.fee, status: "paid", paidAt: now } : x.fee,
            history: [...x.history, event(me(), "payment_received", { note: `Permit fee paid via ${channel} (simulated gateway).`, simulated: true }), event("system", "approved", { note: `Permit ${permitNo} issued and queued for Public Register.` })],
          }));
          const b = a.building;
          if (a.type === "CP" || a.type === "PP") {
            set((s) => ({
              issuedPermits: [
                {
                  permitNo,
                  type: a.type as "CP" | "PP",
                  approvedOn: now,
                  validUntil: new Date(Date.now() + 3 * 365 * 86400000).toISOString(),
                  owners: a.owners.map((o) => o.name),
                  area: a.property.area,
                  zone: a.property.zone,
                  mouza: a.property.mouza,
                  plotRef: `RS Dag ${a.property.rsDag}`,
                  landUse: a.location?.dapLandUse.replace(" zone", "").replace(" (urban)", "") ?? "Residential",
                  occupancy: b?.occupancy === "E" ? "E" : "A",
                  floorLimit: `${b?.basements ? `B${b.basements}+` : ""}G+${(b?.storeys ?? 1) - 1}`,
                  units: b?.units ?? 0,
                  setbacks: b?.setbacks ?? { front: 0, rear: 0, left: 0, right: 0 },
                  status: "valid",
                  verificationCode: `V${permitNo.replace(/[^0-9]/g, "").slice(-6)}D`,
                },
                ...s.issuedPermits,
              ],
            }));
          }
          notify(a.applicantId, { title: "Permit issued", body: `${permitNo} is issued. A public summary is now in the Public Register.`, kind: "success", href: `/workspace/applications/${appId}` });
          notify("u-fin-01", { title: "Payment received", body: `${a.ref} permit fee received via ${channel}.`, kind: "info", href: "/rajuk/finance" });
          audit("payment.received", a.ref, `${channel} (simulated)`);
        },

        fileAppeal: (appId, grounds) => {
          const a = app(appId)!;
          const counter = get().counters.application + 1;
          const id = `a-${counter}`;
          const now = new Date().toISOString();
          const type: ServiceType = a.type === "OC" ? "OC_APPEAL" : "APPEAL";
          const ref = `${type === "OC_APPEAL" ? "OCA" : "APL"}-26-${a.property.zone.replace("Zone ", "Z")}-${pad(1400 + counter * 7, 5)}`;
          const appeal: Application = {
            ...a,
            id,
            ref,
            type,
            title: `Appeal against decision on ${a.ref}`,
            status: "submitted",
            stage: "front_desk",
            holderId: undefined,
            createdAt: now,
            submittedAt: now,
            stageEnteredAt: now,
            decidedAt: undefined,
            linkedApplicationId: a.id,
            documents: [],
            observations: [],
            checklist: {},
            history: [event(me(), "appeal_filed", { note: grounds })],
            fee: undefined,
          };
          set((s) => ({ applications: [appeal, ...s.applications], counters: { ...s.counters, application: counter } }));
          patchApp(appId, (x) => ({ ...x, status: "appealed", history: [...x.history, event(me(), "appeal_filed", { note: `Appeal ${ref} filed.` })] }));
          audit("appeal.file", ref, grounds);
          return id;
        },

        takeFile: (appId) => {
          const a = app(appId)!;
          patchApp(appId, (x) => ({
            ...x,
            holderId: me(),
            status: x.status === "submitted" ? "in_review" : x.status,
            history: [...x.history, event(me(), "assigned", { toUserId: me(), note: "File taken into own tray." })],
          }));
          audit("file.take", a.ref);
        },

        forwardFile: (appId, toStage, toUserId, note) => {
          const a = app(appId)!;
          const now = new Date().toISOString();
          patchApp(appId, (x) => ({
            ...x,
            stage: toStage,
            holderId: toUserId,
            department: undefined,
            status: toStage === "bc_committee" ? "committee" : toStage === "signing" ? "signing" : "in_review",
            stageEnteredAt: now,
            history: [...x.history, event(me(), "forwarded", { fromStage: x.stage, toStage, toUserId, note })],
          }));
          if (toUserId) notify(toUserId, { title: "File received", body: `${a.ref} forwarded to you (${STAGE_LABEL[toStage]}).`, kind: "info", href: `/rajuk/files/${appId}` });
          notify(a.applicantId, { title: "Application progressed", body: `${a.ref} moved to ${STAGE_LABEL[toStage]}.`, kind: "info", href: `/workspace/applications/${appId}` });
          audit("file.forward", a.ref, `${STAGE_LABEL[a.stage]} → ${STAGE_LABEL[toStage]}`);
        },

        routeToDepartment: (appId, dept, note) => {
          const a = app(appId)!;
          const holder = dept === "estate" ? "u-est-01" : dept === "town_planning" ? "u-tp-01" : undefined;
          patchApp(appId, (x) => ({
            ...x,
            department: dept,
            stage: "department_review",
            holderId: holder,
            stageEnteredAt: new Date().toISOString(),
            history: [...x.history, event(me(), "routed", { fromStage: x.stage, toStage: "department_review", note: `Routed to ${DEPARTMENT_LABEL[dept]}: ${note}` })],
          }));
          if (holder) notify(holder, { title: "File routed for opinion", body: `${a.ref} routed to ${DEPARTMENT_LABEL[dept]}.`, kind: "action", href: dept === "estate" ? "/rajuk/estate" : `/rajuk/files/${appId}` });
          audit("file.route", a.ref, DEPARTMENT_LABEL[dept]);
        },

        requestCorrection: (appId, note) => {
          const a = app(appId)!;
          patchApp(appId, (x) => ({
            ...x,
            status: "correction_requested",
            correctionNote: note,
            history: [...x.history, event(me(), "correction_requested", { note })],
          }));
          notify(a.applicantId, { title: "Correction requested", body: `${a.ref}: ${note}`, kind: "warning", href: `/workspace/applications/${appId}` });
          audit("file.correction", a.ref, note);
        },

        setChecklistItem: (appId, item) => patchApp(appId, (x) => ({ ...x, checklist: { ...x.checklist, [item.id]: item } })),

        addObservation: (appId, text, visibility) => {
          const a = app(appId)!;
          patchApp(appId, (x) => ({
            ...x,
            observations: [...x.observations, { id: uid("ob"), at: new Date().toISOString(), authorId: me(), visibility, text, stage: x.stage }],
            history: [...x.history, event(me(), "observation", { note: visibility === "internal" ? "Internal note added." : text })],
          }));
          if (visibility === "applicant") notify(a.applicantId, { title: "New observation", body: `${a.ref}: ${text}`, kind: "info", href: `/workspace/applications/${appId}` });
          audit("file.observation", a.ref, visibility);
        },

        listForCommittee: (appId) => {
          const a = app(appId)!;
          const presentation = (a.presentations >= 1 ? 2 : 1) as 1 | 2;
          get().forwardFile(appId, "bc_committee", undefined, `Listed for BC Committee (presentation ${presentation}).`);
          patchApp(appId, (x) => ({ ...x, presentations: presentation, history: [...x.history, event(me(), "committee_listed", { note: `Presentation ${presentation}` })] }));
          set((s) => ({
            meetings: s.meetings.map((m) =>
              m.status === "scheduled" && !m.items.some((i) => i.applicationId === appId)
                ? { ...m, items: [...m.items, { id: uid("ci"), applicationId: appId, presentation, votes: [] }] }
                : m,
            ),
          }));
        },

        decideFile: (appId, decision, note) => {
          const a = app(appId)!;
          if (decision === "approved") {
            get().forwardFile(appId, "signing", me(), `Approved: ${note}`);
            const existing = get().signing.find((p) => p.applicationId === appId);
            if (!existing) {
              const pkg: SigningPackage = {
                id: `sp-${appId.replace("a-", "")}`,
                applicationId: appId,
                title: a.type.startsWith("PP") ? "Planning Permit approval set" : "Approved drawing set",
                version: 1,
                versions: [{ version: 1, label: "Approved for signature", createdAt: new Date().toISOString(), status: "approved" }],
                sheets: [
                  { page: 1, kind: "site", title: "Site plan", signable: true },
                  { page: 2, kind: "ground", title: "Ground floor plan", signable: true },
                  { page: 3, kind: "elevation", title: "Front elevation", signable: true },
                  { page: 4, kind: "far", title: "FAR calculation sheet", signable: false },
                ],
                signatures: [],
                status: "awaiting",
                requiredSignerIds: [me()],
                audit: [{ at: new Date().toISOString(), actorId: me(), text: "Approval package generated and locked at version 1." }],
              };
              set((s) => ({ signing: [pkg, ...s.signing] }));
            }
          } else {
            patchApp(appId, (x) => ({
              ...x,
              status: "rejected",
              stage: "closed",
              decidedAt: new Date().toISOString(),
              holderId: undefined,
              history: [...x.history, event(me(), "rejected", { note, simulated: true })],
            }));
            notify(a.applicantId, { title: "Application rejected", body: `${a.ref}: ${note}`, kind: "warning", href: `/workspace/applications/${appId}` });
            audit("file.reject", a.ref, note, "notice");
          }
        },

        signPackage: (pkgId) => {
          const pkg = get().signing.find((p) => p.id === pkgId)!;
          const now = new Date().toISOString();
          const slot = pkg.signatures.length + 1;
          const pages = pkg.sheets.filter((s) => s.signable).map((s) => s.page);
          const signatures = [...pkg.signatures, { id: uid("sig"), signerId: me(), signedAt: now, certificateSerial: `DEMO-CA-7F21-${me().slice(-4).toUpperCase()}`, pages, slot, simulated: true as const }];
          const complete = pkg.requiredSignerIds.every((r) => signatures.some((s) => s.signerId === r));
          const marks = signatures.reduce((n, s) => n + s.pages.length, 0);
          set((s) => ({
            signing: s.signing.map((p) =>
              p.id === pkgId
                ? {
                    ...p,
                    signatures,
                    status: complete ? "signed" : "awaiting",
                    audit: [
                      ...p.audit,
                      { at: now, actorId: me(), text: `Signed ${pages.length} design pages in slot ${slot} (v${p.version}). Excluded: ${p.sheets.filter((x) => !x.signable).map((x) => x.title).join(", ") || "none"}.`, simulated: true },
                      ...(complete ? [{ at: now, actorId: "system", text: `Post-render verification: ${marks} of ${marks} signature marks present (simulated).`, simulated: true }] : []),
                    ],
                  }
                : p,
            ),
          }));
          const a = app(pkg.applicationId)!;
          patchApp(a.id, (x) => ({ ...x, history: [...x.history, event(me(), "signed", { note: `Signed v${pkg.version}, ${pages.length} pages (simulated certificate).`, simulated: true })] }));
          audit("document.sign", `Package ${pkgId}`, "Simulated signature", "notice");
          if (complete) {
            if (a.type === "CP" || a.type === "RDC" || a.type === "LSP") {
              const fee = a.fee ?? (a.building ? calculateIllustrativeFee({ type: a.type, occupancy: a.building.occupancy, totalFloorAreaSqm: a.building.totalFloorAreaSqm }) : undefined);
              patchApp(a.id, (x) => ({
                ...x,
                status: "fee_pending",
                stage: "fee_and_drawings",
                holderId: undefined,
                stageEnteredAt: now,
                fee: fee ? { ...fee, status: "requested", requestedAt: now } : x.fee,
                history: [...x.history, event("system", "fee_requested", { note: "Permit fee and electrical & plumbing drawings requested from applicant." })],
              }));
              set((s) => ({ payments: [{ id: uid("p"), applicationId: a.id, applicationRef: a.ref, zone: a.property.zone, category: "permit_fee", amount: fee?.total ?? 0, status: "pending", channel: "—", createdAt: now, reconciled: false }, ...s.payments] }));
              notify(a.applicantId, { title: "Fee payment requested", body: `${a.ref}: approval signed. Please pay the permit fee and upload electrical & plumbing drawings.`, kind: "action", href: `/workspace/applications/${a.id}` });
            } else {
              patchApp(a.id, (x) => ({ ...x, status: "approved", stage: "issued", holderId: undefined, decidedAt: now, permitNo: x.ref, history: [...x.history, event("system", "approved", { note: "Signed approval issued." })] }));
              notify(a.applicantId, { title: "Approval issued", body: `${a.ref} has been approved and signed.`, kind: "success", href: `/workspace/applications/${a.id}` });
            }
          }
        },

        castVote: (meetingId, itemId, vote, remark) => {
          set((s) => ({
            meetings: s.meetings.map((m) =>
              m.id === meetingId
                ? { ...m, status: "in_session", items: m.items.map((i) => (i.id === itemId ? { ...i, votes: [...i.votes.filter((v) => v.memberId !== me()), { memberId: me(), vote, at: new Date().toISOString(), remark }] } : i)) }
                : m,
            ),
          }));
          audit("committee.vote", itemId, vote, "notice");
        },

        concludeItem: (meetingId, itemId, { autoSign }) => {
          const meeting = get().meetings.find((m) => m.id === meetingId)!;
          const item = meeting.items.find((i) => i.id === itemId)!;
          const tally = { approve: 0, correction: 0, reject: 0 };
          item.votes.forEach((v) => tally[v.vote]++);
          let decision: "approved" | "correction" | "rejected" = tally.approve >= tally.reject && tally.approve >= tally.correction ? "approved" : tally.reject >= tally.correction ? "rejected" : "correction";
          if (item.presentation === 2 && decision === "correction") decision = tally.approve >= tally.reject ? "approved" : "rejected";
          const now = new Date().toISOString();
          set((s) => ({
            meetings: s.meetings.map((m) => (m.id === meetingId ? { ...m, items: m.items.map((i) => (i.id === itemId ? { ...i, decision, decidedAt: now, minutesNote: `Decision: ${decision} (${tally.approve} approve · ${tally.correction} correction · ${tally.reject} reject).` } : i)) } : m)),
          }));
          const a = app(item.applicationId)!;
          patchApp(a.id, (x) => ({ ...x, history: [...x.history, event(me(), "committee_decision", { note: `${meeting.title}: ${decision}.` })] }));
          if (decision === "approved") {
            const pkgId = `sp-${a.id.replace("a-", "")}`;
            if (!get().signing.some((p) => p.id === pkgId)) {
              set((s) => ({
                signing: [
                  {
                    id: pkgId,
                    applicationId: a.id,
                    title: "Approved drawing set",
                    version: Math.max(1, a.presentations),
                    versions: [{ version: Math.max(1, a.presentations), label: "Approved by BC Committee", createdAt: now, status: "approved" }],
                    sheets: [
                      { page: 1, kind: "site", title: "Site plan", signable: true },
                      { page: 2, kind: "ground", title: "Ground floor plan", signable: true },
                      { page: 3, kind: "typical", title: "Typical floor plan", signable: true },
                      { page: 4, kind: "elevation", title: "Front elevation", signable: true },
                      { page: 5, kind: "section", title: "Section A–A", signable: true },
                      { page: 6, kind: "far", title: "FAR calculation sheet", signable: false },
                    ],
                    signatures: [],
                    status: "awaiting",
                    requiredSignerIds: ["u-off-01"],
                    audit: [{ at: now, actorId: me(), text: "Approved drawing version locked after positive committee vote." }],
                  },
                  ...s.signing,
                ],
              }));
            }
            patchApp(a.id, (x) => ({ ...x, status: "signing", stage: "signing", holderId: "u-off-01", stageEnteredAt: now }));
            notify("u-off-01", { title: "Signature required", body: `${a.ref} approved by committee — approval set awaits your signature.`, kind: "action", href: `/rajuk/signing/${pkgId}` });
            if (autoSign) {
              const prev = get().session;
              set({ session: prev ? { ...prev, userId: "u-off-01" } : prev });
              get().signPackage(pkgId);
              set({ session: prev });
            }
          } else if (decision === "correction") {
            patchApp(a.id, (x) => ({ ...x, status: "correction_requested", stage: "authorized_officer", holderId: "u-off-01", correctionNote: "BC Committee requested corrections — see committee minutes.", stageEnteredAt: now }));
            notify(a.applicantId, { title: "Committee requested correction", body: `${a.ref}: please revise and resubmit for second presentation.`, kind: "warning", href: `/workspace/applications/${a.id}` });
          } else {
            patchApp(a.id, (x) => ({ ...x, status: "rejected", stage: "closed", holderId: undefined, decidedAt: now }));
            notify(a.applicantId, { title: "Application rejected by committee", body: `${a.ref} was rejected at ${meeting.title}.`, kind: "warning", href: `/workspace/applications/${a.id}` });
          }
          audit("committee.conclude", a.ref, decision, "notice");
        },

        updateInspection: (id, patch) => set((s) => ({ inspections: s.inspections.map((i) => (i.id === id ? { ...i, ...patch, status: i.status === "assigned" ? "draft" : i.status } : i)) })),
        setInspectionChecklist: (id, item) =>
          set((s) => ({ inspections: s.inspections.map((i) => (i.id === id ? { ...i, status: i.status === "assigned" ? "draft" : i.status, checklist: { ...i.checklist, [item.id]: item } } : i)) })),
        submitInspection: (id, outcome) => {
          const ins = get().inspections.find((i) => i.id === id)!;
          const now = new Date().toISOString();
          set((s) => ({ inspections: s.inspections.map((i) => (i.id === id ? { ...i, status: "submitted", submittedAt: now, outcome } : i)) }));
          const a = app(ins.applicationId)!;
          patchApp(a.id, (x) => ({ ...x, history: [...x.history, event(me(), "inspection", { note: `Inspection submitted — outcome: ${outcome?.replace("_", " ")}.` })] }));
          notify("u-off-01", { title: "Inspection report submitted", body: `${a.ref}: ${outcome?.replace("_", " ")}.`, kind: outcome === "compliant" ? "info" : "warning", href: `/rajuk/files/${a.id}` });
          notify(a.applicantId, { title: "Site inspection completed", body: `An inspection was recorded for ${a.ref}.`, kind: "info", href: `/workspace/applications/${a.id}` });
          audit("inspection.submit", a.ref, outcome);
        },

        markNotificationRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
        markAllNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => (n.userId === me() ? { ...n, read: true } : n)) })),

        createTicket: (t) => {
          const counter = get().counters.ticket + 1;
          const now = new Date().toISOString();
          const ticket: Ticket = { ...t, id: uid("t"), ref: `HD-26-${pad(counter, 5)}`, raisedBy: me(), status: "open", createdAt: now, updatedAt: now, thread: [{ at: now, authorId: me(), text: t.description }] };
          set((s) => ({ tickets: [ticket, ...s.tickets], counters: { ...s.counters, ticket: counter } }));
          notify(me(), { title: "Ticket received", body: `${ticket.ref} logged. You will receive updates here.`, kind: "info", href: "/workspace/support" });
          notify("u-sup-01", { title: "New ticket", body: `${ticket.ref} — ${t.subject}`, kind: "action", href: "/rajuk/helpdesk" });
          return ticket;
        },
        replyTicket: (id, text) =>
          set((s) => ({ tickets: s.tickets.map((t) => (t.id === id ? { ...t, updatedAt: new Date().toISOString(), thread: [...t.thread, { at: new Date().toISOString(), authorId: me(), text }] } : t)) })),
        setTicketStatus: (id, status) => {
          const t = get().tickets.find((x) => x.id === id)!;
          set((s) => ({ tickets: s.tickets.map((x) => (x.id === id ? { ...x, status, updatedAt: new Date().toISOString() } : x)) }));
          notify(t.raisedBy, { title: `Ticket ${t.ref} updated`, body: `Status: ${status.replace("_", " ")}`, kind: status === "resolved" ? "success" : "info", href: t.raisedBy.startsWith("u-app") || t.raisedBy.startsWith("u-pro") ? "/workspace/support" : "/rajuk/helpdesk" });
          audit("ticket.status", t.ref, status);
        },
        assignTicket: (id, assigneeId) => set((s) => ({ tickets: s.tickets.map((t) => (t.id === id ? { ...t, assigneeId, status: t.status === "open" ? "in_progress" : t.status, updatedAt: new Date().toISOString() } : t)) })),

        updateSecurity: (patch) => {
          set((s) => ({ security: { ...s.security, ...patch } }));
          audit("settings.security", "Security settings", JSON.stringify(patch), "warning");
        },
        setHoldingLimit: (stage, days) => {
          set((s) => ({ holdingLimits: { ...s.holdingLimits, [stage]: days } }));
          audit("settings.workflow", "Holding limit", `${STAGE_LABEL[stage]} → ${days} working days`, "notice");
        },
        setUserStatus: (userId, status) => {
          set((s) => ({ users: s.users.map((u) => (u.id === userId ? { ...u, status } : u)) }));
          audit(status === "suspended" ? "user.suspend" : "user.activate", userId, undefined, "warning");
        },
        mergeDuplicateUser: (dupId) => {
          set((s) => ({ users: s.users.filter((u) => u.id !== dupId) }));
          audit("user.merge_duplicate", dupId, "Duplicate profile request rejected — single user profile enforced", "notice");
        },
        toggleJob: (id) => set((s) => ({ scheduler: s.scheduler.map((j) => (j.id === id ? { ...j, enabled: !j.enabled } : j)) })),
        runJob: (id) => {
          set((s) => ({ scheduler: s.scheduler.map((j) => (j.id === id ? { ...j, lastRunAt: new Date().toISOString(), lastResult: "success" } : j)) }));
          audit("scheduler.run", id, "Manual run (simulated)");
        },
        updateFarRow: (id, patch) => {
          set((s) => ({ far: s.far.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
          audit("settings.far", id, JSON.stringify(patch), "notice");
        },
        toggleNotice: (id) => set((s) => ({ notices: s.notices.map((n) => (n.id === id ? { ...n, visibleOnPortal: !n.visibleOnPortal } : n)) })),
        publishNotice: (title, body, kind) => {
          set((s) => ({ notices: [{ id: uid("nt"), title, body, kind, publishedAt: new Date().toISOString(), visibleOnPortal: true }, ...s.notices] }));
          audit("notice.publish", title, undefined, "notice");
        },

        requestRevert: (appId, fromState, reason) => {
          const a = app(appId)!;
          set((s) => ({ reverts: [{ id: uid("rv"), applicationId: appId, fromState, toStage: "authorized_officer", reason, requestedBy: me(), requestedAt: new Date().toISOString(), status: "pending" }, ...s.reverts] }));
          patchApp(appId, (x) => ({ ...x, history: [...x.history, event(me(), "revert_requested", { note: reason })] }));
          audit("file.revert_request", a.ref, reason, "notice");
        },
        decideRevert: (id, approve) => {
          const r = get().reverts.find((x) => x.id === id)!;
          set((s) => ({ reverts: s.reverts.map((x) => (x.id === id ? { ...x, status: approve ? "approved" : "declined", decidedBy: me(), decidedAt: new Date().toISOString() } : x)) }));
          if (approve) {
            patchApp(r.applicationId, (x) => ({
              ...x,
              status: "in_review",
              stage: r.toStage,
              holderId: r.requestedBy,
              stageEnteredAt: new Date().toISOString(),
              history: [...x.history, event(me(), "reverted", { toStage: r.toStage, note: `Reverted from ${r.fromState.replace("_", " ")}.` })],
            }));
          }
          audit("file.revert_decision", r.applicationId, approve ? "approved" : "declined", "warning");
        },
        uploadNoc: (appId, memoNo) => {
          const a = app(appId)!;
          set((s) => ({ nocs: [{ id: uid("noc"), applicationId: appId, issuedOn: new Date().toISOString(), issuedBy: me(), memoNo, status: "uploaded" }, ...s.nocs] }));
          patchApp(appId, (x) => ({
            ...x,
            stage: x.type.startsWith("PP") ? "town_planner" : "authorized_officer",
            department: undefined,
            holderId: x.type.startsWith("PP") ? "u-tp-02" : "u-off-01",
            stageEnteredAt: new Date().toISOString(),
            documents: [...x.documents, { id: uid("doc"), name: `estate_noc_${memoNo.replace(/\W+/g, "_")}.pdf`, category: "noc", sizeKb: 210, pages: 1, version: 1, uploadedAt: new Date().toISOString(), uploadedBy: me(), status: "verified", sample: true, previewKind: "document" }],
            history: [...x.history, event(me(), "noc_uploaded", { note: `Estate NOC ${memoNo} uploaded; file returned to processing.` })],
          }));
          notify(a.applicantId, { title: "Estate NOC added", body: `${a.ref}: Estate section issued its NOC.`, kind: "info", href: `/workspace/applications/${appId}` });
          audit("estate.noc", a.ref, memoNo);
        },
        reconcilePayment: (id) => {
          set((s) => ({ payments: s.payments.map((p) => (p.id === id ? { ...p, reconciled: true } : p)) }));
          audit("payment.reconcile", id, "Matched against gateway settlement (simulated)");
        },
        runIntegrationCheck: (key) =>
          set((s) => ({ integrations: s.integrations.map((i) => (i.key === key ? { ...i, lastCheckAt: new Date().toISOString(), lastCheckResult: "ok" } : i)) })),
        advanceMigration: (id) =>
          set((s) => ({
            migration: s.migration.map((b) => {
              if (b.id !== id) return b;
              if (b.status === "queued") return { ...b, status: "validating", startedAt: new Date().toISOString(), migrated: Math.round(b.records * 0.35) };
              if (b.status === "validating") return { ...b, migrated: b.records - 12, failed: 12, status: "exceptions" };
              if (b.status === "exceptions") return { ...b, migrated: b.records, failed: 0, status: "reconciled" };
              return b;
            }),
          })),
        moveTwoC: (id, toId, note) =>
          set((s) => ({ twoC: s.twoC.map((f) => (f.id === id ? { ...f, custodianId: toId, movements: [...f.movements, { at: new Date().toISOString(), fromId: f.custodianId, toId, note }] } : f)) })),
      };
    },
    {
      name: STORAGE_KEY,
      // Bump when the seed schema changes so stale browser state is replaced by the new seed.
      version: 3,
      migrate: () => createSeed() as unknown as DemoStore,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { hydrated, ...rest } = s;
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== "function"));
      },
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
        useDemoStore.setState({ hydrated: true });
      },
    },
  ),
);

/** Convenience selectors */
export const useSession = () => useDemoStore((s) => s.session);
export const useCurrentUser = () =>
  useDemoStore((s) => (s.session ? s.users.find((u) => u.id === s.session!.userId) : undefined));
export const useUserMap = () => useDemoStore((s) => s.users);

export function userName(users: { id: string; name: string }[], id?: string) {
  if (!id) return "—";
  if (id === "system") return "ECPS system";
  return users.find((u) => u.id === id)?.name ?? id;
}

export { nextStage };
