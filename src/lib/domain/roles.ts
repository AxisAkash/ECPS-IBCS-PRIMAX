import type { RoleKey } from "./types";

/**
 * Role-based access model for the demo navigation (TOR 1.9 RBAC, 2.8 role/access management).
 * In production these permissions must be enforced by the server; the frontend only hides
 * navigation it knows the user cannot use.
 */
export type Permission =
  | "application.create"
  | "application.view_own"
  | "invitation.respond"
  | "file.view_zone"
  | "file.process"
  | "file.route"
  | "file.approve"
  | "document.sign"
  | "committee.vote"
  | "inspection.perform"
  | "estate.noc"
  | "finance.view"
  | "finance.export"
  | "management.view"
  | "monitoring.view"
  | "admin.users"
  | "admin.config"
  | "admin.security"
  | "audit.view"
  | "helpdesk.manage"
  | "integration.view"
  | "file.revert"
  | "twoc.manage";

export const PERMISSION_LABEL: Record<Permission, string> = {
  "application.create": "Create & submit applications",
  "application.view_own": "View own applications",
  "invitation.respond": "Respond to professional invitations",
  "file.view_zone": "View zone file queue",
  "file.process": "Process assigned files",
  "file.route": "Route files between stages & departments",
  "file.approve": "Approve / reject files (MFA)",
  "document.sign": "Digitally sign approval documents",
  "committee.vote": "Vote in BC Committee",
  "inspection.perform": "Perform & submit inspections",
  "estate.noc": "Upload NOC / verify PP (Estate)",
  "finance.view": "View finance dashboard",
  "finance.export": "Export finance reports",
  "management.view": "View management dashboards",
  "monitoring.view": "Officer record monitoring",
  "admin.users": "Manage users & roles",
  "admin.config": "Manage configuration & parameters",
  "admin.security": "Manage security settings",
  "audit.view": "View audit trail",
  "helpdesk.manage": "Manage helpdesk tickets",
  "integration.view": "View integrations & migration",
  "file.revert": "Request / approve file revert",
  "twoc.manage": "Manage 2C files",
};

export const ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  applicant: ["application.create", "application.view_own"],
  professional: ["application.create", "application.view_own", "invitation.respond"],
  officer: [
    "file.view_zone",
    "file.process",
    "file.route",
    "file.approve",
    "document.sign",
    "monitoring.view",
    "file.revert",
    "twoc.manage",
  ],
  inspector: ["inspection.perform", "file.view_zone", "file.process"],
  committee: ["committee.vote"],
  estate: ["estate.noc", "file.view_zone"],
  finance: ["finance.view", "finance.export"],
  management: ["management.view", "monitoring.view", "finance.view", "integration.view", "audit.view"],
  admin: ["admin.users", "admin.config", "admin.security", "audit.view", "integration.view", "file.revert"],
  support: ["helpdesk.manage"],
};

export interface RoleMeta {
  key: RoleKey;
  label: string;
  workspace: "workspace" | "rajuk";
  home: string;
}

export const ROLES: RoleMeta[] = [
  { key: "applicant", label: "Applicant", workspace: "workspace", home: "/workspace" },
  { key: "professional", label: "Professional", workspace: "workspace", home: "/workspace" },
  { key: "officer", label: "RAJUK Officer", workspace: "rajuk", home: "/rajuk" },
  { key: "inspector", label: "Inspector", workspace: "rajuk", home: "/rajuk/inspections" },
  { key: "committee", label: "Committee User", workspace: "rajuk", home: "/rajuk/committee" },
  { key: "estate", label: "Estate Officer", workspace: "rajuk", home: "/rajuk/estate" },
  { key: "finance", label: "Finance Officer", workspace: "rajuk", home: "/rajuk/finance" },
  { key: "management", label: "Management", workspace: "rajuk", home: "/rajuk/management" },
  { key: "admin", label: "Administrator", workspace: "rajuk", home: "/rajuk/admin" },
  { key: "support", label: "Support", workspace: "rajuk", home: "/rajuk/helpdesk" },
];

export const roleMeta = (k: RoleKey) => ROLES.find((r) => r.key === k)!;

export function can(role: RoleKey | undefined, p: Permission) {
  return role ? ROLE_PERMISSIONS[role].includes(p) : false;
}
