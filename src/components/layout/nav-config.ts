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
  labelKey: MessageKey;
  icon: LucideIcon;
  exact?: boolean;
  badge?: "notifications" | "invitations" | "inbox" | "signing" | "tickets" | "inspections";
}

export interface NavGroup {
  labelKey?: MessageKey;
  items: NavItem[];
}

export const WORKSPACE_NAV: Record<"applicant" | "professional", NavGroup[]> = {
  applicant: [
    {
      items: [
        { href: "/workspace", labelKey: "nav.ws.dashboard", icon: LayoutDashboard, exact: true },
        { href: "/workspace/applications", labelKey: "nav.ws.applications", icon: FileStack },
        { href: "/workspace/documents", labelKey: "nav.ws.documents", icon: FolderOpen },
        { href: "/workspace/payments", labelKey: "nav.ws.payments", icon: ReceiptText },
        { href: "/workspace/notifications", labelKey: "nav.ws.notifications", icon: Bell, badge: "notifications" },
      ],
    },
    {
      labelKey: "nav.grp.account",
      items: [
        { href: "/workspace/support", labelKey: "nav.ws.support", icon: LifeBuoy },
        { href: "/workspace/profile", labelKey: "nav.ws.profile", icon: UserCircle2 },
      ],
    },
  ],
  professional: [
    {
      items: [
        { href: "/workspace", labelKey: "nav.ws.dashboard", icon: LayoutDashboard, exact: true },
        { href: "/workspace/invitations", labelKey: "nav.ws.invitations", icon: MailPlus, badge: "invitations" },
        { href: "/workspace/applications", labelKey: "nav.ws.applications", icon: FileStack },
        { href: "/workspace/documents", labelKey: "nav.ws.documents", icon: FolderOpen },
        { href: "/workspace/notifications", labelKey: "nav.ws.notifications", icon: Bell, badge: "notifications" },
      ],
    },
    {
      labelKey: "nav.grp.account",
      items: [
        { href: "/workspace/support", labelKey: "nav.ws.support", icon: LifeBuoy },
        { href: "/workspace/profile", labelKey: "nav.ws.profile", icon: UserCircle2 },
      ],
    },
  ],
};

const I = {
  overview: { href: "/rajuk", labelKey: "nav.rk.overview", icon: LayoutDashboard, exact: true },
  inbox: { href: "/rajuk/inbox", labelKey: "nav.rk.inbox", icon: Inbox, badge: "inbox" as const },
  signing: { href: "/rajuk/signing", labelKey: "nav.rk.signing", icon: FileSignature, badge: "signing" as const },
  committee: { href: "/rajuk/committee", labelKey: "nav.rk.committee", icon: Gavel },
  inspections: { href: "/rajuk/inspections", labelKey: "nav.rk.inspections", icon: HardHat, badge: "inspections" as const },
  monitoring: { href: "/rajuk/monitoring", labelKey: "nav.rk.monitoring", icon: ClipboardCheck },
  reverts: { href: "/rajuk/reverts", labelKey: "nav.rk.reverts", icon: ArrowLeftRight },
  twoC: { href: "/rajuk/2c-files", labelKey: "nav.rk.twoC", icon: FolderArchive },
  estate: { href: "/rajuk/estate", labelKey: "nav.rk.estate", icon: Building2 },
  finance: { href: "/rajuk/finance", labelKey: "nav.rk.finance", icon: Coins },
  management: { href: "/rajuk/management", labelKey: "nav.rk.management", icon: LineChart },
  integrations: { href: "/rajuk/integrations", labelKey: "nav.rk.integrations", icon: Network },
  admin: { href: "/rajuk/admin", labelKey: "nav.rk.admin", icon: Settings2 },
  audit: { href: "/rajuk/admin/audit", labelKey: "nav.rk.audit", icon: ScrollText },
  helpdesk: { href: "/rajuk/helpdesk", labelKey: "nav.rk.helpdesk", icon: Headset, badge: "tickets" as const },
  agenda: { href: "/rajuk/committee", labelKey: "nav.rk.agenda", icon: CalendarCheck2 },
} satisfies Record<string, NavItem>;

export const RAJUK_NAV: Record<Exclude<RoleKey, "applicant" | "professional">, NavGroup[]> = {
  officer: [
    { items: [I.overview, I.inbox, I.signing, I.agenda] },
    { labelKey: "nav.grp.records", items: [I.monitoring, I.reverts, I.twoC] },
  ],
  inspector: [{ items: [I.inspections, { ...I.inbox, labelKey: "nav.rk.myfiles" }] }],
  committee: [{ items: [I.committee] }],
  estate: [{ items: [I.estate, { ...I.inbox, labelKey: "nav.rk.routed" }] }],
  finance: [{ items: [I.finance] }],
  management: [
    { items: [I.management, I.monitoring, I.finance] },
    { labelKey: "nav.grp.platform", items: [I.integrations] },
  ],
  admin: [
    { items: [I.admin, I.audit] },
    { labelKey: "nav.grp.platform", items: [I.integrations, I.reverts] },
  ],
  support: [{ items: [I.helpdesk] }],
};
