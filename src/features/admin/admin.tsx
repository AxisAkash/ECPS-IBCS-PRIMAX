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
import { PERMISSION_LABEL, ROLE_PERMISSIONS, ROLES, type Permission } from "@/lib/domain/roles";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { useLabels } from "@/lib/i18n/labels";
import type { AuditEntry, FarRow, SecuritySettings, StageKey, User } from "@/lib/domain/types";
import { DEPARTMENT_LABEL } from "@/lib/domain/workflow";
import { useDemoStore, userName } from "@/lib/store/demo-store";
import { cn, downloadText, formatDateTime, formatNumber, formatRelative, toCsv } from "@/lib/utils";

const SECTIONS: Array<{ slug: string; key: string; icon: LucideIcon }> = [
  { slug: "", key: "overview", icon: SlidersHorizontal },
  { slug: "users", key: "users", icon: Users },
  { slug: "roles", key: "roles", icon: UserCog },
  { slug: "committees", key: "committees", icon: Gavel },
  { slug: "workflow", key: "workflow", icon: Workflow },
  { slug: "parameters", key: "parameters", icon: Layers },
  { slug: "security", key: "security", icon: ShieldCheck },
  { slug: "scheduler", key: "scheduler", icon: CalendarClock },
  { slug: "notifications", key: "notifications", icon: Megaphone },
  { slug: "audit", key: "audit", icon: ScrollText },
];
const sk = (key: string) => `ad.s.${key}` as MessageKey;
const sd = (key: string) => `ad.s.${key}.d` as MessageKey;

