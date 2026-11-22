import type { DocumentCategory, OccupancyKey, ProfessionalRole, ServiceType } from "./types";

/**
 * Permit service catalogue.
 * Service names follow the TOR §3.2(a) functional overview. Descriptions are written for this
 * prototype; they do not state official fees or statutory turnaround times.
 */
export interface ServiceDefinition {
  type: ServiceType;
  slug: string;
  short: string;
  nameKey: string;
  descKey: string;
  audience: "owner" | "professional" | "both";
  group: "permits" | "after_approval" | "appeals" | "information";
  torRefs: string[];
  /** Whether the prototype offers an interactive application wizard for this service. */
  wizard: boolean;
  requiresProfessionals: ProfessionalRole[];
  keyDocuments: DocumentCategory[];
  /** Status of this service in the proposed upgrade. */
  scope: "existing" | "existing_enhanced" | "new";
}

export const SERVICES: ServiceDefinition[] = [
  {
    type: "PP",
    slug: "planning-permit",
    short: "PP",
    nameKey: "service.PP.name",
    descKey: "service.PP.desc",
    audience: "both",
    group: "permits",
    torRefs: ["1.3", "1.10", "2.3", "2.9"],
    wizard: true,
    requiresProfessionals: ["architect"],
    keyDocuments: ["nid", "tax_return", "photo", "ownership", "plot_photo", "road_photo", "drawing"],
    scope: "existing_enhanced",
  },
  {
    type: "PP_PRIVATE_HOUSING",
    slug: "private-housing-planning-permit",
    short: "PP-H",
    nameKey: "service.PP_PRIVATE_HOUSING.name",
    descKey: "service.PP_PRIVATE_HOUSING.desc",
    audience: "both",
    group: "permits",
    torRefs: ["2.1", "1.7"],
    wizard: true,
    requiresProfessionals: ["architect"],
    keyDocuments: ["nid", "tax_return", "photo", "ownership", "plot_photo", "road_photo"],
    scope: "new",
  },
  {
    type: "CP",
    slug: "construction-permit",
    short: "CP",
    nameKey: "service.CP.name",
    descKey: "service.CP.desc",
    audience: "both",
    group: "permits",
    torRefs: ["1.4", "1.11", "1.13", "1.15"],
    wizard: true,
    requiresProfessionals: ["architect", "structural", "electrical", "plumbing"],
    keyDocuments: ["nid", "tax_return", "photo", "ownership", "drawing", "certificate", "professional"],
    scope: "existing_enhanced",
  },
  {
    type: "RDC",
    slug: "revised-permit",
    short: "RDC",
    nameKey: "service.RDC.name",
    descKey: "service.RDC.desc",
    audience: "both",
    group: "permits",
    torRefs: ["1.5"],
    wizard: false,
    requiresProfessionals: ["architect", "structural"],
    keyDocuments: ["drawing", "certificate", "professional"],
    scope: "existing_enhanced",
  },
  {
    type: "LSP",
    slug: "large-special-projects",
    short: "LSP",
    nameKey: "service.LSP.name",
    descKey: "service.LSP.desc",
    audience: "professional",
    group: "permits",
    torRefs: ["1.6", "1.10"],
    wizard: false,
    requiresProfessionals: ["architect", "structural", "electrical", "plumbing"],
    keyDocuments: ["drawing", "certificate", "professional"],
    scope: "existing_enhanced",
  },
  {
    type: "CSN",
    slug: "construction-start-notice",
    short: "CSN",
    nameKey: "service.CSN.name",
    descKey: "service.CSN.desc",
    audience: "both",
    group: "after_approval",
    torRefs: ["1.2"],
    wizard: false,
    requiresProfessionals: ["supervisor"],
    keyDocuments: ["certificate"],
    scope: "existing_enhanced",
  },
  {
    type: "OC",
    slug: "occupancy-certificate",
    short: "OC",
    nameKey: "service.OC.name",
    descKey: "service.OC.desc",
    audience: "both",
    group: "after_approval",
    torRefs: ["1.10"],
    wizard: false,
    requiresProfessionals: ["supervisor"],
    keyDocuments: ["certificate", "photo"],
    scope: "existing_enhanced",
  },
  {
    type: "PP_RENEWAL",
    slug: "planning-permit-renewal",
    short: "REN",
    nameKey: "service.PP_RENEWAL.name",
    descKey: "service.PP_RENEWAL.desc",
    audience: "owner",
    group: "after_approval",
    torRefs: ["1.10"],
    wizard: false,
    requiresProfessionals: [],
    keyDocuments: ["letter"],
    scope: "existing_enhanced",
  },
  {
    type: "APPEAL",
    slug: "appeal",
    short: "APL",
    nameKey: "service.APPEAL.name",
    descKey: "service.APPEAL.desc",
    audience: "owner",
    group: "appeals",
    torRefs: ["3.2(a)", "1.10"],
    wizard: false,
    requiresProfessionals: [],
    keyDocuments: ["letter"],
    scope: "existing_enhanced",
  },
  {
    type: "OC_APPEAL",
    slug: "occupancy-certificate-appeal",
    short: "OCA",
    nameKey: "service.OC_APPEAL.name",
    descKey: "service.OC_APPEAL.desc",
    audience: "owner",
    group: "appeals",
    torRefs: ["2.4"],
    wizard: false,
    requiresProfessionals: [],
    keyDocuments: ["letter"],
    scope: "new",
  },
];

