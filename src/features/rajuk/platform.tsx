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
import { cn, formatDateTime, formatNumber, formatRelative } from "@/lib/utils";
import { useI18n, type MessageKey } from "@/lib/i18n";

/* ———————————————————————————— Integrations & migration ———————————————————————————— */

const STATE_TONE: Record<Integration["state"], "info" | "warning" | "neutral"> = { existing_upgrade: "info", new_required: "warning", conditional: "neutral" };

export function IntegrationsPage() {
  const { t, locale } = useI18n();
  const n = (v: number) => formatNumber(v, locale);
  const batchNo = (b: MigrationBatch) => b.label.replace("Batch ", "");
  const integrations = useDemoStore((s) => s.integrations);
  const migration = useDemoStore((s) => s.migration);
  const check = useDemoStore((s) => s.runIntegrationCheck);
  const advance = useDemoStore((s) => s.advanceMigration);
  const [checking, setChecking] = useState<string | null>(null);
  const totals = migration.reduce((t, b) => ({ records: t.records + b.records, migrated: t.migrated + b.migrated, failed: t.failed + b.failed }), { records: 0, migrated: 0, failed: 0 });

  return (
    <div className="space-y-6">
      <PageHeader kicker="TOR 1.7 · 1.8 · 2.2 · 2.3 · 2.11" title={t("ig.title")} description={t("ig.desc")} meta={<SimulatedTag>{t("ig.mocks")}</SimulatedTag>} />
      <Callout tone="demo">{t("ig.note")}</Callout>
      <Panel title={t("ig.external")} bodyClassName="p-0">
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
                      {t(`intg.${i.key}.owner` as MessageKey)} · {t(`intg.${i.key}.purpose` as MessageKey)}
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-2 text-xs text-muted">
                  <DirIcon className="size-3.5" aria-hidden /> {t(`dir.${i.direction}`)} · <span className="ref">TOR {i.torRef}</span>
                </span>
                <Badge tone={STATE_TONE[i.state]}>{t(`intgst.${i.state}`)}</Badge>
                <div className="flex items-center gap-3 lg:justify-end">
                  {i.lastCheckAt && <span className="text-xs text-success-700">{t("ig.mockOk", { when: formatRelative(i.lastCheckAt, undefined, locale) })}</span>}
                  <Button
                    size="xs"
                    variant="secondary"
                    loading={checking === i.key}
                    onClick={async () => {
                      setChecking(i.key);
                      await new Promise((r) => setTimeout(r, 800));
                      check(i.key);
                      setChecking(null);
                      toast.info(t("ig.mockResponded", { name: i.name }), t("ig.notLive"));
                    }}
                  >
                    <PlugZap /> {t("ig.test")}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title={t("ig.migration")} description={t("ig.migrationDesc")} actions={<Database className="size-4 text-subtle" aria-hidden />}>
        <dl className="mb-6 grid grid-cols-3 gap-4">
          <div>
            <dt className="text-xs text-muted">{t("ig.source")}</dt>
            <dd className="tabular font-display text-2xl font-semibold text-ink-strong">{n(totals.records)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t("ig.migrated")}</dt>
            <dd className="tabular font-display text-2xl font-semibold text-ink-strong">{n(totals.migrated)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t("ig.exceptions")}</dt>
            <dd className={cn("tabular font-display text-2xl font-semibold", totals.failed ? "text-danger-700" : "text-ink-strong")}>{n(totals.failed)}</dd>
          </div>
        </dl>
        <ul className="space-y-4">
          {migration.map((b: MigrationBatch) => (
            <li key={b.id} className="rounded-lg border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink-strong">
                    {t("ig.batch", { n: batchNo(b), range: b.sourceRange.replace("Legacy CP ", "") })}
                  </p>
                  <p className="text-xs text-muted">{b.startedAt ? t("ig.started", { when: formatRelative(b.startedAt, undefined, locale) }) : t("ig.notStarted")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={b.status === "reconciled" ? "success" : b.status === "exceptions" ? "danger" : b.status === "validating" ? "progress" : "neutral"}>{t(`migst.${b.status}`)}</Badge>
                  {b.status !== "reconciled" && (
                    <Button size="xs" variant="secondary" onClick={() => advance(b.id)}>
                      {b.status === "queued" ? t("ig.start") : b.status === "validating" ? t("ig.finish") : t("ig.resolve")}
                    </Button>
                  )}
                </div>
              </div>
              <ProgressBar value={b.migrated / b.records} className="mt-3" tone={b.status === "exceptions" ? "amber" : b.status === "reconciled" ? "success" : "teal"} label={t("ig.progress", { batch: t("ig.batchShort", { n: batchNo(b) }) })} />
              <p className="tabular mt-1.5 text-xs text-muted">
                {b.failed ? t("ig.recordsEx", { done: n(b.migrated), total: n(b.records), n: n(b.failed) }) : t("ig.records", { done: n(b.migrated), total: n(b.records) })}
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
  const { t: tr, locale } = useI18n();
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
      <PageHeader kicker={tr("hd.kicker")} title={tr("hd.title")} description={tr("hd.desc")} />
      <div className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-4">
        {(Object.keys(counts) as Array<keyof typeof counts>).map((k) => (
          <button key={k} type="button" onClick={() => setStatus(k)} className={cn("bg-surface px-5 py-4 text-left transition-colors hover:bg-surface-2", status === k && "bg-teal-50/60")}>
            <p className="text-xs text-muted">{tr(TICKET_LABEL[k])}</p>
            <p className="tabular mt-1 font-display text-2xl font-semibold text-ink-strong">{counts[k]}</p>
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SegmentedControl label={tr("hd.status")} value={status === "active" || status === "all" ? status : "active"} onChange={(v) => setStatus(v)} options={[{ value: "active", label: tr("hd.active") }, { value: "all", label: tr("hd.all") }]} />
        <Select value={cat} onChange={(e) => setCat(e.target.value)} aria-label={tr("hd.category")} className="w-52">
          <option value="">{tr("hd.allCats")}</option>
          {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {tr(v)}
            </option>
          ))}
        </Select>
      </div>
      {list.length === 0 ? (
        <EmptyState icon={Headset} title={tr("hd.clear")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <caption className="sr-only">{tr("hd.caption")}</caption>
            <thead className="bg-surface-2 text-[0.6875rem] uppercase tracking-[0.06em] text-muted">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-semibold">{tr("hd.ticket")}</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">{tr("hd.raisedBy")}</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">{tr("hd.category")}</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">{tr("hd.age")}</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">{tr("hd.assignee")}</th>
                <th scope="col" className="px-5 py-2.5 font-semibold">{tr("hd.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((x) => (
                <tr key={x.id} tabIndex={0} onClick={() => setOpenId(x.id)} onKeyDown={(e) => e.key === "Enter" && setOpenId(x.id)} className="cursor-pointer hover:bg-teal-50/40 focus-visible:bg-teal-50/60 focus-visible:outline-none">
                  <td className="px-5 py-3">
                    <span className="ref text-ink-strong">{x.ref}</span>
                    {x.priority === "high" && <Tag className="ml-2 bg-danger-100 text-danger-700">{tr("hd.high")}</Tag>}
                    <span className="block max-w-[18rem] truncate text-xs text-muted">{x.subject}</span>
                  </td>
                  <td className="px-3 py-3">{userName(users, x.raisedBy)}</td>
                  <td className="px-3 py-3 text-muted">{tr(CATEGORY_LABEL[x.category])}</td>
                  <td className="px-3 py-3 text-muted">{formatRelative(x.createdAt, undefined, locale)}</td>
                  <td className="px-3 py-3">{x.assigneeId ? userName(users, x.assigneeId) : <span className="text-muted">{tr("hd.unassigned")}</span>}</td>
                  <td className="px-5 py-3">
                    <Badge tone={TICKET_TONE[x.status]}>{tr(TICKET_LABEL[x.status])}</Badge>
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
                <dt className="text-xs text-muted">{tr("hd.caller")}</dt>
                <dd className="text-ink-strong">{userName(users, t.raisedBy)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">{tr("hd.logged")}</dt>
                <dd className="text-ink-strong">{formatDateTime(t.createdAt, locale)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">{tr("hd.category")}</dt>
                <dd className="text-ink-strong">{tr(CATEGORY_LABEL[t.category])}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">{tr("hd.application")}</dt>
                <dd className="ref text-ink-strong">{t.applicationRef ?? "—"}</dd>
              </div>
            </dl>
            <div className="grid grid-cols-2 gap-3">
              <Select value={t.assigneeId ?? ""} onChange={(e) => assign(t.id, e.target.value)} aria-label={tr("hd.assignee")}>
                <option value="">{tr("hd.unassigned")}</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
              <Select value={t.status} onChange={async (e) => { await ecps.helpdesk.setStatus(t.id, e.target.value as Ticket["status"]); toast.success(tr("hd.statusUpdated"), tr("hd.notified")); }} aria-label={tr("hd.status")}>
                {(Object.keys(TICKET_LABEL) as Ticket["status"][]).map((s) => (
                  <option key={s} value={s}>
                    {tr(TICKET_LABEL[s])}
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
                    <span className="text-muted">{formatDateTime(m.at, locale)}</span>
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
              <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder={tr("hd.replyPh")} aria-label={tr("hd.reply")} />
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
