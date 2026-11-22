"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Check,
  Clock,
  Download,
  Gavel,
  Layers,
  Lock,
  Megaphone,
  Play,
  ScrollText,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Timer,
  UserCog,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Avatar, Badge, PageHeader, Panel, Tag } from "@/components/ui/display";
import { Callout, SimulatedTag } from "@/components/ui/feedback";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/form";
import { ConfirmDialog } from "@/components/ui/overlay";
import { toast } from "@/components/ui/toast";
import { OCCUPANCY } from "@/lib/domain/catalog";
import { PERMISSION_LABEL, ROLE_PERMISSIONS, ROLES, type Permission } from "@/lib/domain/roles";
import type { AuditEntry, FarRow, SecuritySettings, StageKey, User } from "@/lib/domain/types";
import { DEPARTMENT_LABEL, STAGE_LABEL } from "@/lib/domain/workflow";
import { useDemoStore, userName } from "@/lib/store/demo-store";
import { cn, downloadText, formatDateTime, formatRelative, toCsv } from "@/lib/utils";

const SECTIONS: Array<{ slug: string; label: string; icon: LucideIcon; desc: string }> = [
  { slug: "", label: "Overview", icon: SlidersHorizontal, desc: "Health of configuration and pending admin work" },
  { slug: "users", label: "Users", icon: Users, desc: "Single user profile per employee (TOR 2.8)" },
  { slug: "roles", label: "Roles & permissions", icon: UserCog, desc: "RBAC matrix (TOR 1.9)" },
  { slug: "committees", label: "Departments & committees", icon: Gavel, desc: "Committee formation and membership (TOR 1.10, 2.8)" },
  { slug: "workflow", label: "Workflow & holding limits", icon: Workflow, desc: "Stage holding limits used for red flags (TOR 1.1)" },
  { slug: "parameters", label: "DAP & FAR parameters", icon: Layers, desc: "FAR table and DAP land-use rules (TOR 1.15, 2.8)" },
  { slug: "security", label: "Security & session", icon: ShieldCheck, desc: "Inactivity logout, MFA, OTP, password policy (TOR 1.9)" },
  { slug: "scheduler", label: "Scheduler & reports", icon: CalendarClock, desc: "Background jobs and report delivery (TOR 2.8)" },
  { slug: "notifications", label: "System notifications", icon: Megaphone, desc: "Portal notices and maintenance messages" },
  { slug: "audit", label: "Audit trail", icon: ScrollText, desc: "Who did what, when and from where" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const current = pathname.replace(/^\/rajuk\/admin\/?/, "");
  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <nav aria-label="Administration" className="lg:sticky lg:top-24 lg:self-start">
        <p className="kicker mb-3">Administration</p>
        <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {SECTIONS.map((s) => {
            const on = current === s.slug;
            return (
              <li key={s.slug} className="shrink-0">
                <Link
                  href={`/rajuk/admin${s.slug ? `/${s.slug}` : ""}`}
                  aria-current={on ? "page" : undefined}
                  className={cn("flex items-center gap-2.5 rounded-md px-3 py-2 text-[0.8125rem] font-medium transition-colors", on ? "bg-navy-900 text-white" : "text-ink hover:bg-surface-3")}
                >
                  <s.icon className={cn("size-4", on ? "text-amber-200" : "text-subtle")} aria-hidden />
                  {s.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function SensitiveNote() {
  return (
    <Callout tone="warning" icon={AlertTriangle} className="mb-5">
      Changes here affect every user immediately and are written to the audit trail. In production, sensitive changes should require a second approver.
    </Callout>
  );
}

/* ———————————————————————————— Overview ———————————————————————————— */

export function AdminOverview() {
  const users = useDemoStore((s) => s.users);
  const security = useDemoStore((s) => s.security);
  const scheduler = useDemoStore((s) => s.scheduler);
  const audit = useDemoStore((s) => s.audit);
  const notices = useDemoStore((s) => s.notices);
  const dup = users.filter((u) => u.status === "pending");
  const failed = scheduler.filter((j) => j.lastResult === "failed");
  const tiles = [
    { slug: "users", value: users.filter((u) => u.status === "active").length, label: "Active users", alert: dup.length ? `${dup.length} duplicate profile request` : undefined },
    { slug: "security", value: `${security.idleTimeoutMinutes} min`, label: "Inactivity logout", alert: !security.mfaOnApproval ? "MFA at approval is OFF" : undefined },
    { slug: "scheduler", value: scheduler.filter((j) => j.enabled).length, label: "Scheduled jobs enabled", alert: failed.length ? `${failed.length} job failed last run` : undefined },
    { slug: "notifications", value: notices.filter((n) => n.visibleOnPortal).length, label: "Notices on public portal" },
    { slug: "audit", value: audit.filter((a) => a.severity === "warning").length, label: "Warning events (demo window)" },
  ];
  return (
    <AdminShell>
      <PageHeader title="Administration" description="Configuration for the ECPS platform. Every change is audited." />
      <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.slug} href={`/rajuk/admin/${t.slug}`} className="bg-surface p-5 transition-colors hover:bg-surface-2">
            <p className="text-xs text-muted">{t.label}</p>
            <p className="tabular mt-1 font-display text-2xl font-semibold text-ink-strong">{t.value}</p>
            {t.alert ? <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700"><AlertTriangle className="size-3.5" aria-hidden /> {t.alert}</p> : <p className="mt-2 flex items-center gap-1.5 text-xs text-success-700"><Check className="size-3.5" aria-hidden /> No issues</p>}
          </Link>
        ))}
      </div>
      <ul className="mt-6 grid gap-3 md:grid-cols-2">
        {SECTIONS.slice(1).map((s) => (
          <li key={s.slug}>
            <Link href={`/rajuk/admin/${s.slug}`} className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4 hover:border-teal-600/40">
              <span className="grid size-10 place-items-center rounded-lg bg-surface-3 text-slate-ink">
                <s.icon className="size-[18px]" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink-strong">{s.label}</span>
                <span className="block text-xs text-muted">{s.desc}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}

/* ———————————————————————————— Users ———————————————————————————— */

export function AdminUsers() {
  const users = useDemoStore((s) => s.users);
  const setStatus = useDemoStore((s) => s.setUserStatus);
  const merge = useDemoStore((s) => s.mergeDuplicateUser);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [pending, setPending] = useState<{ user: User; to: "active" | "suspended" } | null>(null);
  const dups = users.filter((u) => u.status === "pending");
  const rows = users.filter((u) => u.status !== "pending" && (!role || u.role === role) && (!q || `${u.name} ${u.email} ${u.employeeId ?? ""}`.toLowerCase().includes(q.toLowerCase())));
  const columns: ColumnDef<User, unknown>[] = useMemo(
    () => [
      {
        id: "name",
        header: "User",
        accessorFn: (u) => u.name,
        cell: ({ row: { original: u } }) => (
          <span className="flex items-center gap-2.5">
            <Avatar name={u.name} size="sm" />
            <span>
              <span className="block font-medium text-ink-strong">{u.name}</span>
              <span className="block text-xs text-muted">{u.email}</span>
            </span>
          </span>
        ),
      },
      { id: "emp", header: "Employee ID", accessorFn: (u) => u.employeeId ?? "—", cell: ({ getValue }) => <span className="ref text-xs">{getValue() as string}</span> },
      { id: "role", header: "Role", accessorFn: (u) => ROLES.find((r) => r.key === u.role)?.label ?? u.role },
      { id: "designation", header: "Designation", accessorFn: (u) => u.designation, cell: ({ getValue }) => <span className="block max-w-[14rem] truncate">{getValue() as string}</span> },
      { id: "dept", header: "Department", accessorFn: (u) => (u.department === "External" ? "External" : DEPARTMENT_LABEL[u.department]) },
      { id: "status", header: "Status", accessorFn: (u) => u.status, cell: ({ row: { original: u } }) => <Badge tone={u.status === "active" ? "success" : "danger"}>{u.status}</Badge> },
      {
        id: "act",
        header: "",
        enableSorting: false,
        cell: ({ row: { original: u } }) =>
          u.role === "admin" ? null : (
            <Button size="xs" variant={u.status === "active" ? "danger-outline" : "secondary"} onClick={() => setPending({ user: u, to: u.status === "active" ? "suspended" : "active" })}>
              {u.status === "active" ? "Suspend" : "Activate"}
            </Button>
          ),
      },
    ],
    [],
  );
  return (
    <AdminShell>
      <PageHeader title="Users" description="One employee, one user ID. Sign-in by email or mobile is supported for all user types (TOR 2.8)." />
      {dups.map((d) => {
        const existing = users.find((u) => u.id !== d.id && u.employeeId === d.employeeId && u.status !== "pending");
        return (
          <Callout
            key={d.id}
            tone="warning"
            className="mb-5"
            title={`Duplicate profile request · Employee ID ${d.employeeId}`}
            action={
              <Button
                size="sm"
                onClick={() => {
                  merge(d.id);
                  toast.success("Duplicate rejected", "The employee keeps a single user profile.");
                }}
              >
                Reject duplicate
              </Button>
            }
          >
            A new profile ({d.email}) shares an Employee ID with active user {existing?.name} ({existing?.email}). Single user profile policy blocks a second account.
          </Callout>
        );
      })}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="w-full sm:w-72">
          <Input leading={<Search />} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, employee ID" aria-label="Search users" />
        </div>
        <Select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role" className="w-48">
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </Select>
      </div>
      <DataTable data={rows} columns={columns} caption="Users" pageSize={15} dense />
      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        title={pending?.to === "suspended" ? `Suspend ${pending?.user.name}?` : `Activate ${pending?.user.name}?`}
        description={pending?.to === "suspended" ? "The user is signed out and cannot sign in. Files they hold must be reassigned." : "The user can sign in again with their existing roles."}
        tone={pending?.to === "suspended" ? "danger" : "primary"}
        confirmLabel={pending?.to === "suspended" ? "Yes, suspend" : "Yes, activate"}
        onConfirm={() => {
          setStatus(pending!.user.id, pending!.to);
          setPending(null);
          toast.success(pending?.to === "suspended" ? "User suspended" : "User activated");
        }}
      />
    </AdminShell>
  );
}

/* ———————————————————————————— Roles ———————————————————————————— */

export function AdminRoles() {
  const perms = Object.keys(PERMISSION_LABEL) as Permission[];
  return (
    <AdminShell>
      <PageHeader title="Roles & permissions" description="Role-based access control (TOR 1.9). Demo navigation follows this matrix; production enforcement happens on the server." />
      <Callout tone="info" icon={Lock} className="mb-5">
        Editing is disabled in the prototype: role changes need an approved change request from RAJUK. The matrix shows the proposed baseline.
      </Callout>
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[60rem] text-left text-xs">
          <caption className="sr-only">Role permission matrix</caption>
          <thead className="bg-surface-2">
            <tr>
              <th scope="col" className="sticky left-0 bg-surface-2 px-4 py-3 font-semibold text-muted">
                Permission
              </th>
              {ROLES.map((r) => (
                <th key={r.key} scope="col" className="px-2 py-3 text-center font-semibold text-ink-strong">
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {perms.map((p) => (
              <tr key={p}>
                <th scope="row" className="sticky left-0 bg-surface px-4 py-2.5 font-normal text-ink">
                  {PERMISSION_LABEL[p]}
                  <span className="ref block text-[0.625rem] text-subtle">{p}</span>
                </th>
                {ROLES.map((r) => {
                  const has = ROLE_PERMISSIONS[r.key].includes(p);
                  return (
                    <td key={r.key} className="px-2 py-2.5 text-center">
                      {has ? <Check className="mx-auto size-4 text-teal-700" aria-label="Granted" /> : <span className="text-line-strong" aria-label="Not granted">·</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

/* ———————————————————————————— Committees ———————————————————————————— */

export function AdminCommittees() {
  const users = useDemoStore((s) => s.users);
  const [committees, setCommittees] = useState([
    { id: "bcc-r", name: "BC Committee (Regular)", type: "Regular", maxPresentations: 2, members: ["u-com-04", "u-com-01", "u-com-02", "u-com-03"] },
    { id: "bcc-l", name: "BC Committee (LSP)", type: "Large & Special Projects", maxPresentations: 2, members: ["u-com-04", "u-com-01", "u-ctp-01"] },
  ]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("Regular");
  const [members, setMembers] = useState<string[]>([]);
  const pool = users.filter((u) => ["committee", "officer"].includes(u.role) && u.status === "active");
  return (
    <AdminShell>
      <PageHeader
        title="Departments & committees"
        description="Departments used for routing, and committee formation including external technical experts (TOR 1.10, 2.8)."
        actions={
          <Button onClick={() => { setOpen(true); setName(""); setMembers([]); }}>
            <Gavel /> Form committee
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          {committees.map((c) => (
            <Panel key={c.id} title={c.name} description={`${c.type} · max ${c.maxPresentations} presentations per case`}>
              <ul className="flex flex-wrap gap-2">
                {c.members.map((m) => {
                  const u = users.find((x) => x.id === m);
                  return (
                    <li key={m} className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-xs">
                      <Avatar name={u?.name ?? "?"} size="xs" />
                      {u?.name}
                      {u?.designation.includes("external") && <Tag>EXTERNAL</Tag>}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          ))}
        </div>
        <Panel title="Departments">
          <ul className="space-y-2 text-sm">
            {Object.entries(DEPARTMENT_LABEL).map(([k, v]) => (
              <li key={k} className="flex items-center justify-between">
                <span className="text-ink-strong">{v}</span>
                <span className="text-xs text-muted">{users.filter((u) => u.department === k).length} users</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Form a new committee"
        description="Committee composition is recorded in minutes. Kept for this browser session in the demo."
        confirmLabel="Create committee"
        confirmDisabled={!name.trim() || members.length < 3}
        onConfirm={() => {
          setCommittees((cs) => [...cs, { id: `c-${cs.length}`, name: name.trim(), type, maxPresentations: 2, members }]);
          setOpen(false);
          toast.success("Committee formed", `${members.length} members recorded.`);
        }}
      >
        <div className="space-y-4">
          <Field label="Name" required>
            {(a) => <Input {...a} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. BC Committee (Regular) — Zone 6" />}
          </Field>
          <Field label="Type">
            {(a) => (
              <Select {...a} value={type} onChange={(e) => setType(e.target.value)}>
                <option>Regular</option>
                <option>Large & Special Projects</option>
                <option>Appeal</option>
              </Select>
            )}
          </Field>
          <fieldset>
            <legend className="mb-2 text-[0.8125rem] font-medium text-ink-strong">Members (at least 3)</legend>
            <ul className="scrollbar-thin max-h-52 space-y-1 overflow-y-auto rounded-lg border border-line p-2">
              {pool.map((u) => (
                <li key={u.id}>
                  <label className="flex items-center gap-2.5 rounded px-2 py-1.5 text-sm hover:bg-surface-2">
                    <input type="checkbox" className="accent-teal-600" checked={members.includes(u.id)} onChange={(e) => setMembers((m) => (e.target.checked ? [...m, u.id] : m.filter((x) => x !== u.id)))} />
                    {u.name} <span className="text-xs text-muted">· {u.designation}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        </div>
      </ConfirmDialog>
    </AdminShell>
  );
}

/* ———————————————————————————— Workflow ———————————————————————————— */

export function AdminWorkflow() {
  const limits = useDemoStore((s) => s.holdingLimits);
  const setLimit = useDemoStore((s) => s.setHoldingLimit);
  const [draft, setDraft] = useState<Partial<Record<StageKey, number>>>(limits);
  const [confirm, setConfirm] = useState(false);
  const changed = (Object.keys(draft) as StageKey[]).filter((k) => draft[k] !== limits[k]);
  return (
    <AdminShell>
      <PageHeader title="Workflow & holding limits" description="Maximum working days a file may stay at each stage before it is highlighted in red and escalated (TOR 1.1). Values are illustrative defaults." />
      <SensitiveNote />
      <Panel bodyClassName="p-0">
        <ul className="divide-y divide-line">
          {(Object.keys(limits) as StageKey[]).map((k) => (
            <li key={k} className="flex items-center gap-4 px-5 py-3">
              <Clock className="size-4 text-subtle" aria-hidden />
              <label htmlFor={`lim-${k}`} className="flex-1 text-sm text-ink-strong">
                {STAGE_LABEL[k]}
              </label>
              <Input id={`lim-${k}`} type="number" min={1} max={60} value={draft[k] ?? ""} onChange={(e) => setDraft({ ...draft, [k]: Number(e.target.value) })} className="tabular w-24 text-right" />
              <span className="w-24 text-xs text-muted">working days</span>
            </li>
          ))}
        </ul>
      </Panel>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" disabled={!changed.length} onClick={() => setDraft(limits)}>
          Discard
        </Button>
        <Button disabled={!changed.length} onClick={() => setConfirm(true)}>
          Save {changed.length || ""} change{changed.length === 1 ? "" : "s"}
        </Button>
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Apply new holding limits?"
        description="Over-limit highlighting, escalation and management dashboards update immediately for all users."
        confirmLabel="Yes, apply"
        tone="navy"
        onConfirm={() => {
          changed.forEach((k) => setLimit(k, draft[k]!));
          setConfirm(false);
          toast.success("Holding limits updated", "See the effect in the file inbox and dashboards.");
        }}
      >
        <ul className="space-y-1 text-sm">
          {changed.map((k) => (
            <li key={k}>
              {STAGE_LABEL[k]}: <span className="tabular text-muted line-through">{limits[k]}</span> → <span className="tabular font-semibold">{draft[k]}</span> days
            </li>
          ))}
        </ul>
      </ConfirmDialog>
    </AdminShell>
  );
}

/* ———————————————————————————— Parameters ———————————————————————————— */

export function AdminParameters() {
  const far = useDemoStore((s) => s.far);
  const dap = useDemoStore((s) => s.dap);
  const update = useDemoStore((s) => s.updateFarRow);
  const [edit, setEdit] = useState<FarRow | null>(null);
  return (
    <AdminShell>
      <PageHeader title="DAP & FAR parameters" description="Configurable values used by application checks and reviewer summaries (TOR 1.15, 2.8)." meta={<SimulatedTag>Illustrative values — not official</SimulatedTag>} />
      <SensitiveNote />
      <Panel title="FAR table" description="By plot area and minimum access-road width." bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">FAR table</caption>
            <thead className="bg-surface-2 text-xs text-muted">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-medium">Plot area (m²)</th>
                <th scope="col" className="px-3 py-2.5 text-right font-medium">Min. road (m)</th>
                <th scope="col" className="px-3 py-2.5 text-right font-medium">FAR</th>
                <th scope="col" className="px-3 py-2.5 text-right font-medium">Max ground coverage</th>
                <th scope="col" className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {far.map((r) => (
                <tr key={r.id}>
                  <td className="tabular px-5 py-2.5">
                    {r.plotFromSqm} – {r.plotToSqm >= 99999 ? "above" : r.plotToSqm}
                  </td>
                  <td className="tabular px-3 py-2.5 text-right">{r.roadWidthMinM}</td>
                  <td className="tabular px-3 py-2.5 text-right font-semibold text-ink-strong">{r.far.toFixed(1)}</td>
                  <td className="tabular px-3 py-2.5 text-right">{r.maxGroundCoveragePct}%</td>
                  <td className="px-5 py-2.5 text-right">
                    <Button size="xs" variant="ghost" onClick={() => setEdit({ ...r })}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="DAP land-use zones" description="Permitted BNBC occupancy groups per zone." className="mt-6" bodyClassName="p-0">
        <ul className="divide-y divide-line">
          {dap.map((z) => (
            <li key={z.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
              <Tag>{z.code}</Tag>
              <span className="w-48 font-medium text-ink-strong">{z.label}</span>
              <span className="flex flex-1 flex-wrap gap-1">
                {z.permittedOccupancies.length ? z.permittedOccupancies.map((o) => <Badge key={o} tone="info" dot={false}>{o} · {OCCUPANCY[o]}</Badge>) : <span className="text-xs text-danger-700">No construction</span>}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
      <ConfirmDialog
        open={!!edit}
        onOpenChange={(o) => !o && setEdit(null)}
        title="Change FAR parameters?"
        description="Applicant checks and reviewer FAR summaries use the new values immediately."
        confirmLabel="Yes, save"
        tone="navy"
        onConfirm={() => {
          update(edit!.id, { far: edit!.far, maxGroundCoveragePct: edit!.maxGroundCoveragePct, roadWidthMinM: edit!.roadWidthMinM });
          setEdit(null);
          toast.success("FAR parameters saved");
        }}
      >
        {edit && (
          <div className="grid grid-cols-3 gap-3">
            <Field label="FAR">{(a) => <Input {...a} type="number" step={0.1} value={edit.far} onChange={(e) => setEdit({ ...edit, far: Number(e.target.value) })} />}</Field>
            <Field label="Coverage %">{(a) => <Input {...a} type="number" value={edit.maxGroundCoveragePct} onChange={(e) => setEdit({ ...edit, maxGroundCoveragePct: Number(e.target.value) })} />}</Field>
            <Field label="Min. road">{(a) => <Input {...a} type="number" step={0.5} value={edit.roadWidthMinM} onChange={(e) => setEdit({ ...edit, roadWidthMinM: Number(e.target.value) })} />}</Field>
          </div>
        )}
      </ConfirmDialog>
    </AdminShell>
  );
}

/* ———————————————————————————— Security ———————————————————————————— */

export function AdminSecurity() {
  const security = useDemoStore((s) => s.security);
  const update = useDemoStore((s) => s.updateSecurity);
  const [draft, setDraft] = useState<SecuritySettings>(security);
  const [confirm, setConfirm] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(security);
  const toggle = (label: string, desc: string, key: "mfaOnApproval" | "otpForUntrustedDevice" | "forcePasswordChangeOnFirstLogin") => (
    <li className="flex items-start gap-4 px-5 py-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-ink-strong">{label}</p>
        <p className="text-xs text-muted">{desc}</p>
      </div>
      <Switch checked={draft[key]} onCheckedChange={(v) => setDraft({ ...draft, [key]: v })} aria-label={label} />
    </li>
  );
  return (
    <AdminShell>
      <PageHeader title="Security & session" description="Policies from TOR 1.9. The browser enforces inactivity sign-out in this demo; production must also enforce it on the server." />
      <SensitiveNote />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Session" actions={<Timer className="size-4 text-subtle" aria-hidden />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Automatic logout after inactivity" hint="Minutes. TOR default: 15.">
              {(a) => <Input {...a} type="number" min={1} max={120} value={draft.idleTimeoutMinutes} onChange={(e) => setDraft({ ...draft, idleTimeoutMinutes: Math.max(1, Number(e.target.value)) })} className="tabular" />}
            </Field>
            <Field label="Warn before logout" hint="Seconds.">
              {(a) => <Input {...a} type="number" min={15} max={300} value={draft.warnBeforeSeconds} onChange={(e) => setDraft({ ...draft, warnBeforeSeconds: Number(e.target.value) })} className="tabular" />}
            </Field>
          </div>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => window.dispatchEvent(new Event("ecps:preview-idle"))}>
            <Bell /> Preview inactivity warning
          </Button>
        </Panel>
        <Panel title="Password policy">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Min length">{(a) => <Input {...a} type="number" min={8} value={draft.password.minLength} onChange={(e) => setDraft({ ...draft, password: { ...draft.password, minLength: Number(e.target.value) } })} />}</Field>
            <Field label="Expiry (days)">{(a) => <Input {...a} type="number" value={draft.password.expiryDays} onChange={(e) => setDraft({ ...draft, password: { ...draft.password, expiryDays: Number(e.target.value) } })} />}</Field>
            <Field label="History">{(a) => <Input {...a} type="number" value={draft.password.history} onChange={(e) => setDraft({ ...draft, password: { ...draft.password, history: Number(e.target.value) } })} />}</Field>
          </div>
          <label className="mt-4 flex items-center gap-3 text-sm text-ink">
            <Switch checked={draft.password.requireSymbols} onCheckedChange={(v) => setDraft({ ...draft, password: { ...draft.password, requireSymbols: v } })} aria-label="Require symbols" /> Require symbols
          </label>
        </Panel>
        <Panel title="Authentication controls" bodyClassName="p-0" className="xl:col-span-2">
          <ul className="divide-y divide-line">
            {toggle("Multi-factor authentication at approval", "Required for approve, reject and signing in PP, CP and RDC workflows (TOR 1.3–1.5, 1.9).", "mfaOnApproval")}
            {toggle("OTP sign-in on untrusted devices", "One-time code by SMS when the device is not recognised.", "otpForUntrustedDevice")}
            {toggle("Force password change on first login", "Temporary passwords must be replaced immediately.", "forcePasswordChangeOnFirstLogin")}
          </ul>
        </Panel>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" disabled={!dirty} onClick={() => setDraft(security)}>
          Discard
        </Button>
        <Button disabled={!dirty} onClick={() => setConfirm(true)}>
          Save security settings
        </Button>
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        eyebrow="Sensitive change"
        title="Apply security settings?"
        description={!draft.mfaOnApproval ? "Warning: turning off MFA at approval weakens protection of approval decisions." : "New settings apply to all users from their next action."}
        tone={!draft.mfaOnApproval ? "danger" : "navy"}
        confirmLabel="Yes, apply"
        onConfirm={() => {
          update(draft);
          setConfirm(false);
          toast.success("Security settings saved", "Logged in the audit trail.");
        }}
      />
    </AdminShell>
  );
}

/* ———————————————————————————— Scheduler ———————————————————————————— */

export function AdminScheduler() {
  const jobs = useDemoStore((s) => s.scheduler);
  const toggle = useDemoStore((s) => s.toggleJob);
  const run = useDemoStore((s) => s.runJob);
  const [running, setRunning] = useState<string | null>(null);
  const [delivery, setDelivery] = useState({ monthly: true, weekly: false, recipients: "director.dc@demo.ecps.test; ao.zone4@demo.ecps.test" });
  return (
    <AdminShell>
      <PageHeader title="Scheduler & reports" description="Background jobs and report delivery. Runs are simulated in the prototype." />
      <Panel bodyClassName="p-0">
        <ul className="divide-y divide-line">
          {jobs.map((j) => (
            <li key={j.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_9rem_8rem_auto] md:items-center">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-strong">{j.name}</p>
                <p className="text-xs text-muted">{j.description}</p>
              </div>
              <span className="ref text-xs text-muted">{j.cron}</span>
              <span className="text-xs">
                {j.lastResult === "failed" ? <Badge tone="danger">Failed</Badge> : <Badge tone="success">OK</Badge>}
                <span className="mt-1 block text-muted">{j.lastRunAt ? formatRelative(j.lastRunAt) : "never"}</span>
              </span>
              <div className="flex items-center gap-3">
                <Switch checked={j.enabled} onCheckedChange={() => toggle(j.id)} aria-label={`Enable ${j.name}`} />
                <Button
                  size="xs"
                  variant="secondary"
                  loading={running === j.id}
                  onClick={async () => {
                    setRunning(j.id);
                    await new Promise((r) => setTimeout(r, 900));
                    run(j.id);
                    setRunning(null);
                    toast.success(`${j.name} completed`, "Simulated run.");
                  }}
                >
                  <Play /> Run
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Report delivery" description="Monthly consolidated report (TOR 1.1) and weekly holding summary." className="mt-6">
        <div className="space-y-4">
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={delivery.monthly} onCheckedChange={(v) => setDelivery({ ...delivery, monthly: v })} aria-label="Monthly report" /> Monthly consolidated report (1st of month, 06:00)
          </label>
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={delivery.weekly} onCheckedChange={(v) => setDelivery({ ...delivery, weekly: v })} aria-label="Weekly summary" /> Weekly over-limit summary to supervisors
          </label>
          <Field label="Recipients (fictional)">{(a) => <Textarea {...a} rows={2} value={delivery.recipients} onChange={(e) => setDelivery({ ...delivery, recipients: e.target.value })} />}</Field>
          <Button variant="secondary" onClick={() => toast.success("Report delivery saved", "Kept for this browser session (demo).")}>
            Save delivery settings
          </Button>
        </div>
      </Panel>
    </AdminShell>
  );
}

/* ———————————————————————————— Notifications ———————————————————————————— */

export function AdminNotifications() {
  const notices = useDemoStore((s) => s.notices);
  const toggle = useDemoStore((s) => s.toggleNotice);
  const publish = useDemoStore((s) => s.publishNotice);
  const [form, setForm] = useState({ title: "", body: "", kind: "maintenance" as "maintenance" | "regulatory" | "general" });
  const [confirm, setConfirm] = useState(false);
  return (
    <AdminShell>
      <PageHeader title="System notifications" description="Notices shown on the public portal, e.g. maintenance windows (TOR §4). Changes appear on the landing page immediately." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Panel bodyClassName="p-0">
          <ul className="divide-y divide-line">
            {notices.map((n) => (
              <li key={n.id} className="flex items-start gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Tag>{n.kind.toUpperCase()}</Tag>
                    <span className="text-xs text-muted">{formatDateTime(n.publishedAt)}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-ink-strong">{n.title}</p>
                  <p className="text-xs text-muted">{n.body}</p>
                </div>
                <label className="flex items-center gap-2 text-xs text-muted">
                  <Switch checked={n.visibleOnPortal} onCheckedChange={() => toggle(n.id)} aria-label={`Show "${n.title}" on portal`} /> On portal
                </label>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Publish a notice">
          <div className="space-y-4">
            <Field label="Type">
              {(a) => (
                <Select {...a} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as typeof form.kind })}>
                  <option value="maintenance">Maintenance</option>
                  <option value="regulatory">Regulatory</option>
                  <option value="general">General</option>
                </Select>
              )}
            </Field>
            <Field label="Title" required>{(a) => <Input {...a} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />}</Field>
            <Field label="Message" required>{(a) => <Textarea {...a} rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />}</Field>
            <Button className="w-full" disabled={!form.title.trim() || !form.body.trim()} onClick={() => setConfirm(true)}>
              <Megaphone /> Publish to portal
            </Button>
          </div>
        </Panel>
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Publish this notice publicly?"
        description="It appears on the public landing page for every visitor."
        confirmLabel="Yes, publish"
        onConfirm={() => {
          publish(form.title.trim(), form.body.trim(), form.kind);
          setForm({ title: "", body: "", kind: "maintenance" });
          setConfirm(false);
          toast.success("Notice published", "Visible on the public portal now.");
        }}
      />
    </AdminShell>
  );
}

/* ———————————————————————————— Audit ———————————————————————————— */

export function AdminAudit() {
  const audit = useDemoStore((s) => s.audit);
  const users = useDemoStore((s) => s.users);
  const [sev, setSev] = useState("");
  const [q, setQ] = useState("");
  const rows = audit.filter((a) => (!sev || a.severity === sev) && (!q || `${a.action} ${a.target} ${a.detail ?? ""} ${userName(users, a.actorId)}`.toLowerCase().includes(q.toLowerCase())));
  const columns: ColumnDef<AuditEntry, unknown>[] = useMemo(
    () => [
      { id: "at", header: "Time", accessorFn: (a) => a.at, cell: ({ getValue }) => <span className="tabular whitespace-nowrap text-muted">{formatDateTime(getValue() as string)}</span> },
      { id: "actor", header: "Actor", accessorFn: (a) => userName(users, a.actorId) },
      { id: "action", header: "Action", accessorFn: (a) => a.action, cell: ({ getValue }) => <span className="ref text-xs text-teal-800">{getValue() as string}</span> },
      { id: "target", header: "Target", accessorFn: (a) => a.target, cell: ({ getValue }) => <span className="block max-w-[12rem] truncate">{getValue() as string}</span> },
      { id: "detail", header: "Detail", accessorFn: (a) => a.detail ?? "", cell: ({ getValue }) => <span className="block max-w-[18rem] truncate text-muted">{getValue() as string}</span> },
      { id: "ip", header: "IP", accessorFn: (a) => a.ip ?? "", cell: ({ getValue }) => <span className="ref text-xs text-muted">{getValue() as string}</span> },
      { id: "sev", header: "Severity", accessorFn: (a) => a.severity, cell: ({ getValue }) => <Badge tone={getValue() === "warning" ? "warning" : getValue() === "notice" ? "info" : "neutral"}>{getValue() as string}</Badge> },
    ],
    [users],
  );
  return (
    <AdminShell>
      <PageHeader
        title="Audit trail"
        description="Every sign-in, file movement, decision, signature and configuration change (TOR 3.5)."
        actions={
          <Button
            variant="secondary"
            onClick={() => downloadText("ecps-audit.csv", toCsv(rows.map((a) => ({ time: a.at, actor: userName(users, a.actorId), action: a.action, target: a.target, detail: a.detail ?? "", ip: a.ip ?? "", severity: a.severity }))))}
          >
            <Download /> Export CSV
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="w-full sm:w-72">
          <Input leading={<Search />} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Action, target, actor" aria-label="Search audit" />
        </div>
        <Select value={sev} onChange={(e) => setSev(e.target.value)} aria-label="Severity" className="w-40">
          <option value="">All severities</option>
          <option value="info">Info</option>
          <option value="notice">Notice</option>
          <option value="warning">Warning</option>
        </Select>
      </div>
      <DataTable data={rows} columns={columns} caption="Audit trail" initialSort={[{ id: "at", desc: true }]} pageSize={20} dense />
    </AdminShell>
  );
}

