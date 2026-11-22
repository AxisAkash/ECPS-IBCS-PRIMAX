/**
 * DEMONSTRATION DATA — entirely fictional.
 *
 * All people, application references, NID/tax documents, membership numbers, permits and amounts
 * are invented for the prototype. No real applicant, officer or RAJUK record is represented.
 * Dates are generated relative to the moment the demo is first loaded (or reset) so holding-time
 * indicators stay meaningful.
 */
import { calculateIllustrativeFee } from "@/lib/domain/fees";
import type {
  Application,
  AuditEntry,
  BuildingInfo,
  CommitteeMeeting,
  DapZone,
  DocumentRecord,
  FarRow,
  Inspection,
  Integration,
  MigrationBatch,
  NocRecord,
  Notification,
  Payment,
  ProfessionalParticipation,
  PropertyInfo,
  RevertRequest,
  SchedulerJob,
  SecuritySettings,
  ServiceType,
  SigningPackage,
  StageKey,
  SystemNotice,
  Ticket,
  TwoCFile,
  User,
  WorkflowEvent,
  ApplicationStatus,
  DrawingSheetKind,
} from "@/lib/domain/types";
import { DEFAULT_HOLDING_LIMITS } from "@/lib/domain/workflow";
import { daysAgo, hoursAgo } from "@/lib/utils";

export const DEMO_PERSONAS = {
  applicant: "u-app-01",
  professional: "u-pro-01",
  officer: "u-off-01",
  inspector: "u-ins-01",
  committee: "u-com-01",
  estate: "u-est-01",
  finance: "u-fin-01",
  management: "u-mgt-01",
  admin: "u-adm-01",
  support: "u-sup-01",
} as const;

const mail = (h: string) => `${h}@demo.ecps.test`;
const mob = (n: number) => `01700-0${String(n).padStart(5, "0")}`;

export const USERS: User[] = [
  // Applicants (building owners)
  { id: "u-app-01", name: "Nusrat Jahan Chowdhury", nameBn: "নুসরাত জাহান চৌধুরী", role: "applicant", designation: "Building owner", department: "External", email: mail("nusrat.chowdhury"), mobile: mob(11), status: "active" },
  { id: "u-app-02", name: "Kazi Mahbub Alam", role: "applicant", designation: "Building owner", department: "External", email: mail("kazi.mahbub"), mobile: mob(12), status: "active" },
  { id: "u-app-03", name: "Rehana Parvin", role: "applicant", designation: "Building owner", department: "External", email: mail("rehana.parvin"), mobile: mob(13), status: "active" },
  { id: "u-app-04", name: "Sabbir Ahmed", role: "applicant", designation: "Authorised representative, Nirman Habitat Ltd. (fictional)", department: "External", email: mail("sabbir.ahmed"), mobile: mob(14), status: "active" },
  { id: "u-app-05", name: "Shirin Akhter", role: "applicant", designation: "Building owner", department: "External", email: mail("shirin.akhter"), mobile: mob(15), status: "active" },
  { id: "u-app-06", name: "Mostafizur Rahman", role: "applicant", designation: "Building owner", department: "External", email: mail("mostafiz"), mobile: mob(16), status: "active" },
  // Professionals
  { id: "u-pro-01", name: "Ar. Tanvir Hossain", nameBn: "স্থপতি তানভীর হোসেন", role: "professional", designation: "Architect", department: "External", email: mail("tanvir.arch"), mobile: mob(21), status: "active", discipline: "architect", membership: { body: "IAB", number: "A-1147 (demo)", verified: true } },
  { id: "u-pro-02", name: "Engr. Sadia Karim", role: "professional", designation: "Structural Engineer", department: "External", email: mail("sadia.struct"), mobile: mob(22), status: "active", discipline: "structural", membership: { body: "IEB", number: "M-30412 (demo)", verified: true } },
  { id: "u-pro-03", name: "Engr. Arif Mahmud", role: "professional", designation: "Electrical Engineer", department: "External", email: mail("arif.elec"), mobile: mob(23), status: "active", discipline: "electrical", membership: { body: "IEB", number: "M-28877 (demo)", verified: true } },
  { id: "u-pro-04", name: "Engr. Fahmida Nasrin", role: "professional", designation: "Plumbing Engineer", department: "External", email: mail("fahmida.plumb"), mobile: mob(24), status: "active", discipline: "plumbing", membership: { body: "IEB", number: "M-31905 (demo)", verified: true } },
  { id: "u-pro-05", name: "Engr. Rakibul Hasan", role: "professional", designation: "Construction Supervision Engineer", department: "External", email: mail("rakib.sup"), mobile: mob(25), status: "active", discipline: "supervisor", membership: { body: "IEB", number: "M-26340 (demo)", verified: true } },
  { id: "u-pro-06", name: "Ar. Nadia Islam", role: "professional", designation: "Architect", department: "External", email: mail("nadia.arch"), mobile: mob(26), status: "active", discipline: "architect", membership: { body: "IAB", number: "A-1302 (demo)", verified: false } },
  // RAJUK — Development Control (illustrative zone assignment)
  { id: "u-off-01", name: "Md. Rafiqul Islam", nameBn: "মো. রফিকুল ইসলাম", role: "officer", designation: "Authorized Officer", department: "development_control", zone: "Zone 4", email: mail("ao.zone4"), mobile: mob(31), status: "active", employeeId: "RJ-DEMO-0412" },
  { id: "u-off-02", name: "Nasima Begum", role: "officer", designation: "Assistant Authorized Officer", department: "development_control", zone: "Zone 4", email: mail("aao.zone4"), mobile: mob(32), status: "active", employeeId: "RJ-DEMO-0418" },
  { id: "u-off-03", name: "Abdul Mannan", role: "officer", designation: "Authorized Officer", department: "development_control", zone: "Zone 2", email: mail("ao.zone2"), mobile: mob(33), status: "active", employeeId: "RJ-DEMO-0207" },
  { id: "u-cbi-01", name: "Golam Mostafa", role: "officer", designation: "Chief Building Inspector", department: "development_control", zone: "Zone 4", email: mail("cbi.zone4"), mobile: mob(34), status: "active", employeeId: "RJ-DEMO-0431" },
  { id: "u-fd-01", name: "Jahid Hasan", role: "officer", designation: "Front Desk Officer", department: "development_control", zone: "Zone 4", email: mail("fd.zone4"), mobile: mob(35), status: "active", employeeId: "RJ-DEMO-0440" },
  { id: "u-ins-01", name: "Shahidul Alam", nameBn: "শহিদুল আলম", role: "inspector", designation: "Building Inspector", department: "development_control", zone: "Zone 4", email: mail("bi1.zone4"), mobile: mob(36), status: "active", employeeId: "RJ-DEMO-0452" },
  { id: "u-ins-02", name: "Tahmina Rahman", role: "inspector", designation: "Building Inspector", department: "development_control", zone: "Zone 4", email: mail("bi2.zone4"), mobile: mob(37), status: "active", employeeId: "RJ-DEMO-0457" },
  // Town Planning
  { id: "u-tp-01", name: "Sharmin Akter", role: "officer", designation: "Deputy Town Planner", department: "town_planning", email: mail("dtp1"), mobile: mob(41), status: "active", employeeId: "RJ-DEMO-0605" },
  { id: "u-tp-02", name: "Mizanur Rahman", role: "officer", designation: "Town Planner", department: "town_planning", email: mail("tp1"), mobile: mob(42), status: "active", employeeId: "RJ-DEMO-0611" },
  { id: "u-ctp-01", name: "A. K. M. Saiful Huq", role: "officer", designation: "Chief Town Planner", department: "town_planning", email: mail("ctp"), mobile: mob(43), status: "active", employeeId: "RJ-DEMO-0601" },
  // Committee
  { id: "u-com-01", name: "Dr. Farzana Haque", nameBn: "ড. ফারজানা হক", role: "committee", designation: "BC Committee member (external technical expert)", department: "committee", email: mail("bcc.expert1"), mobile: mob(51), status: "active" },
  { id: "u-com-02", name: "Engr. Habibur Rahman", role: "committee", designation: "BC Committee member", department: "committee", email: mail("bcc.member2"), mobile: mob(52), status: "active" },
  { id: "u-com-03", name: "Ar. Lubna Yasmin", role: "committee", designation: "BC Committee member", department: "committee", email: mail("bcc.member3"), mobile: mob(53), status: "active" },
  { id: "u-com-04", name: "Md. Shafiqul Alam", role: "committee", designation: "BC Committee chair (demo)", department: "committee", email: mail("bcc.chair"), mobile: mob(54), status: "active" },
  // Other sections
  { id: "u-est-01", name: "Kamrul Hasan", nameBn: "কামরুল হাসান", role: "estate", designation: "Estate Officer", department: "estate", email: mail("estate1"), mobile: mob(61), status: "active", employeeId: "RJ-DEMO-0712" },
  { id: "u-fin-01", name: "Mahmuda Akter", nameBn: "মাহমুদা আক্তার", role: "finance", designation: "Accounts Officer", department: "finance", email: mail("finance1"), mobile: mob(62), status: "active", employeeId: "RJ-DEMO-0805" },
  { id: "u-mgt-01", name: "Ahsan Habib", nameBn: "আহসান হাবিব", role: "management", designation: "Director, Development Control (demo)", department: "management", email: mail("director.dc"), mobile: mob(63), status: "active", employeeId: "RJ-DEMO-0102" },
  { id: "u-adm-01", name: "Imran Kabir", nameBn: "ইমরান কবির", role: "admin", designation: "System Administrator", department: "ict", email: mail("sysadmin"), mobile: mob(64), status: "active", employeeId: "RJ-DEMO-0903" },
  { id: "u-sup-01", name: "Rumana Sultana", nameBn: "রুমানা সুলতানা", role: "support", designation: "Technical Support Engineer", department: "ict", email: mail("helpdesk1"), mobile: mob(65), status: "active", employeeId: "SUP-DEMO-01" },
  { id: "u-sup-02", name: "Fahim Chowdhury", role: "support", designation: "Technical Support Engineer", department: "ict", email: mail("helpdesk2"), mobile: mob(66), status: "active", employeeId: "SUP-DEMO-02" },
  // Pending duplicate profile — demonstrates "one employee, one user id" (TOR 2.8)
  { id: "u-dup-01", name: "Md. Rafiqul Islam", role: "officer", designation: "Authorized Officer (duplicate request)", department: "development_control", zone: "Zone 4", email: mail("rafiq.islam.old"), mobile: mob(31), status: "pending", employeeId: "RJ-DEMO-0412" },
];

