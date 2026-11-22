"use client";

import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Database, Headset, Network, PlugZap, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, PageHeader, Panel, Tag } from "@/components/ui/display";
import { Callout, EmptyState, ProgressBar, SimulatedTag } from "@/components/ui/feedback";
import { Input, SegmentedControl, Select } from "@/components/ui/form";
import { Sheet } from "@/components/ui/overlay";
import { toast } from "@/components/ui/toast";
import { CATEGORY_LABEL, TICKET_LABEL, TICKET_TONE } from "@/features/helpdesk/user-tickets";
import type { Integration, MigrationBatch, Ticket } from "@/lib/domain/types";
import { ecps } from "@/lib/services";
import { useDemoStore, userName } from "@/lib/store/demo-store";
import { cn, formatDateTime, formatRelative } from "@/lib/utils";

/* ———————————————————————————— Integrations & migration ———————————————————————————— */

const STATE_META: Record<Integration["state"], { label: string; tone: "info" | "warning" | "neutral" }> = {
  existing_upgrade: { label: "Exists in ECPS · upgrade", tone: "info" },
  new_required: { label: "New · required by TOR", tone: "warning" },
  conditional: { label: "Conditional", tone: "neutral" },
};

export function IntegrationsPage() {
  const integrations = useDemoStore((s) => s.integrations);
  const migration = useDemoStore((s) => s.migration);
  const check = useDemoStore((s) => s.runIntegrationCheck);
  const advance = useDemoStore((s) => s.advanceMigration);
  const [checking, setChecking] = useState<string | null>(null);
  const totals = migration.reduce((t, b) => ({ records: t.records + b.records, migrated: t.migrated + b.migrated, failed: t.failed + b.failed }), { records: 0, migrated: 0, failed: 0 });

  return (
    <div className="space-y-6">
      <PageHeader kicker="TOR 1.7 · 1.8 · 2.2 · 2.3 · 2.11" title="Integrations & data migration" description="Status of approved external connections and the legacy Construction Permit (CP) system migration." meta={<SimulatedTag>All adapters are mocks in this prototype</SimulatedTag>} />
      <Callout tone="demo">No live connection exists. Each row shows the integration&apos;s purpose and TOR basis; a real adapter requires partner agreement, API specification and test environment (see INTEGRATION_NOTES.md).</Callout>
      <Panel title="External systems" bodyClassName="p-0">
        <ul className="divide-y divide-line">
          {integrations.map((i) => {
            const DirIcon = i.direction === "inbound" ? ArrowDownLeft : i.direction === "outbound" ? ArrowUpRight : ArrowLeftRight;
            return (
              <li key={i.key} className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_auto] lg:items-center">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-3 text-slate-ink">
                    <Network className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-strong">{i.name}</p>
                    <p className="text-xs text-muted">
                      {i.owner} · {i.purpose}
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-2 text-xs text-muted">
                  <DirIcon className="size-3.5" aria-hidden /> {i.direction} · <span className="ref">TOR {i.torRef}</span>
                </span>
                <Badge tone={STATE_META[i.state].tone}>{STATE_META[i.state].label}</Badge>
                <div className="flex items-center gap-3 lg:justify-end">
                  {i.lastCheckAt && <span className="text-xs text-success-700">Mock OK · {formatRelative(i.lastCheckAt)}</span>}
                  <Button
                    size="xs"
                    variant="secondary"
                    loading={checking === i.key}
                    onClick={async () => {
                      setChecking(i.key);
                      await new Promise((r) => setTimeout(r, 800));
                      check(i.key);
                      setChecking(null);
                      toast.info(`${i.name}: mock adapter responded`, "This is not a live connectivity test.");
                    }}
                  >
                    <PlugZap /> Test mock
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="Legacy CP system migration" description="Batch migration with validation and reconciliation (TOR 2.11). Volumes are illustrative." actions={<Database className="size-4 text-subtle" aria-hidden />}>
        <dl className="mb-6 grid grid-cols-3 gap-4">
          <div>
            <dt className="text-xs text-muted">Source records</dt>
            <dd className="tabular font-display text-2xl font-semibold text-ink-strong">{totals.records.toLocaleString("en-IN")}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Migrated</dt>
            <dd className="tabular font-display text-2xl font-semibold text-ink-strong">{totals.migrated.toLocaleString("en-IN")}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Exceptions</dt>
            <dd className={cn("tabular font-display text-2xl font-semibold", totals.failed ? "text-danger-700" : "text-ink-strong")}>{totals.failed.toLocaleString("en-IN")}</dd>
          </div>
        </dl>
        <ul className="space-y-4">
          {migration.map((b: MigrationBatch) => (
            <li key={b.id} className="rounded-lg border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink-strong">
                    {b.label} · {b.sourceRange}
                  </p>
                  <p className="text-xs text-muted">{b.startedAt ? `Started ${formatRelative(b.startedAt)}` : "Not started"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={b.status === "reconciled" ? "success" : b.status === "exceptions" ? "danger" : b.status === "validating" ? "progress" : "neutral"}>{b.status}</Badge>
                  {b.status !== "reconciled" && (
                    <Button size="xs" variant="secondary" onClick={() => advance(b.id)}>
                      {b.status === "queued" ? "Start batch" : b.status === "validating" ? "Finish validation" : "Resolve exceptions"}
                    </Button>
                  )}
                </div>
              </div>
              <ProgressBar value={b.migrated / b.records} className="mt-3" tone={b.status === "exceptions" ? "amber" : b.status === "reconciled" ? "success" : "teal"} label={`${b.label} progress`} />
              <p className="tabular mt-1.5 text-xs text-muted">
                {b.migrated.toLocaleString("en-IN")} / {b.records.toLocaleString("en-IN")} records{b.failed ? ` · ${b.failed} exceptions (e.g. missing RS dag, duplicate file number)` : ""}
              </p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

/* ———————————————————————————— Helpdesk (support staff) ———————————————————————————— */

export function HelpdeskConsole() {
  const tickets = useDemoStore((s) => s.tickets);
  const users = useDemoStore((s) => s.users);
  const assign = useDemoStore((s) => s.assignTicket);
  const session = useDemoStore((s) => s.session);
  const [status, setStatus] = useState<"active" | Ticket["status"] | "all">("active");
  const [cat, setCat] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const list = useMemo(
    () =>
      tickets
        .filter((t) => (status === "all" ? true : status === "active" ? !["resolved", "closed"].includes(t.status) : t.status === status))
        .filter((t) => !cat || t.category === cat)
        .sort((a, b) => (a.priority === "high" ? -1 : 0) - (b.priority === "high" ? -1 : 0) || b.updatedAt.localeCompare(a.updatedAt)),
    [tickets, status, cat],
  );
  const t = tickets.find((x) => x.id === openId);
  const staff = users.filter((u) => u.role === "support");
  const counts = { open: tickets.filter((x) => x.status === "open").length, in_progress: tickets.filter((x) => x.status === "in_progress").length, awaiting_user: tickets.filter((x) => x.status === "awaiting_user").length, resolved: tickets.filter((x) => x.status === "resolved").length };

  return (
    <div>
      <PageHeader kicker="Helpdesk · TOR §6" title="Support queue" description="Every query is logged with caller, time, category and resolution, so RAJUK can monitor response times." />
      <div className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-4">
        {(Object.keys(counts) as Array<keyof typeof counts>).map((k) => (
          <button key={k} type="button" onClick={() => setStatus(k)} className={cn("bg-surface px-5 py-4 text-left transition-colors hover:bg-surface-2", status === k && "bg-teal-50/60")}>
            <p className="text-xs text-muted">{TICKET_LABEL[k]}</p>
            <p className="tabular mt-1 font-display text-2xl font-semibold text-ink-strong">{counts[k]}</p>
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SegmentedControl label="Status" value={status === "active" || status === "all" ? status : "active"} onChange={(v) => setStatus(v)} options={[{ value: "active", label: "Active" }, { value: "all", label: "All" }]} />
        <Select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category" className="w-52">
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>
      {list.length === 0 ? (
        <EmptyState icon={Headset} title="Queue is clear" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <caption className="sr-only">Support tickets</caption>
            <thead className="bg-surface-2 text-[0.6875rem] uppercase tracking-[0.06em] text-muted">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-semibold">Ticket</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Raised by</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Category</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Age</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Assignee</th>
                <th scope="col" className="px-5 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((x) => (
                <tr key={x.id} tabIndex={0} onClick={() => setOpenId(x.id)} onKeyDown={(e) => e.key === "Enter" && setOpenId(x.id)} className="cursor-pointer hover:bg-teal-50/40 focus-visible:bg-teal-50/60 focus-visible:outline-none">
                  <td className="px-5 py-3">
                    <span className="ref text-ink-strong">{x.ref}</span>
                    {x.priority === "high" && <Tag className="ml-2 bg-danger-100 text-danger-700">HIGH</Tag>}
                    <span className="block max-w-[18rem] truncate text-xs text-muted">{x.subject}</span>
                  </td>
                  <td className="px-3 py-3">{userName(users, x.raisedBy)}</td>
                  <td className="px-3 py-3 text-muted">{CATEGORY_LABEL[x.category]}</td>
                  <td className="px-3 py-3 text-muted">{formatRelative(x.createdAt)}</td>
                  <td className="px-3 py-3">{x.assigneeId ? userName(users, x.assigneeId) : <span className="text-muted">Unassigned</span>}</td>
                  <td className="px-5 py-3">
                    <Badge tone={TICKET_TONE[x.status]}>{TICKET_LABEL[x.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Sheet open={!!t} onOpenChange={(o) => !o && setOpenId(null)} title={t?.ref ?? ""} description={t?.subject} className="w-[min(34rem,100vw)]">
        {t && (
          <div className="space-y-5 p-5">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted">Caller</dt>
                <dd className="text-ink-strong">{userName(users, t.raisedBy)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Logged</dt>
                <dd className="text-ink-strong">{formatDateTime(t.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Category</dt>
                <dd className="text-ink-strong">{CATEGORY_LABEL[t.category]}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Application</dt>
                <dd className="ref text-ink-strong">{t.applicationRef ?? "—"}</dd>
              </div>
            </dl>
            <div className="grid grid-cols-2 gap-3">
              <Select value={t.assigneeId ?? ""} onChange={(e) => assign(t.id, e.target.value)} aria-label="Assignee">
                <option value="">Unassigned</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
              <Select value={t.status} onChange={async (e) => { await ecps.helpdesk.setStatus(t.id, e.target.value as Ticket["status"]); toast.success("Status updated", "The requester has been notified."); }} aria-label="Status">
                {(Object.keys(TICKET_LABEL) as Ticket["status"][]).map((s) => (
                  <option key={s} value={s}>
                    {TICKET_LABEL[s]}
                  </option>
                ))}
              </Select>
            </div>
            <ol className="space-y-3">
              {t.thread.map((m, i) => (
                <li key={i} className={cn("rounded-lg border p-3 text-sm", m.authorId === t.raisedBy ? "border-line bg-surface-2" : "border-teal-600/25 bg-teal-50/60")}>
                  <p className="mb-1 flex items-center gap-2 text-xs">
                    <Avatar name={userName(users, m.authorId)} size="xs" />
                    <span className="font-medium text-ink-strong">{userName(users, m.authorId)}</span>
                    <span className="text-muted">{formatDateTime(m.at)}</span>
                  </p>
                  <p className="text-ink">{m.text}</p>
                </li>
              ))}
            </ol>
            <form
              className="flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!reply.trim()) return;
                await ecps.helpdesk.reply(t.id, reply.trim());
                if (!t.assigneeId && session) assign(t.id, session.userId);
                setReply("");
              }}
            >
              <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to requester" aria-label="Reply" />
              <Button type="submit">
                <Send />
              </Button>
            </form>
          </div>
        )}
      </Sheet>
    </div>
  );
}