export function AdminShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const current = pathname.replace(/^\/rajuk\/admin\/?/, "");
  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <nav aria-label={t("ad.nav")} className="lg:sticky lg:top-24 lg:self-start">
        <p className="kicker mb-3">{t("ad.nav")}</p>
        <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {SECTIONS.map((s) => {
            const on = current === s.slug;
            return (
              <li key={s.slug} className="shrink-0">
                <Link
                  href={`/rajuk/admin${s.slug ? `/${s.slug}` : ""}`}
                  aria-current={on ? "page" : undefined}
                  className={cn("flex items-center gap-2.5 rounded-md px-3 py-2 text-[0.8125rem] font-medium transition-colors", on ? "bg-emphasis text-white" : "text-ink hover:bg-surface-3")}
                >
                  <s.icon className={cn("size-4", on ? "text-amber-200" : "text-subtle")} aria-hidden />
                  {t(sk(s.key))}
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
  const { t } = useI18n();
  return (
    <Callout tone="warning" icon={AlertTriangle} className="mb-5">
      {t("ad.sensitive")}
    </Callout>
  );
}

/* ———————————————————————————— Overview ———————————————————————————— */

export function AdminOverview() {
  const { t, locale } = useI18n();
  const users = useDemoStore((s) => s.users);
  const security = useDemoStore((s) => s.security);
  const scheduler = useDemoStore((s) => s.scheduler);
  const audit = useDemoStore((s) => s.audit);
  const notices = useDemoStore((s) => s.notices);
  const dup = users.filter((u) => u.status === "pending");
  const failed = scheduler.filter((j) => j.lastResult === "failed");
  const tiles = [
    { slug: "users", value: formatNumber(users.filter((u) => u.status === "active").length, locale), label: t("ad.o.activeUsers"), alert: dup.length ? t("ad.o.dup", { n: dup.length }) : undefined },
    { slug: "security", value: t("ad.o.minutes", { n: formatNumber(security.idleTimeoutMinutes, locale) }), label: t("ad.o.idle"), alert: !security.mfaOnApproval ? t("ad.o.mfaOff") : undefined },
    { slug: "scheduler", value: formatNumber(scheduler.filter((j) => j.enabled).length, locale), label: t("ad.o.jobs"), alert: failed.length ? t("ad.o.jobFailed", { n: failed.length }) : undefined },
    { slug: "notifications", value: formatNumber(notices.filter((n) => n.visibleOnPortal).length, locale), label: t("ad.o.notices") },
    { slug: "audit", value: formatNumber(audit.filter((a) => a.severity === "warning").length, locale), label: t("ad.o.warnings") },
  ];
  return (
    <AdminShell>
      <PageHeader title={t("ad.o.title")} description={t("ad.o.desc")} />
      <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={tile.slug} href={`/rajuk/admin/${tile.slug}`} className="bg-surface p-5 transition-colors hover:bg-surface-2">
            <p className="text-xs text-muted">{tile.label}</p>
            <p className="tabular mt-1 font-display text-2xl font-semibold text-ink-strong">{tile.value}</p>
            {tile.alert ? <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700"><AlertTriangle className="size-3.5" aria-hidden /> {tile.alert}</p> : <p className="mt-2 flex items-center gap-1.5 text-xs text-success-700"><Check className="size-3.5" aria-hidden /> {t("ad.o.noIssues")}</p>}
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
                <span className="block text-sm font-semibold text-ink-strong">{t(sk(s.key))}</span>
                <span className="block text-xs text-muted">{t(sd(s.key))}</span>
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
  const { t, term } = useI18n();
  const L = useLabels();
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
        header: t("ad.u.user"),
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
      { id: "emp", header: t("ad.u.emp"), accessorFn: (u) => u.employeeId ?? "—", cell: ({ getValue }) => <span className="ref text-xs">{getValue() as string}</span> },
      { id: "role", header: t("ad.u.role"), accessorFn: (u) => L.role(u.role) },
      { id: "designation", header: t("ad.u.designation"), accessorFn: (u) => term("desig", u.designation), cell: ({ getValue }) => <span className="block max-w-[14rem] truncate">{getValue() as string}</span> },
      { id: "dept", header: t("ad.u.dept"), accessorFn: (u) => L.dept(u.department) },
      { id: "status", header: t("ad.u.status"), accessorFn: (u) => u.status, cell: ({ row: { original: u } }) => <Badge tone={u.status === "active" ? "success" : "danger"}>{t(`ust.${u.status}`)}</Badge> },
      {
        id: "act",
        header: "",
        enableSorting: false,
        cell: ({ row: { original: u } }) =>
          u.role === "admin" ? null : (
            <Button size="xs" variant={u.status === "active" ? "danger-outline" : "secondary"} onClick={() => setPending({ user: u, to: u.status === "active" ? "suspended" : "active" })}>
              {u.status === "active" ? t("ad.u.suspend") : t("ad.u.activate")}
            </Button>
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- labels change only with the locale
    [t],
  );
  return (
    <AdminShell>
      <PageHeader title={t("ad.u.title")} description={t("ad.u.desc")} />
      {dups.map((d) => {
        const existing = users.find((u) => u.id !== d.id && u.employeeId === d.employeeId && u.status !== "pending");
        return (
          <Callout
            key={d.id}
            tone="warning"
            className="mb-5"
            title={t("ad.u.dupTitle", { id: d.employeeId ?? "" })}
            action={
              <Button
                size="sm"
                onClick={() => {
                  merge(d.id);
                  toast.success(t("ad.u.dupToast"), t("ad.u.dupToastBody"));
                }}
              >
                {t("ad.u.rejectDup")}
              </Button>
            }
          >
            {t("ad.u.dupBody", { email: d.email, name: existing?.name ?? "", existing: existing?.email ?? "" })}
          </Callout>
        );
      })}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="w-full sm:w-72">
          <Input leading={<Search />} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("ad.u.search")} aria-label={t("ad.u.searchLabel")} />
        </div>
        <Select value={role} onChange={(e) => setRole(e.target.value)} aria-label={t("ad.u.role")} className="w-48">
          <option value="">{t("ad.u.allRoles")}</option>
          {ROLES.map((r) => (
            <option key={r.key} value={r.key}>
              {L.role(r.key)}
            </option>
          ))}
        </Select>
      </div>
      <DataTable data={rows} columns={columns} caption={t("ad.u.caption")} pageSize={15} dense />
      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        title={pending?.to === "suspended" ? t("ad.u.qSuspend", { name: pending?.user.name ?? "" }) : t("ad.u.qActivate", { name: pending?.user.name ?? "" })}
        description={pending?.to === "suspended" ? t("ad.u.dSuspend") : t("ad.u.dActivate")}
        tone={pending?.to === "suspended" ? "danger" : "primary"}
        confirmLabel={pending?.to === "suspended" ? t("ad.u.ySuspend") : t("ad.u.yActivate")}
        onConfirm={() => {
          setStatus(pending!.user.id, pending!.to);
          setPending(null);
          toast.success(pending?.to === "suspended" ? t("ad.u.tSuspended") : t("ad.u.tActivated"));
        }}
      />
    </AdminShell>
  );
}

/* ———————————————————————————— Roles ———————————————————————————— */

export function AdminRoles() {
  const { t } = useI18n();
  const L = useLabels();
  const perms = Object.keys(PERMISSION_LABEL) as Permission[];
  return (
    <AdminShell>
      <PageHeader title={t("ad.r.title")} description={t("ad.r.desc")} />
      <Callout tone="info" icon={Lock} className="mb-5">
        {t("ad.r.note")}
      </Callout>
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[60rem] text-left text-xs">
          <caption className="sr-only">{t("ad.r.caption")}</caption>
          <thead className="bg-surface-2">
            <tr>
              <th scope="col" className="sticky left-0 bg-surface-2 px-4 py-3 font-semibold text-muted">
                {t("ad.r.permission")}
              </th>
              {ROLES.map((r) => (
                <th key={r.key} scope="col" className="px-2 py-3 text-center font-semibold text-ink-strong">
                  {L.role(r.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {perms.map((p) => (
              <tr key={p}>
                <th scope="row" className="sticky left-0 bg-surface px-4 py-2.5 font-normal text-ink">
                  {t(`perm.${p}`)}
                  <span className="ref block text-[0.625rem] text-subtle">{p}</span>
                </th>
                {ROLES.map((r) => {
                  const has = ROLE_PERMISSIONS[r.key].includes(p);
                  return (
                    <td key={r.key} className="px-2 py-2.5 text-center">
                      {has ? <Check className="mx-auto size-4 text-teal-700" aria-label={t("ad.r.granted")} /> : <span className="text-line-strong" aria-label={t("ad.r.notGranted")}>·</span>}
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
  const { t, term } = useI18n();
  const users = useDemoStore((s) => s.users);
  const committees = useDemoStore((s) => s.committees);
  const formCommittee = useDemoStore((s) => s.formCommittee);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("Regular");
  const [members, setMembers] = useState<string[]>([]);
  const pool = users.filter((u) => ["committee", "officer"].includes(u.role) && u.status === "active");
  return (
    <AdminShell>
      <PageHeader
        title={t("ad.c.title")}
        description={t("ad.c.desc")}
        actions={
          <Button onClick={() => { setOpen(true); setName(""); setMembers([]); }}>
            <Gavel /> {t("ad.c.form")}
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          {committees.map((c) => (
            <Panel key={c.id} title={term("cmt", c.name)} description={t("ad.c.meta", { type: term("cmtType", c.type), n: c.maxPresentations })}>
              <ul className="flex flex-wrap gap-2">
                {c.members.map((m) => {
                  const u = users.find((x) => x.id === m);
                  return (
                    <li key={m} className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-xs">
                      <Avatar name={u?.name ?? "?"} size="xs" />
                      {u?.name}
                      {u?.designation.includes("external") && <Tag>{t("ad.c.external")}</Tag>}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          ))}
        </div>
        <Panel title={t("ad.c.depts")}>
          <ul className="space-y-2 text-sm">
            {Object.keys(DEPARTMENT_LABEL).map((k) => (
              <li key={k} className="flex items-center justify-between">
                <span className="text-ink-strong">{term("dept", k)}</span>
                <span className="text-xs text-muted">{t("ad.c.users", { n: users.filter((u) => u.department === k).length })}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("ad.c.qTitle")}
        description={t("ad.c.qDesc")}
        confirmLabel={t("ad.c.create")}
        confirmDisabled={!name.trim() || members.length < 3}
        onConfirm={() => {
          formCommittee({ name: name.trim(), type, maxPresentations: 2, members });
          setOpen(false);
          toast.success(t("ad.c.toast"), t("ad.c.toastBody", { n: members.length }));
        }}
      >
        <div className="space-y-4">
          <Field label={t("ad.c.name")} required>
            {(a) => <Input {...a} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("ad.c.namePh")} />}
          </Field>
          <Field label={t("ad.c.type")}>
            {(a) => (
              <Select {...a} value={type} onChange={(e) => setType(e.target.value)}>
                {["Regular", "Large & Special Projects", "Appeal"].map((v) => (
                  <option key={v} value={v}>
                    {term("cmtType", v)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <fieldset>
            <legend className="mb-2 text-[0.8125rem] font-medium text-ink-strong">{t("ad.c.members")}</legend>
            <ul className="scrollbar-thin max-h-52 space-y-1 overflow-y-auto rounded-lg border border-line p-2">
              {pool.map((u) => (
                <li key={u.id}>
                  <label className="flex items-center gap-2.5 rounded px-2 py-1.5 text-sm hover:bg-surface-2">
                    <input type="checkbox" className="accent-teal-600" checked={members.includes(u.id)} onChange={(e) => setMembers((m) => (e.target.checked ? [...m, u.id] : m.filter((x) => x !== u.id)))} />
                    {u.name} <span className="text-xs text-muted">· {term("desig", u.designation)}</span>
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
  const { t } = useI18n();
  const L = useLabels();
  const limits = useDemoStore((s) => s.holdingLimits);
  const setLimit = useDemoStore((s) => s.setHoldingLimit);
  const [draft, setDraft] = useState<Partial<Record<StageKey, number>>>(limits);
  const [confirm, setConfirm] = useState(false);
  const changed = (Object.keys(draft) as StageKey[]).filter((k) => draft[k] !== limits[k]);
  return (
    <AdminShell>
      <PageHeader title={t("ad.w.title")} description={t("ad.w.desc")} />
      <SensitiveNote />
      <Panel bodyClassName="p-0">
        <ul className="divide-y divide-line">
          {(Object.keys(limits) as StageKey[]).map((k) => (
            <li key={k} className="flex items-center gap-4 px-5 py-3">
              <Clock className="size-4 text-subtle" aria-hidden />
              <label htmlFor={`lim-${k}`} className="flex-1 text-sm text-ink-strong">
                {L.stage(k)}
              </label>
              <Input id={`lim-${k}`} type="number" min={1} max={60} value={draft[k] ?? ""} onChange={(e) => setDraft({ ...draft, [k]: Number(e.target.value) })} className="tabular w-24 text-right" />
              <span className="w-24 text-xs text-muted">{t("ad.w.days")}</span>
            </li>
          ))}
        </ul>
      </Panel>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" disabled={!changed.length} onClick={() => setDraft(limits)}>
          {t("ad.discard")}
        </Button>
        <Button disabled={!changed.length} onClick={() => setConfirm(true)}>
          {changed.length === 0 ? t("ad.w.saveNone") : changed.length === 1 ? t("ad.w.save1") : t("ad.w.save", { n: changed.length })}
        </Button>
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t("ad.w.q")}
        description={t("ad.w.qDesc")}
        confirmLabel={t("ad.yesApply")}
        tone="navy"
        onConfirm={() => {
          changed.forEach((k) => setLimit(k, draft[k]!));
          setConfirm(false);
          toast.success(t("ad.w.toast"), t("ad.w.toastBody"));
        }}
      >
        <ul className="space-y-1 text-sm">
          {changed.map((k) => (
            <li key={k}>
              {L.stage(k)}: <span className="tabular text-muted line-through">{limits[k]}</span> → <span className="tabular font-semibold">{t("ad.w.daysN", { n: draft[k] ?? 0 })}</span>
            </li>
          ))}
        </ul>
      </ConfirmDialog>
    </AdminShell>
  );
}

/* ———————————————————————————— Parameters ———————————————————————————— */

export function AdminParameters() {
  const { t } = useI18n();
  const L = useLabels();
  const far = useDemoStore((s) => s.far);
  const dap = useDemoStore((s) => s.dap);
  const update = useDemoStore((s) => s.updateFarRow);
  const [edit, setEdit] = useState<FarRow | null>(null);
  return (
    <AdminShell>
      <PageHeader title={t("ad.p.title")} description={t("ad.p.desc")} meta={<SimulatedTag>{t("ad.p.illustrative")}</SimulatedTag>} />
      <SensitiveNote />
      <Panel title={t("ad.p.far")} description={t("ad.p.farDesc")} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{t("ad.p.far")}</caption>
            <thead className="bg-surface-2 text-xs text-muted">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-medium">{t("ad.p.plotArea")}</th>
                <th scope="col" className="px-3 py-2.5 text-right font-medium">{t("ad.p.minRoad")}</th>
                <th scope="col" className="px-3 py-2.5 text-right font-medium">{t("ad.p.farCol")}</th>
                <th scope="col" className="px-3 py-2.5 text-right font-medium">{t("ad.p.coverage")}</th>
                <th scope="col" className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {far.map((r) => (
                <tr key={r.id}>
                  <td className="tabular px-5 py-2.5">
                    {r.plotFromSqm} – {r.plotToSqm >= 99999 ? t("ad.p.above") : r.plotToSqm}
                  </td>
                  <td className="tabular px-3 py-2.5 text-right">{r.roadWidthMinM}</td>
                  <td className="tabular px-3 py-2.5 text-right font-semibold text-ink-strong">{r.far.toFixed(1)}</td>
                  <td className="tabular px-3 py-2.5 text-right">{r.maxGroundCoveragePct}%</td>
                  <td className="px-5 py-2.5 text-right">
                    <Button size="xs" variant="ghost" onClick={() => setEdit({ ...r })}>
                      {t("ad.p.edit")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title={t("ad.p.dap")} description={t("ad.p.dapDesc")} className="mt-6" bodyClassName="p-0">
        <ul className="divide-y divide-line">
          {dap.map((z) => (
            <li key={z.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
              <Tag>{z.code}</Tag>
              <span className="w-48 font-medium text-ink-strong">{t(`dapz.${z.id}` as MessageKey)}</span>
              <span className="flex flex-1 flex-wrap gap-1">
                {z.permittedOccupancies.length ? z.permittedOccupancies.map((o) => <Badge key={o} tone="info" dot={false}>{o} · {L.occ(o)}</Badge>) : <span className="text-xs text-danger-700">{t("ad.p.noConstruction")}</span>}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
      <ConfirmDialog
        open={!!edit}
        onOpenChange={(o) => !o && setEdit(null)}
        title={t("ad.p.q")}
        description={t("ad.p.qDesc")}
        confirmLabel={t("ad.yesSave")}
        tone="navy"
        onConfirm={() => {
          update(edit!.id, { far: edit!.far, maxGroundCoveragePct: edit!.maxGroundCoveragePct, roadWidthMinM: edit!.roadWidthMinM });
          setEdit(null);
          toast.success(t("ad.p.toast"));
        }}
      >
        {edit && (
          <div className="grid grid-cols-3 gap-3">
            <Field label={t("ad.p.farCol")}>{(a) => <Input {...a} type="number" step={0.1} value={edit.far} onChange={(e) => setEdit({ ...edit, far: Number(e.target.value) })} />}</Field>
            <Field label={t("ad.p.coveragePct")}>{(a) => <Input {...a} type="number" value={edit.maxGroundCoveragePct} onChange={(e) => setEdit({ ...edit, maxGroundCoveragePct: Number(e.target.value) })} />}</Field>
            <Field label={t("ad.p.minRoadShort")}>{(a) => <Input {...a} type="number" step={0.5} value={edit.roadWidthMinM} onChange={(e) => setEdit({ ...edit, roadWidthMinM: Number(e.target.value) })} />}</Field>
          </div>
        )}
      </ConfirmDialog>
    </AdminShell>
  );
}

/* ———————————————————————————— Security ———————————————————————————— */

export function AdminSecurity() {
  const { t } = useI18n();
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
      <PageHeader title={t("ad.sec.title")} description={t("ad.sec.desc")} />
      <SensitiveNote />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={t("ad.sec.session")} actions={<Timer className="size-4 text-subtle" aria-hidden />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("ad.sec.idle")} hint={t("ad.sec.idleHint")}>
              {(a) => <Input {...a} type="number" min={1} max={120} value={draft.idleTimeoutMinutes} onChange={(e) => setDraft({ ...draft, idleTimeoutMinutes: Math.max(1, Number(e.target.value)) })} className="tabular" />}
            </Field>
            <Field label={t("ad.sec.warn")} hint={t("ad.sec.warnHint")}>
              {(a) => <Input {...a} type="number" min={15} max={300} value={draft.warnBeforeSeconds} onChange={(e) => setDraft({ ...draft, warnBeforeSeconds: Number(e.target.value) })} className="tabular" />}
            </Field>
          </div>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => window.dispatchEvent(new Event("ecps:preview-idle"))}>
            <Bell /> {t("ad.sec.preview")}
          </Button>
        </Panel>
        <Panel title={t("ad.sec.pw")}>
          <div className="grid grid-cols-3 gap-4">
            <Field label={t("ad.sec.minLen")}>{(a) => <Input {...a} type="number" min={8} value={draft.password.minLength} onChange={(e) => setDraft({ ...draft, password: { ...draft.password, minLength: Number(e.target.value) } })} />}</Field>
            <Field label={t("ad.sec.expiry")}>{(a) => <Input {...a} type="number" value={draft.password.expiryDays} onChange={(e) => setDraft({ ...draft, password: { ...draft.password, expiryDays: Number(e.target.value) } })} />}</Field>
            <Field label={t("ad.sec.history")}>{(a) => <Input {...a} type="number" value={draft.password.history} onChange={(e) => setDraft({ ...draft, password: { ...draft.password, history: Number(e.target.value) } })} />}</Field>
          </div>
          <label className="mt-4 flex items-center gap-3 text-sm text-ink">
            <Switch checked={draft.password.requireSymbols} onCheckedChange={(v) => setDraft({ ...draft, password: { ...draft.password, requireSymbols: v } })} aria-label={t("ad.sec.symbols")} /> {t("ad.sec.symbols")}
          </label>
        </Panel>
        <Panel title={t("ad.sec.auth")} bodyClassName="p-0" className="xl:col-span-2">
          <ul className="divide-y divide-line">
            {toggle(t("ad.sec.mfa"), t("ad.sec.mfaD"), "mfaOnApproval")}
            {toggle(t("ad.sec.otp"), t("ad.sec.otpD"), "otpForUntrustedDevice")}
            {toggle(t("ad.sec.force"), t("ad.sec.forceD"), "forcePasswordChangeOnFirstLogin")}
          </ul>
        </Panel>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" disabled={!dirty} onClick={() => setDraft(security)}>
          {t("ad.discard")}
        </Button>
        <Button disabled={!dirty} onClick={() => setConfirm(true)}>
          {t("ad.sec.save")}
        </Button>
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        eyebrow={t("ad.sec.eyebrow")}
        title={t("ad.sec.q")}
        description={!draft.mfaOnApproval ? t("ad.sec.mfaWarn") : t("ad.sec.applyNote")}
        tone={!draft.mfaOnApproval ? "danger" : "navy"}
        confirmLabel={t("ad.yesApply")}
        onConfirm={() => {
          update(draft);
          setConfirm(false);
          toast.success(t("ad.sec.toast"), t("ad.logged"));
        }}
      />
    </AdminShell>
  );
}

/* ———————————————————————————— Scheduler ———————————————————————————— */

export function AdminScheduler() {
  const { t, locale } = useI18n();
  const jobs = useDemoStore((s) => s.scheduler);
  const toggle = useDemoStore((s) => s.toggleJob);
  const run = useDemoStore((s) => s.runJob);
  const [running, setRunning] = useState<string | null>(null);
  const savedDelivery = useDemoStore((s) => s.reportDelivery);
  const saveDelivery = useDemoStore((s) => s.saveReportDelivery);
  const [delivery, setDelivery] = useState(savedDelivery);
  const deliveryDirty = JSON.stringify(delivery) !== JSON.stringify(savedDelivery);
  return (
    <AdminShell>
      <PageHeader title={t("ad.j.title")} description={t("ad.j.desc")} />
      <Panel bodyClassName="p-0">
        <ul className="divide-y divide-line">
          {jobs.map((j) => (
            <li key={j.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_9rem_8rem_auto] md:items-center">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-strong">{t(`job.${j.id}.name` as MessageKey)}</p>
                <p className="text-xs text-muted">{t(`job.${j.id}.desc` as MessageKey)}</p>
              </div>
              <span className="ref text-xs text-muted">{j.cron === "manual" ? t("ad.j.manual") : j.cron}</span>
              <span className="text-xs">
                {j.lastResult === "failed" ? <Badge tone="danger">{t("ad.j.failed")}</Badge> : <Badge tone="success">{t("ad.j.ok")}</Badge>}
                <span className="mt-1 block text-muted">{j.lastRunAt ? formatRelative(j.lastRunAt, undefined, locale) : t("ad.j.never")}</span>
              </span>
              <div className="flex items-center gap-3">
                <Switch checked={j.enabled} onCheckedChange={() => toggle(j.id)} aria-label={t("ad.j.enable", { name: t(`job.${j.id}.name` as MessageKey) })} />
                <Button
                  size="xs"
                  variant="secondary"
                  loading={running === j.id}
                  onClick={async () => {
                    setRunning(j.id);
                    await new Promise((r) => setTimeout(r, 900));
                    run(j.id);
                    setRunning(null);
                    toast.success(t("ad.j.done", { name: t(`job.${j.id}.name` as MessageKey) }), t("ad.j.simulated"));
                  }}
                >
                  <Play /> {t("ad.j.run")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title={t("ad.j.delivery")} description={t("ad.j.deliveryDesc")} className="mt-6">
        <div className="space-y-4">
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={delivery.monthly} onCheckedChange={(v) => setDelivery({ ...delivery, monthly: v })} aria-label={t("ad.j.monthlyLabel")} /> {t("ad.j.monthly")}
          </label>
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={delivery.weekly} onCheckedChange={(v) => setDelivery({ ...delivery, weekly: v })} aria-label={t("ad.j.weeklyLabel")} /> {t("ad.j.weekly")}
          </label>
          <Field label={t("ad.j.recipients")}>{(a) => <Textarea {...a} rows={2} value={delivery.recipients} onChange={(e) => setDelivery({ ...delivery, recipients: e.target.value })} />}</Field>
          <Button
            variant="secondary"
            disabled={!deliveryDirty}
            onClick={() => {
              saveDelivery(delivery);
              toast.success(t("ad.j.saved"), t("ad.logged"));
            }}
          >
            {t("ad.j.save")}
          </Button>
        </div>
      </Panel>
    </AdminShell>
  );
}

/* ———————————————————————————— Notifications ———————————————————————————— */

export function AdminNotifications() {
  const { t, locale } = useI18n();
  const notices = useDemoStore((s) => s.notices);
  const toggle = useDemoStore((s) => s.toggleNotice);
  const publish = useDemoStore((s) => s.publishNotice);
  const [form, setForm] = useState({ title: "", body: "", kind: "maintenance" as "maintenance" | "regulatory" | "general" });
  const [confirm, setConfirm] = useState(false);
  return (
    <AdminShell>
      <PageHeader title={t("ad.n.title")} description={t("ad.n.desc")} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Panel bodyClassName="p-0">
          <ul className="divide-y divide-line">
            {notices.map((n) => (
              <li key={n.id} className="flex items-start gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Tag>{t(`ntk.${n.kind}`)}</Tag>
                    <span className="text-xs text-muted">{formatDateTime(n.publishedAt, locale)}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-ink-strong">{locale === "bn" && n.titleBn ? n.titleBn : n.title}</p>
                  <p className="text-xs text-muted">{locale === "bn" && n.bodyBn ? n.bodyBn : n.body}</p>
                </div>
                <label className="flex items-center gap-2 text-xs text-muted">
                  <Switch checked={n.visibleOnPortal} onCheckedChange={() => toggle(n.id)} aria-label={t("ad.n.show", { title: locale === "bn" && n.titleBn ? n.titleBn : n.title })} /> {t("ad.n.onPortal")}
                </label>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={t("ad.n.publish")}>
          <div className="space-y-4">
            <Field label={t("ad.n.type")}>
              {(a) => (
                <Select {...a} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as typeof form.kind })}>
                  <option value="maintenance">{t("ntk.maintenance")}</option>
                  <option value="regulatory">{t("ntk.regulatory")}</option>
                  <option value="general">{t("ntk.general")}</option>
                </Select>
              )}
            </Field>
            <Field label={t("ad.n.titleField")} required>{(a) => <Input {...a} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />}</Field>
            <Field label={t("ad.n.message")} required>{(a) => <Textarea {...a} rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />}</Field>
            <Button className="w-full" disabled={!form.title.trim() || !form.body.trim()} onClick={() => setConfirm(true)}>
              <Megaphone /> {t("ad.n.publishBtn")}
            </Button>
          </div>
        </Panel>
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t("ad.n.q")}
        description={t("ad.n.qDesc")}
        confirmLabel={t("ad.n.yes")}
        onConfirm={() => {
          publish(form.title.trim(), form.body.trim(), form.kind);
          setForm({ title: "", body: "", kind: "maintenance" });
          setConfirm(false);
          toast.success(t("ad.n.toast"), t("ad.n.toastBody"));
        }}
      />
    </AdminShell>
  );
}

/* ———————————————————————————— Audit ———————————————————————————— */

export function AdminAudit() {
  const { t, locale } = useI18n();
  const L = useLabels();
  const audit = useDemoStore((s) => s.audit);
  const users = useDemoStore((s) => s.users);
  const [sev, setSev] = useState("");
  const [q, setQ] = useState("");
  const rows = audit.filter((a) => (!sev || a.severity === sev) && (!q || `${a.action} ${a.target} ${a.detail ?? ""} ${userName(users, a.actorId)}`.toLowerCase().includes(q.toLowerCase())));
  const columns: ColumnDef<AuditEntry, unknown>[] = useMemo(
    () => [
      { id: "at", header: t("ad.a.time"), accessorFn: (a) => a.at, cell: ({ getValue }) => <span className="tabular whitespace-nowrap text-muted">{formatDateTime(getValue() as string, locale)}</span> },
      { id: "actor", header: t("ad.a.actor"), accessorFn: (a) => userName(users, a.actorId) },
      { id: "action", header: t("ad.a.action"), accessorFn: (a) => a.action, cell: ({ getValue }) => <span className="whitespace-nowrap text-xs"><span className="block font-medium text-teal-800">{L.audit(getValue() as string)}</span><span className="ref text-muted">{getValue() as string}</span></span> },
      { id: "target", header: t("ad.a.target"), accessorFn: (a) => L.auditTarget(a.target), cell: ({ getValue }) => <span className="block max-w-[12rem] truncate">{getValue() as string}</span> },
      { id: "detail", header: t("ad.a.detail"), accessorFn: (a) => a.detail ?? "", cell: ({ getValue }) => <span className="block max-w-[18rem] truncate text-muted">{getValue() as string}</span> },
      { id: "ip", header: t("ad.a.ip"), accessorFn: (a) => a.ip ?? "", cell: ({ getValue }) => <span className="ref text-xs text-muted">{getValue() as string}</span> },
      { id: "sev", header: t("ad.a.severity"), accessorFn: (a) => a.severity, cell: ({ getValue }) => <Badge tone={getValue() === "warning" ? "warning" : getValue() === "notice" ? "info" : "neutral"}>{t(`sev.${getValue() as AuditEntry["severity"]}`)}</Badge> },
    ],
    [users, t, locale, L],
  );
  return (
    <AdminShell>
      <PageHeader
        title={t("ad.a.title")}
        description={t("ad.a.desc")}
        actions={
          <Button
            variant="secondary"
            onClick={() => downloadText("ecps-audit.csv", toCsv(rows.map((a) => ({ time: a.at, actor: userName(users, a.actorId), action: a.action, target: a.target, detail: a.detail ?? "", ip: a.ip ?? "", severity: a.severity }))))}
          >
            <Download /> {t("ad.a.export")}
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="w-full sm:w-72">
          <Input leading={<Search />} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("ad.a.search")} aria-label={t("ad.a.searchLabel")} />
        </div>
        <Select value={sev} onChange={(e) => setSev(e.target.value)} aria-label={t("ad.a.severity")} className="w-40">
          <option value="">{t("ad.a.allSev")}</option>
          <option value="info">{t("sev.info")}</option>
          <option value="notice">{t("sev.notice")}</option>
          <option value="warning">{t("sev.warning")}</option>
        </Select>
      </div>
      <DataTable data={rows} columns={columns} caption={t("ad.a.title")} initialSort={[{ id: "at", desc: true }]} pageSize={20} dense />
      <p className="mt-3 text-xs text-muted">{t("ad.a.note")}</p>
    </AdminShell>
  );
}