export const serviceByType = (t: ServiceType) => SERVICES.find((s) => s.type === t)!;
export const serviceBySlug = (slug: string) => SERVICES.find((s) => s.slug === slug);

export const SERVICE_SHORT_LABEL: Record<ServiceType, string> = {
  PP: "Planning Permit",
  PP_PRIVATE_HOUSING: "PP · Private Housing",
  CP: "Construction Permit",
  RDC: "Revised Permit (RDC)",
  LSP: "Large & Special Project",
  OC: "Occupancy Certificate",
  OC_APPEAL: "OC Appeal",
  PP_RENEWAL: "PP Renewal",
  APPEAL: "Appeal",
  CSN: "Construction Start Notice",
};

/** BNBC 2020 occupancy classification (group names). */
export const OCCUPANCY: Record<OccupancyKey, string> = {
  A: "Residential",
  B: "Educational",
  C: "Institutional",
  D: "Health care",
  E: "Business",
  F: "Mercantile",
  G: "Industrial",
  H: "Storage",
  I: "Assembly",
  J: "Hazardous",
  K: "Garage",
  L: "Utility",
  M: "Miscellaneous",
};

export const PROFESSIONAL_ROLE_LABEL: Record<ProfessionalRole, string> = {
  architect: "Architect",
  structural: "Structural Engineer",
  electrical: "Electrical Engineer",
  plumbing: "Plumbing Engineer",
  supervisor: "Construction Supervision Engineer",
};

export const DOCUMENT_CATEGORY_LABEL: Record<DocumentCategory, string> = {
  nid: "NID document",
  tax_return: "Tax-return slip",
  photo: "Photograph",
  ownership: "Ownership record",
  drawing: "Drawing",
  certificate: "Certificate",
  plot_photo: "Plot photograph",
  road_photo: "Adjacent-road photograph",
  professional: "Professional attachment",
  noc: "No-objection certificate",
  letter: "Letter",
};

export const ZONES = ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7", "Zone 8"];

export const AREAS = [
  "Dhanmondi",
  "Mirpur",
  "Uttara",
  "Gulshan",
  "Mohammadpur",
  "Badda",
  "Banani",
  "Bashundhara",
  "Khilgaon",
  "Purbachal",
  "Tejgaon",
  "Motijheel",
];
