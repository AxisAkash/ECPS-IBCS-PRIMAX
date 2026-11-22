import {
  ArrowLeftRight,
  Bell,
  Building2,
  CalendarCheck2,
  ClipboardCheck,
  Coins,
  FileSignature,
  FileStack,
  FolderArchive,
  FolderOpen,
  Gavel,
  HardHat,
  Headset,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  MailPlus,
  Network,
  ReceiptText,
  ScrollText,
  Settings2,
  UserCircle2,
  type LucideIcon,
} from "lucide-react";
import type { RoleKey } from "@/lib/domain/types";
import type { MessageKey } from "@/lib/i18n";

export interface NavItem {
  href: string;
  label: string;
  labelKey?: MessageKey;
  icon: LucideIcon;
  exact?: boolean;
  badge?: "notifications" | "invitations" | "inbox" | "signing" | "tickets" | "inspections";
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const WORKSPACE_NAV: Record<"applicant" | "professional", NavGroup[]> = {
  applicant: [
    {
      items: [
        { href: "/workspace", label: "Dashboard", labelKey: "nav.ws.dashboard", icon: LayoutDashboard, exact: true },
        { href: "/workspace/applications", label: "Applications", labelKey: "nav.ws.applications", icon: FileStack },
        { href: "/workspace/documents", label: "Documents", labelKey: "nav.ws.documents", icon: FolderOpen },
        { href: "/workspace/payments", label: "Payments", labelKey: "nav.ws.payments", icon: ReceiptText },
        { href: "/workspace/notifications", label: "Notifications", labelKey: "nav.ws.notifications", icon: Bell, badge: "notifications" },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/workspace/support", label: "Support", labelKey: "nav.ws.support", icon: LifeBuoy },
        { href: "/workspace/profile", label: "Profile", labelKey: "nav.ws.profile", icon: UserCircle2 },
      ],
    },
  ],
  professional: [
    {
      items: [
        { href: "/workspace", label: "Dashboard", labelKey: "nav.ws.dashboard", icon: LayoutDashboard, exact: true },
        { href: "/workspace/invitations", label: "Invitations", labelKey: "nav.ws.invitations", icon: MailPlus, badge: "invitations" },
        { href: "/workspace/applications", label: "Applications", labelKey: "nav.ws.applications", icon: FileStack },
        { href: "/workspace/documents", label: "Documents", labelKey: "nav.ws.documents", icon: FolderOpen },
        { href: "/workspace/notifications", label: "Notifications", labelKey: "nav.ws.notifications", icon: Bell, badge: "notifications" },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/workspace/support", label: "Support", labelKey: "nav.ws.support", icon: LifeBuoy },
        { href: "/workspace/profile", label: "Profile", labelKey: "nav.ws.profile", icon: UserCircle2 },
      ],
    },
  ],
};

const I = {
  overview: { href: "/rajuk", label: "Overview", icon: LayoutDashboard, exact: true },
  inbox: { href: "/rajuk/inbox", label: "File inbox", icon: Inbox, badge: "inbox" as const },
  signing: { href: "/rajuk/signing", label: "Document signing", icon: FileSignature, badge: "signing" as const },
  committee: { href: "/rajuk/committee", label: "BC Committee", icon: Gavel },
  inspections: { href: "/rajuk/inspections", label: "Inspections", icon: HardHat, badge: "inspections" as const },
  monitoring: { href: "/rajuk/monitoring", label: "Record monitoring", icon: ClipboardCheck },
  reverts: { href: "/rajuk/reverts", label: "File reverts", icon: ArrowLeftRight },
  twoC: { href: "/rajuk/2c-files", label: "2C files", icon: FolderArchive },
  estate: { href: "/rajuk/estate", label: "Estate · NOC", icon: Building2 },
  finance: { href: "/rajuk/finance", label: "Finance", icon: Coins },
  management: { href: "/rajuk/management", label: "Management", icon: LineChart },
  integrations: { href: "/rajuk/integrations", label: "Integrations & migration", icon: Network },
  admin: { href: "/rajuk/admin", label: "Administration", icon: Settings2 },
  audit: { href: "/rajuk/admin/audit", label: "Audit trail", icon: ScrollText },
  helpdesk: { href: "/rajuk/helpdesk", label: "Helpdesk", icon: Headset, badge: "tickets" as const },
  agenda: { href: "/rajuk/committee", label: "Committee agenda", icon: CalendarCheck2 },
} satisfies Record<string, NavItem>;

export const RAJUK_NAV: Record<Exclude<RoleKey, "applicant" | "professional">, NavGroup[]> = {
  officer: [
    { items: [I.overview, I.inbox, I.signing, I.agenda] },
    { label: "Records", items: [I.monitoring, I.reverts, I.twoC] },
  ],
  inspector: [{ items: [I.inspections, { ...I.inbox, label: "My files" }] }],
  committee: [{ items: [I.committee] }],
  estate: [{ items: [I.estate, { ...I.inbox, label: "Routed files" }] }],
  finance: [{ items: [I.finance] }],
  management: [
    { items: [I.management, I.monitoring, I.finance] },
    { label: "Platform", items: [I.integrations] },
  ],
  admin: [
    { items: [I.admin, I.audit] },
    { label: "Platform", items: [I.integrations, I.reverts] },
  ],
  support: [{ items: [I.helpdesk] }],
};