const COORDS: Record<string, [number, number]> = {
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

const MOUZA: Record<string, string> = {
  Dhanmondi: "Jafrabad",
  Mirpur: "Pallabi",
  Uttara: "Ranavola",
  Gulshan: "Bhatara",
  Mohammadpur: "Katasur",
  Badda: "Satarkul",
  Banani: "Bhatara",
  Bashundhara: "Joar Sahara",
  Khilgaon: "Nandipara",
  Purbachal: "Rupganj",
  Tejgaon: "Tejturi Bazar",
};

function property(area: string, zone: string, n: number, extra: Partial<PropertyInfo> = {}): PropertyInfo {
  return {
    zone,
    subZone: `${zone.replace("Zone ", "")}/${(n % 4) + 1}`,
    block: `B-${String(((n * 17) % 240) + 1).padStart(3, "0")}`,
    area,
    mouza: MOUZA[area] ?? "Demo Mouza",
    rsDag: String(1200 + n * 37),
    csDag: String(800 + n * 23),
    plotNo: `${(n % 40) + 3}`,
    plotAreaSqm: 268 + ((n * 41) % 400),
    roadWidthM: [6, 7.5, 9, 12, 18][n % 5]!,
    address: `Plot ${(n % 40) + 3}, Road ${(n % 15) + 2}, ${area}, Dhaka (fictional)`,
    ownershipType: "freehold",
    ...extra,
  };
}

function building(storeys: number, occupancy: BuildingInfo["occupancy"], plotAreaSqm: number, n = 0): BuildingInfo {
  // Keep seeded FAR within the illustrative limits, except one deliberate exception (n % 9 === 5).
  const farTarget = n % 9 === 5 ? 4.6 : Math.min(storeys * 0.6, 3.8);
  const total = Math.round(plotAreaSqm * farTarget);
  const ground = Math.min(Math.round(plotAreaSqm * 0.6), Math.round(total / storeys));
  return {
    occupancy,
    storeys,
    basements: storeys > 8 ? 1 : 0,
    totalFloorAreaSqm: total,
    groundCoverageSqm: ground,
    units: occupancy === "A" ? Math.max(1, (storeys - 1) * 2) : storeys,
    heightM: +(storeys * 3.2 + 1.5).toFixed(1),
    setbacks: { front: 2.5, rear: 2, left: 1.5, right: 1.5 },
  };
}

const SHEETS: Array<{ kind: DrawingSheetKind; title: string }> = [
  { kind: "site", title: "Site plan" },
  { kind: "ground", title: "Ground floor plan" },
  { kind: "typical", title: "Typical floor plan" },
  { kind: "elevation", title: "Front elevation" },
  { kind: "section", title: "Section A–A" },
  { kind: "far", title: "FAR calculation sheet" },
];

function documents(appId: string, owners: string[], uploader: string, at: string, opts: { drawings?: boolean; partial?: boolean } = {}): DocumentRecord[] {
  const docs: DocumentRecord[] = [];
  let i = 0;
  const add = (d: Omit<DocumentRecord, "id" | "uploadedAt" | "uploadedBy" | "sample" | "version" | "status"> & Partial<DocumentRecord>) =>
    docs.push({ id: `${appId}-d${++i}`, uploadedAt: at, uploadedBy: uploader, sample: true, version: 1, status: "uploaded", ...d });
  owners.forEach((o, idx) => {
    const slug = o.split(" ")[0]!.toLowerCase();
    add({ name: `nid_${slug}_sample.pdf`, category: "nid", ownerIndex: idx, sizeKb: 182, pages: 1, previewKind: "document" });
    if (!opts.partial || idx === 0) add({ name: `tax_return_${slug}_FY2025-26_sample.pdf`, category: "tax_return", ownerIndex: idx, sizeKb: 240, pages: 2, previewKind: "document" });
    add({ name: `photo_${slug}_sample.jpg`, category: "photo", ownerIndex: idx, sizeKb: 96, previewKind: "photo" });
  });
  add({ name: "mutation_khatian_sample.pdf", category: "ownership", sizeKb: 420, pages: 3, previewKind: "document" });
  if (!opts.partial) {
    add({ name: "plot_north_east_sample.jpg", category: "plot_photo", sizeKb: 1240, previewKind: "photo" });
    add({ name: "adjacent_road_sample.jpg", category: "road_photo", sizeKb: 1180, previewKind: "photo" });
  }
  if (opts.drawings) {
    SHEETS.forEach((s, idx) =>
      add({ name: `${String(idx + 1).padStart(2, "0")}_${s.kind}_sheet.pdf`, category: "drawing", sizeKb: 860 + idx * 90, pages: 1, previewKind: "drawing", drawingSheet: s.kind, version: 3 }),
    );
    add({ name: "soil_test_report_sample.pdf", category: "certificate", sizeKb: 1520, pages: 14, previewKind: "document" });
    add({ name: "structural_design_basis_sample.pdf", category: "professional", sizeKb: 2310, pages: 22, previewKind: "document" });
  }
  return docs;
}

function participation(entries: Array<[string, ProfessionalParticipation["role"], ProfessionalParticipation["status"]]>, at: string): ProfessionalParticipation[] {
  return entries.map(([userId, role, status]) => ({ userId, role, status, invitedAt: at, respondedAt: status === "invited" ? undefined : at }));
}

interface AppSeed {
  id: string;
  n: number;
  type: ServiceType;
  title: string;
  applicantId: string;
  owners: string[];
  area: string;
  zone: string;
  status: ApplicationStatus;
  stage: StageKey;
  holderId?: string;
  createdDaysAgo: number;
  submittedDaysAgo?: number;
  stageDaysAgo: number;
  storeys: number;
  occupancy?: BuildingInfo["occupancy"];
  pros?: Array<[string, ProfessionalParticipation["role"], ProfessionalParticipation["status"]]>;
  priority?: "normal" | "high";
  presentations?: number;
  draftStep?: number;
  extraHistory?: (now: number) => WorkflowEvent[];
  department?: Application["department"];
  permitNo?: string;
  correctionNote?: string;
  legacy?: boolean;
  linked?: string;
  propertyExtra?: Partial<PropertyInfo>;
  partialDocs?: boolean;
}

const YEAR = "26";
function refFor(type: ServiceType, zone: string, n: number) {
  const z = zone.replace("Zone ", "Z");
  return `${type === "PP_PRIVATE_HOUSING" ? "PPH" : type === "PP_RENEWAL" ? "PPR" : type === "OC_APPEAL" ? "OCA" : type}-${YEAR}-${z}-${String(1400 + n * 7).padStart(5, "0")}`;
}

function buildApp(s: AppSeed, now: number): Application {
  const created = daysAgo(s.createdDaysAgo, now);
  const submitted = s.submittedDaysAgo !== undefined ? daysAgo(s.submittedDaysAgo, now, 11) : undefined;
  const prop = property(s.area, s.zone, s.n, s.propertyExtra);
  const [lat, lng] = COORDS[s.area] ?? [23.78, 90.4];
  const b = building(s.storeys, s.occupancy ?? "A", prop.plotAreaSqm, s.n);
  const isDraft = s.status === "draft";
  const history: WorkflowEvent[] = [{ id: `${s.id}-h0`, at: created, actorId: s.applicantId, action: "created" }];
  if (submitted) {
    history.push({ id: `${s.id}-h1`, at: submitted, actorId: s.applicantId, action: "submitted", toStage: "front_desk" });
    history.push({ id: `${s.id}-h2`, at: daysAgo(Math.max(0, (s.submittedDaysAgo ?? 0) - 0.2), now, 14), actorId: "u-fd-01", action: "received", fromStage: "front_desk", note: "Documents scrutinised at Front Desk; sub-zone/block routing applied." });
  }
  history.push(...(s.extraHistory?.(now) ?? []));
  const fee = s.type === "CSN" ? undefined : { ...calculateIllustrativeFee({ type: s.type, occupancy: b.occupancy, totalFloorAreaSqm: b.totalFloorAreaSqm }) };
  return {
    id: s.id,
    ref: refFor(s.type, s.zone, s.n),
    type: s.type,
    title: s.title,
    applicantId: s.applicantId,
    owners: s.owners.map((name, i) => ({ name, relation: i === 0 ? "Principal owner" : "Co-owner" })),
    professionals: participation(s.pros ?? [], created),
    property: prop,
    location: isDraft && (s.draftStep ?? 0) < 4 ? undefined : { lat: lat + (s.n % 7) * 0.0009, lng: lng + (s.n % 5) * 0.0011, dapLandUse: s.occupancy === "E" || s.occupancy === "F" ? "Commercial zone" : "Residential zone (urban)", confirmedOnMap: true },
    building: isDraft && (s.draftStep ?? 0) < 5 ? undefined : b,
    documents: documents(s.id, s.owners, s.applicantId, submitted ?? created, { drawings: ["CP", "RDC", "LSP"].includes(s.type) || (s.type === "PP" && !isDraft), partial: s.partialDocs }),
    status: s.status,
    stage: s.stage,
    holderId: s.holderId,
    department: s.department,
    stageEnteredAt: daysAgo(s.stageDaysAgo, now, 9),
    createdAt: created,
    submittedAt: submitted,
    decidedAt: s.status === "approved" || s.status === "rejected" ? daysAgo(s.stageDaysAgo, now, 15) : undefined,
    priority: s.priority ?? "normal",
    presentations: s.presentations ?? 0,
    history: history.sort((a, b2) => a.at.localeCompare(b2.at)),
    observations: [],
    checklist: {},
    fee: fee ? { ...fee, status: s.status === "approved" ? "paid" : s.status === "fee_pending" ? "requested" : "assessed" } : undefined,
    draftStep: s.draftStep,
    permitNo: s.permitNo,
    correctionNote: s.correctionNote,
    legacy: s.legacy,
    linkedApplicationId: s.linked,
  };
}

const fwd = (id: string, at: string, actorId: string, from: StageKey, to: StageKey, toUserId?: string, note?: string): WorkflowEvent => ({
  id,
  at,
  actorId,
  action: "forwarded",
  fromStage: from,
  toStage: to,
  toUserId,
  note,
});

function applicationSeeds(): AppSeed[] {
  return [
    // ——— Demo applicant: Nusrat Jahan Chowdhury ———
    {
      id: "a-101", n: 1, type: "PP", title: "Six-storey residential building, Dhanmondi", applicantId: "u-app-01",
      owners: ["Nusrat Jahan Chowdhury", "Farhan Chowdhury"], area: "Dhanmondi", zone: "Zone 4", status: "draft", stage: "draft",
      createdDaysAgo: 3, stageDaysAgo: 3, storeys: 6, pros: [["u-pro-01", "architect", "invited"]], draftStep: 3, partialDocs: true,
    },
    {
      id: "a-102", n: 2, type: "CP", title: "Five-storey residential building, Mirpur", applicantId: "u-app-01",
      owners: ["Nusrat Jahan Chowdhury"], area: "Mirpur", zone: "Zone 4", status: "correction_requested", stage: "building_inspector", holderId: "u-ins-02",
      createdDaysAgo: 34, submittedDaysAgo: 30, stageDaysAgo: 4, storeys: 5,
      pros: [["u-pro-06", "architect", "accepted"], ["u-pro-02", "structural", "accepted"], ["u-pro-03", "electrical", "accepted"], ["u-pro-04", "plumbing", "accepted"]],
      correctionNote: "The adjacent-road photograph does not show the full road width. Please upload a daytime photograph taken from the plot boundary showing both road edges.",
      extraHistory: (now) => [
        fwd("a-102-h3", daysAgo(25, now), "u-fd-01", "front_desk", "building_inspector", "u-ins-02"),
        { id: "a-102-h4", at: daysAgo(4, now, 12), actorId: "u-ins-02", action: "correction_requested", note: "Adjacent-road photograph unclear." },
      ],
    },
    {
      id: "a-103", n: 3, type: "CP", title: "Seven-storey residential building, Uttara Sector 11", applicantId: "u-app-01",
      owners: ["Nusrat Jahan Chowdhury"], area: "Uttara", zone: "Zone 1", status: "in_review", stage: "assistant_authorized_officer", holderId: "u-off-02",
      createdDaysAgo: 24, submittedDaysAgo: 21, stageDaysAgo: 2, storeys: 7, linked: "a-106",
      pros: [["u-pro-01", "architect", "accepted"], ["u-pro-02", "structural", "accepted"], ["u-pro-03", "electrical", "accepted"], ["u-pro-04", "plumbing", "accepted"]],
      extraHistory: (now) => [
        fwd("a-103-h3", daysAgo(19, now), "u-fd-01", "front_desk", "building_inspector", "u-ins-01"),
        { id: "a-103-h4", at: daysAgo(12, now), actorId: "u-ins-01", action: "inspection", note: "Site verified; GPS position and road width consistent." },
        fwd("a-103-h5", daysAgo(11, now), "u-ins-01", "building_inspector", "chief_building_inspector", "u-cbi-01"),
        fwd("a-103-h6", daysAgo(2, now), "u-cbi-01", "chief_building_inspector", "assistant_authorized_officer", "u-off-02"),
      ],
    },
    {
      id: "a-104", n: 4, type: "CP", title: "Four-storey family residence, Mohammadpur", applicantId: "u-app-01",
      owners: ["Nusrat Jahan Chowdhury", "Farhan Chowdhury"], area: "Mohammadpur", zone: "Zone 4", status: "fee_pending", stage: "fee_and_drawings",
      createdDaysAgo: 70, submittedDaysAgo: 66, stageDaysAgo: 3, storeys: 4, presentations: 1,
      pros: [["u-pro-01", "architect", "accepted"], ["u-pro-02", "structural", "accepted"]],
      extraHistory: (now) => [
        { id: "a-104-h3", at: daysAgo(6, now), actorId: "u-com-04", action: "committee_decision", note: "Approved at BC Committee (Regular) meeting 13/2026 — demo." },
        { id: "a-104-h4", at: daysAgo(3, now), actorId: "u-off-01", action: "signed", note: "Approval drawings signed on all design pages (simulated).", simulated: true },
        { id: "a-104-h5", at: daysAgo(3, now, 12), actorId: "u-off-01", action: "fee_requested", note: "Permit fee and electrical & plumbing drawings requested automatically after positive vote (TOR 1.13)." },
      ],
    },
    {
      id: "a-105", n: 5, type: "OC", title: "Occupancy Certificate — residential building, Khilgaon", applicantId: "u-app-01",
      owners: ["Nusrat Jahan Chowdhury"], area: "Khilgaon", zone: "Zone 6", status: "rejected", stage: "closed",
      createdDaysAgo: 80, submittedDaysAgo: 78, stageDaysAgo: 20, storeys: 5,
      extraHistory: (now) => [{ id: "a-105-h3", at: daysAgo(20, now, 15), actorId: "u-off-03", action: "rejected", note: "Top-floor extension not shown in approved drawings (demo reason)." }],
    },
    {
      id: "a-106", n: 6, type: "PP", title: "Planning Permit — Uttara Sector 11 plot", applicantId: "u-app-01",
      owners: ["Nusrat Jahan Chowdhury"], area: "Uttara", zone: "Zone 1", status: "approved", stage: "issued",
      createdDaysAgo: 120, submittedDaysAgo: 118, stageDaysAgo: 60, storeys: 7, permitNo: "PP-26-Z1-01442",
    },
    // ——— Zone queues ———
    {
      id: "a-201", n: 11, type: "CP", title: "Six-storey residential building, Pallabi", applicantId: "u-app-02",
      owners: ["Kazi Mahbub Alam"], area: "Mirpur", zone: "Zone 4", status: "submitted", stage: "front_desk",
      createdDaysAgo: 6, submittedDaysAgo: 1, stageDaysAgo: 1, storeys: 6,
      pros: [["u-pro-06", "architect", "accepted"], ["u-pro-02", "structural", "accepted"], ["u-pro-03", "electrical", "accepted"], ["u-pro-04", "plumbing", "accepted"]],
    },
    {
      id: "a-202", n: 12, type: "CP", title: "Nine-storey mixed-use building, Mirpur 10", applicantId: "u-app-04",
      owners: ["Nirman Habitat Ltd. (fictional)"], area: "Mirpur", zone: "Zone 4", status: "in_review", stage: "building_inspector", holderId: "u-ins-01",
      createdDaysAgo: 22, submittedDaysAgo: 18, stageDaysAgo: 14, storeys: 9, occupancy: "E", priority: "high",
      pros: [["u-pro-01", "architect", "accepted"], ["u-pro-02", "structural", "accepted"]],
      extraHistory: (now) => [fwd("a-202-h3", daysAgo(14, now), "u-fd-01", "front_desk", "building_inspector", "u-ins-01")],
    },
    {
      id: "a-203", n: 13, type: "CP", title: "Ten-storey residential building, Dhanmondi R/A", applicantId: "u-app-03",
      owners: ["Rehana Parvin", "Ashraful Parvez"], area: "Dhanmondi", zone: "Zone 4", status: "in_review", stage: "authorized_officer", holderId: "u-off-01",
      createdDaysAgo: 30, submittedDaysAgo: 27, stageDaysAgo: 1, storeys: 10,
      pros: [["u-pro-01", "architect", "accepted"], ["u-pro-02", "structural", "accepted"], ["u-pro-03", "electrical", "accepted"], ["u-pro-04", "plumbing", "accepted"]],
      extraHistory: (now) => [
        fwd("a-203-h3", daysAgo(25, now), "u-fd-01", "front_desk", "building_inspector", "u-ins-01"),
        { id: "a-203-h4", at: daysAgo(17, now), actorId: "u-ins-01", action: "inspection", note: "Site visit completed; plot boundary and road width verified." },
        fwd("a-203-h5", daysAgo(15, now), "u-ins-01", "building_inspector", "chief_building_inspector", "u-cbi-01"),
        fwd("a-203-h6", daysAgo(9, now), "u-cbi-01", "chief_building_inspector", "assistant_authorized_officer", "u-off-02"),
        { id: "a-203-h7", at: daysAgo(5, now), actorId: "u-off-02", action: "routed", toStage: "department_review", note: "Routed to Town Planning for DAP land-use opinion." },
        { id: "a-203-h8", at: daysAgo(2, now), actorId: "u-tp-01", action: "returned", fromStage: "department_review", note: "Land use compatible with DAP residential zone. No objection." },
        fwd("a-203-h9", daysAgo(1, now), "u-off-02", "assistant_authorized_officer", "authorized_officer", "u-off-01", "Recommended for BC Committee listing."),
      ],
    },
    {
      id: "a-204", n: 14, type: "CP", title: "Eight-storey apartment building, Shyamoli", applicantId: "u-app-05",
      owners: ["Shirin Akhter"], area: "Mohammadpur", zone: "Zone 4", status: "in_review", stage: "authorized_officer", holderId: "u-off-01",
      createdDaysAgo: 41, submittedDaysAgo: 38, stageDaysAgo: 7, storeys: 8, priority: "high",
      pros: [["u-pro-06", "architect", "accepted"], ["u-pro-02", "structural", "accepted"]],
      extraHistory: (now) => [fwd("a-204-h3", daysAgo(7, now), "u-off-02", "assistant_authorized_officer", "authorized_officer", "u-off-01")],
    },
    {
      id: "a-205", n: 15, type: "RDC", title: "Revised drawings — additional stair core, Kafrul", applicantId: "u-app-06",
      owners: ["Mostafizur Rahman"], area: "Mirpur", zone: "Zone 4", status: "in_review", stage: "assistant_authorized_officer", holderId: "u-off-02",
      createdDaysAgo: 16, submittedDaysAgo: 14, stageDaysAgo: 3, storeys: 6,
      pros: [["u-pro-06", "architect", "accepted"], ["u-pro-02", "structural", "accepted"]],
    },
    {
      id: "a-206", n: 16, type: "CP", title: "Twelve-storey residential tower, Banani", applicantId: "u-app-04",
      owners: ["Nirman Habitat Ltd. (fictional)"], area: "Banani", zone: "Zone 4", status: "committee", stage: "bc_committee",
      createdDaysAgo: 90, submittedDaysAgo: 86, stageDaysAgo: 8, storeys: 12, presentations: 2,
      pros: [["u-pro-01", "architect", "accepted"], ["u-pro-02", "structural", "accepted"], ["u-pro-03", "electrical", "accepted"], ["u-pro-04", "plumbing", "accepted"]],
      extraHistory: (now) => [
        { id: "a-206-h3", at: daysAgo(40, now), actorId: "u-com-04", action: "committee_decision", note: "First presentation: correction requested (fire-escape stair width)." },
        { id: "a-206-h4", at: daysAgo(12, now), actorId: "u-app-04", action: "resubmitted", note: "Revised fire-safety drawings submitted." },
        { id: "a-206-h5", at: daysAgo(8, now), actorId: "u-off-01", action: "committee_listed", note: "Listed for second presentation." },
      ],
    },
    {
      id: "a-207", n: 17, type: "CP", title: "Seven-storey office building, Tejgaon I/A", applicantId: "u-app-02",
      owners: ["Kazi Mahbub Alam"], area: "Tejgaon", zone: "Zone 4", status: "committee", stage: "bc_committee",
      createdDaysAgo: 48, submittedDaysAgo: 45, stageDaysAgo: 5, storeys: 7, occupancy: "E", presentations: 1,
      pros: [["u-pro-06", "architect", "accepted"], ["u-pro-02", "structural", "accepted"]],
      extraHistory: (now) => [{ id: "a-207-h3", at: daysAgo(5, now), actorId: "u-off-01", action: "committee_listed", note: "Listed for first presentation." }],
    },
    {
      id: "a-208", n: 18, type: "CP", title: "Eleven-storey residential building, Lalmatia", applicantId: "u-app-03",
      owners: ["Rehana Parvin"], area: "Mohammadpur", zone: "Zone 4", status: "signing", stage: "signing", holderId: "u-off-01",
      createdDaysAgo: 75, submittedDaysAgo: 72, stageDaysAgo: 1, storeys: 11, presentations: 1,
      pros: [["u-pro-01", "architect", "accepted"], ["u-pro-02", "structural", "accepted"], ["u-pro-03", "electrical", "accepted"], ["u-pro-04", "plumbing", "accepted"]],
      extraHistory: (now) => [
        { id: "a-208-h3", at: daysAgo(2, now), actorId: "u-com-04", action: "committee_decision", note: "Approved at BC Committee (Regular) meeting 13/2026 — demo." },
        { id: "a-208-h4", at: daysAgo(1, now), actorId: "u-off-02", action: "signed", note: "Assistant Authorized Officer signed sheets 1–5 (simulated).", simulated: true },
      ],
    },
    {
      id: "a-209", n: 19, type: "PP", title: "Planning Permit — residential plot, Purbachal (RAJUK lease)", applicantId: "u-app-05",
      owners: ["Shirin Akhter"], area: "Purbachal", zone: "Zone 8", status: "in_review", stage: "department_review", holderId: "u-est-01", department: "estate",
      createdDaysAgo: 12, submittedDaysAgo: 10, stageDaysAgo: 4, storeys: 6, propertyExtra: { ownershipType: "rajuk_lease" },
      pros: [["u-pro-06", "architect", "accepted"]],
      extraHistory: (now) => [{ id: "a-209-h3", at: daysAgo(4, now), actorId: "u-tp-01", action: "routed", toStage: "department_review", note: "Routed to Estate for lease NOC." }],
    },
    {
      id: "a-210", n: 20, type: "PP_PRIVATE_HOUSING", title: "PP — plot in Sonali Nibash Housing (fictional approved project)", applicantId: "u-app-06",
      owners: ["Mostafizur Rahman"], area: "Bashundhara", zone: "Zone 3", status: "in_review", stage: "town_planner", holderId: "u-tp-02",
      createdDaysAgo: 9, submittedDaysAgo: 8, stageDaysAgo: 2, storeys: 6, propertyExtra: { ownershipType: "private_housing", housingProjectId: "hp-02" },
      pros: [["u-pro-01", "architect", "accepted"]],
    },
    {
      id: "a-211", n: 21, type: "LSP", title: "Large & Special Project — 22-storey commercial complex, Gulshan", applicantId: "u-app-04",
      owners: ["Nirman Habitat Ltd. (fictional)"], area: "Gulshan", zone: "Zone 2", status: "in_review", stage: "authorized_officer", holderId: "u-off-03",
      createdDaysAgo: 60, submittedDaysAgo: 55, stageDaysAgo: 16, storeys: 22, occupancy: "E", priority: "high",
      pros: [["u-pro-01", "architect", "accepted"], ["u-pro-02", "structural", "accepted"], ["u-pro-03", "electrical", "accepted"], ["u-pro-04", "plumbing", "accepted"]],
    },
    {
      id: "a-212", n: 22, type: "OC", title: "Occupancy Certificate — six-storey building, Pallabi", applicantId: "u-app-02",
      owners: ["Kazi Mahbub Alam"], area: "Mirpur", zone: "Zone 4", status: "in_review", stage: "building_inspector", holderId: "u-ins-01",
      createdDaysAgo: 8, submittedDaysAgo: 7, stageDaysAgo: 3, storeys: 6,
      pros: [["u-pro-05", "supervisor", "accepted"]],
    },
    {
      id: "a-213", n: 23, type: "CP", title: "Six-storey residential building, Rupnagar", applicantId: "u-app-06",
      owners: ["Mostafizur Rahman"], area: "Mirpur", zone: "Zone 4", status: "approved", stage: "issued",
      createdDaysAgo: 200, submittedDaysAgo: 195, stageDaysAgo: 140, storeys: 6, permitNo: "CP-26-Z4-01561",
      pros: [["u-pro-06", "architect", "accepted"], ["u-pro-05", "supervisor", "accepted"]],
    },
    {
      id: "a-214", n: 24, type: "CP", title: "Five-storey building, Adabor", applicantId: "u-app-05",
      owners: ["Shirin Akhter"], area: "Mohammadpur", zone: "Zone 4", status: "rejected", stage: "closed",
      createdDaysAgo: 100, submittedDaysAgo: 97, stageDaysAgo: 33, storeys: 5,
    },
    {
      id: "a-215", n: 25, type: "CP", title: "Legacy CP record — four-storey building, Kalabagan", applicantId: "u-app-02",
      owners: ["Kazi Mahbub Alam"], area: "Dhanmondi", zone: "Zone 4", status: "approved", stage: "issued",
      createdDaysAgo: 3600, submittedDaysAgo: 3590, stageDaysAgo: 3500, storeys: 4, legacy: true, permitNo: "LEGACY-CP-2016-0441",
    },
    {
      id: "a-216", n: 26, type: "PP", title: "Planning Permit — Gulshan Avenue plot", applicantId: "u-app-04",
      owners: ["Nirman Habitat Ltd. (fictional)"], area: "Gulshan", zone: "Zone 2", status: "approved", stage: "issued",
      createdDaysAgo: 150, submittedDaysAgo: 148, stageDaysAgo: 110, storeys: 14, occupancy: "E", permitNo: "PP-26-Z2-01582",
    },
    {
      id: "a-217", n: 27, type: "CSN", title: "Construction Start Notice — Rupnagar building", applicantId: "u-app-06",
      owners: ["Mostafizur Rahman"], area: "Mirpur", zone: "Zone 4", status: "submitted", stage: "front_desk",
      createdDaysAgo: 2, submittedDaysAgo: 2, stageDaysAgo: 2, storeys: 6, linked: "a-213",
      pros: [["u-pro-05", "supervisor", "accepted"]],
    },
    {
      id: "a-218", n: 28, type: "PP", title: "Planning Permit — Badda link-road plot", applicantId: "u-app-02",
      owners: ["Kazi Mahbub Alam"], area: "Badda", zone: "Zone 5", status: "in_review", stage: "chief_town_planner", holderId: "u-ctp-01",
      createdDaysAgo: 20, submittedDaysAgo: 18, stageDaysAgo: 1, storeys: 8, pros: [["u-pro-06", "architect", "accepted"]],
    },
    {
      id: "a-219", n: 29, type: "CP", title: "Seven-storey residential building, Lalmatia Block D", applicantId: "u-app-03",
      owners: ["Rehana Parvin"], area: "Mohammadpur", zone: "Zone 4", status: "draft", stage: "draft",
      createdDaysAgo: 1, stageDaysAgo: 1, storeys: 7, draftStep: 4, partialDocs: true,
      pros: [["u-pro-01", "architect", "invited"], ["u-pro-02", "structural", "invited"]],
    },
    {
      id: "a-220", n: 30, type: "CP", title: "Eight-storey residential building, Section 12 Pallabi", applicantId: "u-app-05",
      owners: ["Shirin Akhter"], area: "Mirpur", zone: "Zone 4", status: "in_review", stage: "chief_building_inspector", holderId: "u-cbi-01",
      createdDaysAgo: 19, submittedDaysAgo: 17, stageDaysAgo: 6, storeys: 8,
      pros: [["u-pro-06", "architect", "accepted"], ["u-pro-02", "structural", "accepted"]],
    },
  ];
}

export const HOUSING_PROJECTS = [
  { id: "hp-01", name: "Nilachol Model Town (fictional)", developer: "Nilachol Properties Ltd. (fictional)", mouza: "Joar Sahara", approvalRef: "Demo approval HP-01" },
  { id: "hp-02", name: "Sonali Nibash Housing (fictional)", developer: "Sonali Nibash Developers (fictional)", mouza: "Joar Sahara", approvalRef: "Demo approval HP-02" },
  { id: "hp-03", name: "Shapla Residential Area (fictional)", developer: "Shapla Housing Ltd. (fictional)", mouza: "Satarkul", approvalRef: "Demo approval HP-03" },
];

export const PUBLIC_PERMITS = [
  ["PP-26-Z1-01442", "PP", "2026-07-22", ["Nusrat Jahan Chowdhury"], "Uttara", "Zone 1", "Ranavola", "RS Dag 1311", "Residential", "A", "G+7", 12],
  ["CP-26-Z4-01561", "CP", "2026-05-06", ["Mostafizur Rahman"], "Mirpur", "Zone 4", "Pallabi", "RS Dag 2051", "Residential", "A", "G+5", 10],
  ["PP-26-Z2-01582", "PP", "2026-08-04", ["Nirman Habitat Ltd. (fictional)"], "Gulshan", "Zone 2", "Bhatara", "RS Dag 2162", "Commercial", "E", "B+G+13", 26],
  ["CP-26-Z4-01309", "CP", "2026-03-14", ["Ayesha Siddiqua", "Tariqul Islam"], "Dhanmondi", "Zone 4", "Jafrabad", "RS Dag 1487", "Residential", "A", "G+8", 16],
  ["CP-26-Z3-01277", "CP", "2026-02-27", ["Mahfuza Khanam"], "Bashundhara", "Zone 3", "Joar Sahara", "RS Dag 1924", "Residential", "A", "G+9", 18],
  ["PP-26-Z5-01264", "PP", "2026-02-11", ["Rashed Karim"], "Badda", "Zone 5", "Satarkul", "RS Dag 1735", "Residential", "A", "G+6", 12],
  ["CP-26-Z6-01236", "CP", "2026-01-29", ["Jannatul Ferdous"], "Khilgaon", "Zone 6", "Nandipara", "RS Dag 1662", "Residential", "A", "G+5", 10],
  ["CP-25-Z4-01198", "CP", "2025-12-18", ["Delwar Hossain", "Nasreen Hossain"], "Mohammadpur", "Zone 4", "Katasur", "RS Dag 1550", "Residential", "A", "G+7", 14],
  ["PP-25-Z8-01171", "PP", "2025-11-30", ["Purbachal plot owner (fictional)"], "Purbachal", "Zone 8", "Rupganj", "Plot 214, Sector 22 (demo)", "Residential", "A", "G+6", 12],
  ["CP-25-Z2-01153", "CP", "2025-11-12", ["Meghna Tower Ltd. (fictional)"], "Banani", "Zone 2", "Bhatara", "RS Dag 2240", "Commercial", "E", "B2+G+11", 22],
  ["CP-25-Z1-01120", "CP", "2025-10-21", ["Sharif Uddin"], "Uttara", "Zone 1", "Ranavola", "RS Dag 1408", "Residential", "A", "G+6", 12],
  ["CP-23-Z6-00781", "CP", "2023-04-09", ["Moinul Haque"], "Khilgaon", "Zone 6", "Nandipara", "RS Dag 1590", "Residential", "A", "G+5", 10],
].map(([permitNo, type, approvedOn, owners, area, zone, mouza, plotRef, landUse, occupancy, floorLimit, units], i) => {
  const approved = new Date(approvedOn as string);
  const valid = new Date(approved);
  valid.setFullYear(valid.getFullYear() + 3);
  return {
    permitNo: permitNo as string,
    type: type as "PP" | "CP",
    approvedOn: approved.toISOString(),
    validUntil: valid.toISOString(),
    owners: owners as string[],
    area: area as string,
    zone: zone as string,
    mouza: mouza as string,
    plotRef: plotRef as string,
    landUse: landUse as string,
    occupancy: occupancy as "A" | "E",
    floorLimit: floorLimit as string,
    units: units as number,
    setbacks: { front: 2.5 + (i % 3) * 0.5, rear: 2, left: 1.5, right: 1.5 },
    status: valid.getTime() < Date.parse("2026-11-01") ? ("expired" as const) : ("valid" as const),
    verificationCode: `V${(permitNo as string).replace(/[^0-9]/g, "").slice(-6)}${"KQXMTR"[i % 6]}`,
  };
});

export interface DemoSeed {
  seededAt: string;
  users: User[];
  applications: Application[];
  signing: SigningPackage[];
  meetings: CommitteeMeeting[];
  inspections: Inspection[];
  payments: Payment[];
  notifications: Notification[];
  audit: AuditEntry[];
  tickets: Ticket[];
  integrations: Integration[];
  migration: MigrationBatch[];
  reverts: RevertRequest[];
  twoC: TwoCFile[];
  nocs: NocRecord[];
  notices: SystemNotice[];
  scheduler: SchedulerJob[];
  security: SecuritySettings;
  holdingLimits: Partial<Record<StageKey, number>>;
  far: FarRow[];
  dap: DapZone[];
  issuedPermits: typeof PUBLIC_PERMITS;
  counters: { application: number; ticket: number };
}

export function createSeed(now = Date.now()): DemoSeed {
  const applications = applicationSeeds().map((s) => buildApp(s, now));

  const signing: SigningPackage[] = [
    {
      id: "sp-208",
      applicationId: "a-208",
      title: "Approved architectural drawing set",
      version: 3,
      versions: [
        { version: 1, label: "Initial submission", createdAt: daysAgo(72, now), status: "superseded" },
        { version: 2, label: "Revised after BI observation", createdAt: daysAgo(30, now), status: "superseded" },
        { version: 3, label: "Approved by BC Committee", createdAt: daysAgo(2, now), status: "approved" },
      ],
      sheets: SHEETS.map((s, i) => ({ page: i + 1, kind: s.kind, title: s.title, signable: s.kind !== "far" })),
      signatures: [
        { id: "sig-1", signerId: "u-off-02", signedAt: daysAgo(1, now, 16), certificateSerial: "DEMO-CA-7F21-0418", pages: [1, 2, 3, 4, 5], slot: 1, simulated: true },
      ],
      status: "awaiting",
      requiredSignerIds: ["u-off-02", "u-off-01"],
      audit: [
        { at: daysAgo(2, now, 12), actorId: "u-com-04", text: "Version 3 locked as approved drawing set after committee vote." },
        { at: daysAgo(1, now, 16), actorId: "u-off-02", text: "Signed pages 1–5 in slot 1. FAR calculation sheet excluded by placement rule.", simulated: true },
      ],
    },
    {
      id: "sp-104",
      applicationId: "a-104",
      title: "Approved architectural drawing set",
      version: 2,
      versions: [
        { version: 1, label: "Initial submission", createdAt: daysAgo(66, now), status: "superseded" },
        { version: 2, label: "Approved by BC Committee", createdAt: daysAgo(6, now), status: "approved" },
      ],
      sheets: SHEETS.map((s, i) => ({ page: i + 1, kind: s.kind, title: s.title, signable: s.kind !== "far" })),
      signatures: [
        { id: "sig-2", signerId: "u-off-02", signedAt: daysAgo(4, now), certificateSerial: "DEMO-CA-7F21-0418", pages: [1, 2, 3, 4, 5], slot: 1, simulated: true },
        { id: "sig-3", signerId: "u-off-01", signedAt: daysAgo(3, now), certificateSerial: "DEMO-CA-7F21-0412", pages: [1, 2, 3, 4, 5], slot: 2, simulated: true },
      ],
      status: "signed",
      requiredSignerIds: ["u-off-02", "u-off-01"],
      audit: [{ at: daysAgo(3, now), actorId: "u-off-01", text: "All required signatures applied; post-render check found 10 of 10 signature marks (simulated).", simulated: true }],
    },
  ];

  const meetings: CommitteeMeeting[] = [
    {
      id: "m-14",
      title: "BC Committee (Regular) — Meeting 14/2026",
      committee: "BC_REGULAR",
      date: daysAgo(-1, now, 10),
      venue: "RAJUK Bhaban, Conference Room 3 (demo)",
      memberIds: ["u-com-04", "u-com-01", "u-com-02", "u-com-03"],
      status: "scheduled",
      items: [
        { id: "ci-1", applicationId: "a-206", presentation: 2, votes: [{ memberId: "u-com-02", vote: "approve", at: hoursAgo(3, now), remark: "Revised stair width now satisfies requirement." }] },
        { id: "ci-2", applicationId: "a-207", presentation: 1, votes: [] },
      ],
    },
    {
      id: "m-13",
      title: "BC Committee (Regular) — Meeting 13/2026",
      committee: "BC_REGULAR",
      date: daysAgo(6, now),
      venue: "RAJUK Bhaban, Conference Room 3 (demo)",
      memberIds: ["u-com-04", "u-com-01", "u-com-02", "u-com-03"],
      status: "concluded",
      items: [
        { id: "ci-0a", applicationId: "a-104", presentation: 1, votes: ["u-com-04", "u-com-01", "u-com-02", "u-com-03"].map((m) => ({ memberId: m, vote: "approve" as const, at: daysAgo(6, now) })), decision: "approved", decidedAt: daysAgo(6, now), minutesNote: "Approved unanimously." },
        { id: "ci-0b", applicationId: "a-208", presentation: 1, votes: ["u-com-04", "u-com-01", "u-com-02", "u-com-03"].map((m, i) => ({ memberId: m, vote: i === 3 ? ("correction" as const) : ("approve" as const), at: daysAgo(6, now) })), decision: "approved", decidedAt: daysAgo(2, now), minutesNote: "Approved by majority; one member noted parking ramp gradient." },
      ],
    },
  ];

  const inspections: Inspection[] = [
    { id: "i-01", applicationId: "a-213", kind: "plinth", scheduledFor: daysAgo(0, now, 15), inspectorId: "u-ins-01", status: "assigned", checklist: {}, observations: "", photos: [] },
    { id: "i-02", applicationId: "a-212", kind: "occupancy", scheduledFor: daysAgo(-1, now, 11), inspectorId: "u-ins-01", status: "assigned", checklist: {}, observations: "", photos: [] },
    {
      id: "i-03", applicationId: "a-202", kind: "complaint", scheduledFor: daysAgo(1, now), inspectorId: "u-ins-01", status: "draft",
      checklist: { "site.gps": { id: "site.gps", result: "pass" }, "site.board": { id: "site.board", result: "fail", note: "No display board at entrance." } },
      observations: "Neighbour complaint about excavation close to boundary wall. Excavation observed on the north side.",
      photos: [{ id: "ph-1", caption: "North boundary excavation (sample)", takenAt: daysAgo(1, now), sample: true }],
      gps: { lat: 23.8071, lng: 90.3698, accuracyM: 6, capturedAt: daysAgo(1, now), simulated: true },
    },
    {
      id: "i-04", applicationId: "a-216", kind: "construction_start", scheduledFor: daysAgo(30, now), inspectorId: "u-ins-02", status: "submitted",
      checklist: {}, observations: "Construction start verified. Display board present.", photos: [], submittedAt: daysAgo(29, now), outcome: "compliant",
    },
  ];

  const payments: Payment[] = [];
  const zones = ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7", "Zone 8"];
  const cats: Payment["category"][] = ["application_fee", "permit_fee", "permit_fee", "application_fee", "oc_fee", "renewal_fee", "appeal_fee"];
  const channels: Payment["channel"][] = ["Card", "Mobile banking", "Internet banking", "Mobile banking"];
  for (let i = 0; i < 96; i++) {
    const day = Math.floor((i * 179) % 180) + 1;
    const cat = cats[i % cats.length]!;
    const base = cat === "permit_fee" ? 60000 + ((i * 7919) % 140000) : cat === "application_fee" ? [5000, 10000, 6000][i % 3]! : cat === "oc_fee" ? 8000 : cat === "renewal_fee" ? 2500 : 2000;
    const failed = i % 23 === 0;
    payments.push({
      id: `p-${i}`,
      applicationRef: `CP-${YEAR}-Z${(i % 8) + 1}-${String(1000 + i * 3).padStart(5, "0")}`,
      zone: zones[i % 8]!,
      category: cat,
      amount: base,
      status: failed ? "failed" : i % 31 === 0 ? "refunded" : "paid",
      channel: channels[i % channels.length]!,
      gatewayRef: `SSLCZ-DEMO-${(884210 + i * 13).toString(36).toUpperCase()}`,
      paidAt: failed ? undefined : daysAgo(day, now, 9 + (i % 7)),
      createdAt: daysAgo(day, now, 9),
      reconciled: !failed && i % 11 !== 0,
    });
  }
  const a104 = applications.find((a) => a.id === "a-104")!;
  payments.push({ id: "p-a104", applicationId: "a-104", applicationRef: a104.ref, zone: "Zone 4", category: "permit_fee", amount: a104.fee!.total, status: "pending", channel: "—", createdAt: daysAgo(3, now, 12), reconciled: false });
  const a103 = applications.find((a) => a.id === "a-103")!;
  payments.push({ id: "p-a103", applicationId: "a-103", applicationRef: a103.ref, zone: "Zone 1", category: "application_fee", amount: 10000, status: "paid", channel: "Mobile banking", gatewayRef: "SSLCZ-DEMO-A103", paidAt: daysAgo(21, now), createdAt: daysAgo(21, now), reconciled: true });

  const n = (userId: string, hrs: number, title: string, body: string, kind: Notification["kind"], href?: string, read = false): Notification => ({
    id: `n-${userId}-${hrs}`, userId, at: hoursAgo(hrs, now), title, body, kind, href, read,
  });
  const notifications: Notification[] = [
    n("u-app-01", 3, "Fee payment requested", `Permit fee for ${a104.ref} is due. Electrical and plumbing drawings are also requested.`, "action", "/workspace/applications/a-104"),
    n("u-app-01", 96, "Correction requested", `${applications.find((a) => a.id === "a-102")!.ref}: the adjacent-road photograph needs to be replaced.`, "warning", "/workspace/applications/a-102"),
    n("u-app-01", 48, "File moved to Assistant Authorized Officer", `${a103.ref} is now with the Assistant Authorized Officer, Zone 1.`, "info", "/workspace/applications/a-103"),
    n("u-app-01", 400, "Planning Permit approved", "PP-26-Z1-01442 has been approved and published in the Public Register.", "success", "/workspace/applications/a-106", true),
    n("u-pro-01", 70, "New invitation", "Nusrat Jahan Chowdhury invited you as Architect on a Planning Permit draft.", "action", "/workspace/invitations"),
    n("u-pro-01", 20, "New invitation", "Rehana Parvin invited you as Architect on a Construction Permit draft.", "action", "/workspace/invitations"),
    n("u-off-01", 2, "File received", "CP — Ten-storey residential building, Dhanmondi R/A forwarded to you by Nasima Begum.", "info", "/rajuk/files/a-203"),
    n("u-off-01", 20, "Signature required", "Approved drawing set for a-208 awaits your signature.", "action", "/rajuk/signing/sp-208"),
    n("u-off-01", 30, "Holding limit exceeded", "1 file in your tray has exceeded its holding limit.", "warning", "/rajuk/inbox?filter=overdue"),
    n("u-ins-01", 5, "Inspection scheduled", "Plinth-level inspection at Rupnagar today.", "action", "/rajuk/inspections/i-01"),
    n("u-com-01", 10, "Agenda published", "BC Committee meeting 14/2026 agenda is available.", "info", "/rajuk/committee"),
    n("u-est-01", 90, "NOC requested", "Town Planning routed a Purbachal lease plot for Estate NOC.", "action", "/rajuk/estate"),
    n("u-fin-01", 6, "Reconciliation exceptions", "9 gateway transactions are not yet reconciled.", "warning", "/rajuk/finance"),
    n("u-adm-01", 12, "Duplicate user profile", "A new profile request shares an Employee ID with an active user.", "warning", "/rajuk/admin/users"),
    n("u-sup-01", 1, "New ticket", "HD-26-00418 — Unable to upload drawing over 20 MB.", "action", "/rajuk/helpdesk"),
  ];

  const audit: AuditEntry[] = [
    ["u-off-02", 26, "file.forward", "CP a-203", "Forwarded to Authorized Officer", "info"],
    ["u-off-02", 24, "document.sign", "Package sp-208", "Signed pages 1–5 (simulated certificate)", "notice"],
    ["u-adm-01", 30, "settings.update", "Workflow holding limits", "Front Desk limit changed 3 → 2 days", "notice"],
    ["u-adm-01", 52, "user.suspend", "User u-old-17", "Account suspended — duplicate employee id", "warning"],
    ["u-fd-01", 26, "file.receive", "CP a-201", "Received at Front Desk; routed by block B-188", "info"],
    ["u-tp-01", 48, "file.return", "CP a-203", "Returned with Town Planning opinion", "info"],
    ["u-fin-01", 70, "report.export", "Finance monthly summary", "CSV export", "info"],
    ["u-ins-01", 22, "inspection.draft", "Inspection i-03", "Draft saved with 1 photo", "info"],
    ["u-com-02", 3, "committee.vote", "Item ci-1", "Vote recorded: approve", "notice"],
    ["system", 8, "auth.failed", "u-off-03", "3 failed sign-in attempts from untrusted device", "warning"],
    ["system", 9, "auth.otp", "u-off-03", "OTP challenge issued for untrusted device", "notice"],
    ["u-sup-01", 15, "ticket.update", "HD-26-00411", "Status → Resolved", "info"],
  ].map(([actor, hrs, action, target, detail, sev], i) => ({
    id: `au-${i}`, at: hoursAgo(hrs as number, now), actorId: actor as string, action: action as string, target: target as string, detail: detail as string, ip: `10.20.${(i * 7) % 255}.${(i * 13) % 255}`, severity: sev as AuditEntry["severity"],
  }));

  const tickets: Ticket[] = [
    {
      id: "t-411", ref: "HD-26-00411", raisedBy: "u-app-01", category: "payment", subject: "Payment receipt not visible after mobile banking payment",
      description: "Paid the application fee for my Uttara application but the receipt did not appear for some time.", status: "resolved", priority: "medium",
      createdAt: daysAgo(22, now), updatedAt: daysAgo(21, now), assigneeId: "u-sup-01", applicationRef: a103.ref,
      thread: [
        { at: daysAgo(22, now), authorId: "u-app-01", text: "Paid but cannot see the receipt." },
        { at: daysAgo(21, now, 12), authorId: "u-sup-01", text: "Gateway confirmation arrived late; the receipt is now available under Payments." },
      ],
    },
    {
      id: "t-418", ref: "HD-26-00418", raisedBy: "u-pro-06", category: "application", subject: "Unable to upload drawing over 20 MB",
      description: "The ground-floor plan PDF is 24 MB and the upload stops at 80%.", status: "open", priority: "high",
      createdAt: hoursAgo(1, now), updatedAt: hoursAgo(1, now), thread: [{ at: hoursAgo(1, now), authorId: "u-pro-06", text: "Upload stops at 80% for a 24 MB file." }],
    },
    {
      id: "t-415", ref: "HD-26-00415", raisedBy: "u-off-03", category: "signature", subject: "Dongle not detected on new workstation",
      description: "Signing dongle is not detected after workstation replacement.", status: "in_progress", priority: "high",
      createdAt: daysAgo(2, now), updatedAt: hoursAgo(5, now), assigneeId: "u-sup-02",
      thread: [{ at: daysAgo(2, now), authorId: "u-off-03", text: "Dongle not detected." }, { at: hoursAgo(5, now), authorId: "u-sup-02", text: "Driver package scheduled for installation." }],
    },
    {
      id: "t-416", ref: "HD-26-00416", raisedBy: "u-app-05", category: "account", subject: "Mobile number change",
      description: "Need to update the mobile number linked to my account.", status: "awaiting_user", priority: "low",
      createdAt: daysAgo(1, now), updatedAt: hoursAgo(10, now), assigneeId: "u-sup-01",
      thread: [{ at: daysAgo(1, now), authorId: "u-app-05", text: "Please update my mobile number." }, { at: hoursAgo(10, now), authorId: "u-sup-01", text: "Please confirm the request from your registered email address." }],
    },
  ];

  const integrations: Integration[] = [
    { key: "nid", name: "National ID verification", owner: "Election Commission (NID Wing)", purpose: "Applicant registration with NID verification", torRef: "3.2(b), 1.8", direction: "outbound", state: "existing_upgrade" },
    { key: "iab", name: "Professional body — IAB", owner: "Institute of Architects Bangladesh", purpose: "Architect membership verification", torRef: "1.8", direction: "outbound", state: "existing_upgrade" },
    { key: "ieb", name: "Professional body — IEB", owner: "Institution of Engineers, Bangladesh", purpose: "Engineer membership verification", torRef: "1.8", direction: "outbound", state: "existing_upgrade" },
    { key: "bip", name: "Professional body — BIP", owner: "Bangladesh Institute of Planners", purpose: "Planner membership verification", torRef: "1.8", direction: "outbound", state: "existing_upgrade" },
    { key: "ideb", name: "Professional body — IDEB", owner: "Institution of Diploma Engineers, Bangladesh", purpose: "Diploma engineer verification", torRef: "2.2", direction: "outbound", state: "conditional" },
    { key: "bida", name: "BIDA One Stop Service", owner: "Bangladesh Investment Development Authority", purpose: "Bidirectional application sync, status updates and notifications", torRef: "2.2", direction: "bidirectional", state: "new_required" },
    { key: "housing", name: "Housing data (NHA, PWD, approved private projects)", owner: "NHA / PWD / RAJUK", purpose: "Standardised plot identifiers (RS Dag, Mouza)", torRef: "1.7, 2.1", direction: "inbound", state: "new_required" },
    { key: "sms", name: "SMS gateway", owner: "Messaging provider (SSL Wireless per TOR stack)", purpose: "OTP and status notifications", torRef: "1.8, 1.9", direction: "outbound", state: "existing_upgrade" },
    { key: "payment", name: "Online payment gateway", owner: "SSLCommerz (per TOR stack)", purpose: "Fee collection and reconciliation", torRef: "1.8, 2.6", direction: "bidirectional", state: "existing_upgrade" },
    { key: "maps", name: "Google Maps", owner: "Key to be provided by RAJUK", purpose: "Plot location on map linked to DAP", torRef: "2.3", direction: "outbound", state: "conditional" },
    { key: "dap", name: "DAP map layers", owner: "RAJUK Town Planning", purpose: "Land-use zone lookup for plots and inspections", torRef: "1.12, 2.3, 2.8", direction: "inbound", state: "new_required" },
  ];

  const migration: MigrationBatch[] = [
    { id: "mb-01", label: "Batch 01", sourceRange: "Legacy CP 2008–2010", records: 4210, migrated: 4210, failed: 0, status: "reconciled", startedAt: daysAgo(20, now) },
    { id: "mb-02", label: "Batch 02", sourceRange: "Legacy CP 2011–2013", records: 6385, migrated: 6342, failed: 43, status: "exceptions", startedAt: daysAgo(12, now) },
    { id: "mb-03", label: "Batch 03", sourceRange: "Legacy CP 2014–2016", records: 7120, migrated: 2980, failed: 0, status: "validating", startedAt: daysAgo(1, now) },
    { id: "mb-04", label: "Batch 04", sourceRange: "Legacy CP 2017–2019", records: 8044, migrated: 0, failed: 0, status: "queued" },
  ];

  const reverts: RevertRequest[] = [
    { id: "rv-1", applicationId: "a-214", fromState: "rejected", toStage: "authorized_officer", reason: "Rejection letter issued against wrong revision; applicant's revised drawings were not considered.", requestedBy: "u-off-01", requestedAt: daysAgo(2, now), status: "pending" },
    { id: "rv-2", applicationId: "a-215", fromState: "archive", toStage: "authorized_officer", reason: "Legacy record needed for RDC verification.", requestedBy: "u-off-02", requestedAt: daysAgo(9, now), status: "approved", decidedBy: "u-adm-01", decidedAt: daysAgo(8, now) },
  ];

  const twoC: TwoCFile[] = [
    { id: "2c-1", fileNo: "2C/Z4/2026/014 (demo)", subject: "Construction beyond approved storeys", premises: "Plot 18, Road 6, Pallabi (fictional)", openedOn: daysAgo(40, now), status: "notice_issued", custodianId: "u-off-01", documents: [{ name: "Site inspection report", addedOn: daysAgo(40, now) }, { name: "Notice copy", addedOn: daysAgo(30, now) }], movements: [{ at: daysAgo(40, now), fromId: "u-ins-01", toId: "u-off-02", note: "Opened from inspection." }, { at: daysAgo(31, now), fromId: "u-off-02", toId: "u-off-01", note: "For notice approval." }] },
    { id: "2c-2", fileNo: "2C/Z4/2026/009 (demo)", subject: "Setback encroachment", premises: "Plot 7, Road 3, Shyamoli (fictional)", openedOn: daysAgo(75, now), status: "hearing", custodianId: "u-off-02", documents: [{ name: "Complaint", addedOn: daysAgo(75, now) }, { name: "Hearing notice", addedOn: daysAgo(20, now) }], movements: [{ at: daysAgo(75, now), fromId: "u-fd-01", toId: "u-off-02", note: "Complaint registered." }] },
    { id: "2c-3", fileNo: "2C/Z4/2025/051 (demo)", subject: "Unauthorised change of use", premises: "Plot 22, Mohammadpur (fictional)", openedOn: daysAgo(210, now), status: "closed", custodianId: "u-off-01", documents: [{ name: "Closure note", addedOn: daysAgo(30, now) }], movements: [] },
  ];

  const nocs: NocRecord[] = [{ id: "noc-1", applicationId: "a-216", issuedOn: daysAgo(130, now), issuedBy: "u-est-01", memoNo: "EST/NOC/DEMO/0921", status: "verified" }];

  const notices: SystemNotice[] = [
    { id: "nt-1", title: "Scheduled maintenance window", titleBn: "নির্ধারিত রক্ষণাবেক্ষণ", body: "ECPS services may be briefly unavailable on Friday between 01:00 and 03:00 (demo notice).", bodyBn: "শুক্রবার রাত ১টা থেকে ৩টা পর্যন্ত সেবা সাময়িকভাবে বন্ধ থাকতে পারে (ডেমো নোটিশ)।", kind: "maintenance", publishedAt: hoursAgo(20, now), visibleOnPortal: true },
    { id: "nt-2", title: "Dhaka Mohanagar Imarat Bidhimala 2025 — workflow updates in progress", titleBn: "ঢাকা মহানগর ইমারত বিধিমালা ২০২৫ — কার্যপ্রবাহ হালনাগাদ চলমান", body: "Application forms, fee calculation and approval letters are being aligned with the 2025 Rules as approved by RAJUK.", bodyBn: "রাজউক অনুমোদিত ২০২৫ বিধিমালা অনুযায়ী আবেদন ফরম, ফি হিসাব ও অনুমোদনপত্র হালনাগাদ করা হচ্ছে।", kind: "regulatory", publishedAt: daysAgo(5, now), visibleOnPortal: true },
    { id: "nt-3", title: "Plot GPS coordinates and photographs now required", titleBn: "প্লটের জিপিএস স্থানাঙ্ক ও ছবি এখন আবশ্যক", body: "Applications must include geographic coordinates, plot photographs and adjacent-road photographs (proposed per TOR 2.3).", bodyBn: "আবেদনে ভৌগোলিক স্থানাঙ্ক, প্লটের ছবি ও সংলগ্ন রাস্তার ছবি সংযুক্ত করতে হবে (টিওআর ২.৩ অনুযায়ী প্রস্তাবিত)।", kind: "general", publishedAt: daysAgo(12, now), visibleOnPortal: true },
  ];

  const scheduler: SchedulerJob[] = [
    { id: "j-1", name: "Holding-limit escalation", cron: "0 8 * * 0-4", description: "Flags files exceeding stage holding limits and notifies supervisors.", enabled: true, lastRunAt: hoursAgo(6, now), lastResult: "success" },
    { id: "j-2", name: "Monthly monitoring report", cron: "0 6 1 * *", description: "Generates consolidated monthly report (TOR 1.1).", enabled: true, lastRunAt: daysAgo(21, now), lastResult: "success" },
    { id: "j-3", name: "Payment reconciliation", cron: "30 23 * * *", description: "Matches gateway settlements against ECPS ledger.", enabled: true, lastRunAt: hoursAgo(11, now), lastResult: "failed" },
    { id: "j-4", name: "Public Register publication", cron: "0 * * * *", description: "Publishes newly approved PP/CP summaries.", enabled: true, lastRunAt: hoursAgo(1, now), lastResult: "success" },
    { id: "j-5", name: "Legacy CP migration batch", cron: "manual", description: "Runs the next queued migration batch.", enabled: false, lastRunAt: daysAgo(1, now), lastResult: "success" },
    { id: "j-6", name: "PP validity expiry reminders", cron: "0 9 * * 0", description: "Notifies owners 60 days before validity ends.", enabled: true, lastRunAt: daysAgo(5, now), lastResult: "success" },
  ];

  const far: FarRow[] = [
    { id: "f1", plotFromSqm: 0, plotToSqm: 134, roadWidthMinM: 6, far: 3.0, maxGroundCoveragePct: 67 },
    { id: "f2", plotFromSqm: 134, plotToSqm: 268, roadWidthMinM: 6, far: 3.5, maxGroundCoveragePct: 65 },
    { id: "f3", plotFromSqm: 268, plotToSqm: 536, roadWidthMinM: 7.5, far: 4.0, maxGroundCoveragePct: 62 },
    { id: "f4", plotFromSqm: 536, plotToSqm: 1072, roadWidthMinM: 9, far: 4.5, maxGroundCoveragePct: 60 },
    { id: "f5", plotFromSqm: 1072, plotToSqm: 99999, roadWidthMinM: 12, far: 5.5, maxGroundCoveragePct: 55 },
  ];

  const dap: DapZone[] = [
    { id: "dz1", code: "R-U", label: "Residential zone (urban)", permittedOccupancies: ["A", "B", "D", "F"], notes: "Illustrative mapping — confirm against DAP 2022–2035 schedules." },
    { id: "dz2", code: "C", label: "Commercial zone", permittedOccupancies: ["A", "E", "F", "I"], notes: "Illustrative." },
    { id: "dz3", code: "MX", label: "Mixed-use zone", permittedOccupancies: ["A", "E", "F", "B"], notes: "Illustrative." },
    { id: "dz4", code: "IND", label: "Industrial zone", permittedOccupancies: ["G", "H", "L"], notes: "Illustrative." },
    { id: "dz5", code: "OS", label: "Open space / flood flow", permittedOccupancies: [], notes: "Illustrative — no construction." },
  ];

  return {
    seededAt: new Date(now).toISOString(),
    users: USERS,
    applications,
    signing,
    meetings,
    inspections,
    payments,
    notifications,
    audit,
    tickets,
    integrations,
    migration,
    reverts,
    twoC,
    nocs,
    notices,
    scheduler,
    security: {
      idleTimeoutMinutes: 15,
      warnBeforeSeconds: 60,
      mfaOnApproval: true,
      otpForUntrustedDevice: true,
      forcePasswordChangeOnFirstLogin: true,
      password: { minLength: 12, expiryDays: 90, history: 5, requireSymbols: true },
      maxFailedAttempts: 5,
    },
    holdingLimits: { ...DEFAULT_HOLDING_LIMITS },
    far,
    dap,
    issuedPermits: [],
    counters: { application: 400, ticket: 419 },
  };
}
