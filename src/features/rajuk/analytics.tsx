"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AlarmClock, ArrowRight, CheckCircle2, Download, FileBarChart2, Printer, RefreshCw, XCircle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChartFrame, HBarChart, SERIES, STATUS, TrendChart, VBarChart } from "@/components/charts/charts";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Avatar, Badge, PageHeader, Panel } from "@/components/ui/display";
import { Callout } from "@/components/ui/feedback";
import { Field, SegmentedControl, Select } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { ZONES } from "@/lib/domain/catalog";
import type { Payment, StageKey } from "@/lib/domain/types";
import { STAGE_LABEL } from "@/lib/domain/workflow";
import { useDemoStore } from "@/lib/store/demo-store";
import { cn, downloadText, formatBDT, formatDate, toCsv } from "@/lib/utils";
import { ACTIVE, useRajukData } from "./hooks";

const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];

function HeroStat({ label, value, sub, tone, href }: { label: string; value: string; sub?: string; tone?: "danger"; href?: string }) {
  const body = (
    <>
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("tabular mt-1 break-words font-display text-[1.375rem] font-semibold leading-tight tracking-tight sm:text-[1.75rem] xl:text-[2rem] xl:leading-none", tone === "danger" ? "text-danger-700" : "text-ink-strong")}>{value}</p>
      {sub && <p className="mt-1.5 text-xs text-muted">{sub}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="block bg-surface px-5 py-4 transition-colors hover:bg-surface-2">
      {body}
    </Link>
  ) : (
    <div className="bg-surface px-5 py-4">{body}</div>
  );
}

/* ———————————————————————————— Management (TOR 2.5) ———————————————————————————— */

export function ManagementDashboard() {
  const { applications, users } = useRajukData();
  const [zone, setZone] = useState("");
  const [type, setType] = useState("");
  const scoped = applications.filter((a) => (!zone || a.property.zone === zone) && (!type || a.type.startsWith(type)));
  const active = scoped.filter(ACTIVE);
  const over = active.filter((a) => a.holding.state === "exceeded");

  // Illustrative six-month series (scaled by the current filter so the view reacts to it).
  const factor = (zone ? 0.18 : 1) * (type === "PP" ? 0.45 : type === "CP" ? 0.4 : 1);
  const trend = MONTHS.map((m, i) => ({ month: m, submitted: Math.round((182 + i * 9 + (i % 2) * 14) * factor), decided: Math.round((160 + i * 11 - (i === 3 ? 18 : 0)) * factor) }));

  const stages: StageKey[] = ["front_desk", "building_inspector", "chief_building_inspector", "assistant_authorized_officer", "authorized_officer", "deputy_town_planner", "town_planner", "chief_town_planner", "department_review", "bc_committee", "signing", "fee_and_drawings"];
  const byStage = stages
    .map((s) => ({ stage: STAGE_LABEL[s], within: active.filter((a) => a.stage === s && a.holding.state !== "exceeded").length, over: active.filter((a) => a.stage === s && a.holding.state === "exceeded").length }))
    .filter((r) => r.within + r.over > 0);
  const bins = [
    { bin: "0–2 days", files: active.filter((a) => a.holding.days <= 2).length },
    { bin: "3–5 days", files: active.filter((a) => a.holding.days >= 3 && a.holding.days <= 5).length },
    { bin: "6–10 days", files: active.filter((a) => a.holding.days >= 6 && a.holding.days <= 10).length },
    { bin: "11+ days", files: active.filter((a) => a.holding.days > 10).length },
  ];
  const depts = [
    { dept: "Development Control", files: active.filter((a) => ["front_desk", "building_inspector", "chief_building_inspector", "assistant_authorized_officer", "authorized_officer", "signing"].includes(a.stage)).length },
    { dept: "Town Planning", files: active.filter((a) => ["deputy_town_planner", "town_planner", "chief_town_planner"].includes(a.stage) || a.department === "town_planning").length },
    { dept: "Estate", files: active.filter((a) => a.department === "estate").length },
    { dept: "Committees", files: active.filter((a) => a.stage === "bc_committee").length },
  ];
  const byZone = ZONES.map((z) => {
    const files = applications.filter((a) => ACTIVE(a) && a.property.zone === z);
    return { zone: z.replace("Zone ", "Z"), within: files.filter((a) => a.holding.state !== "exceeded").length, over: files.filter((a) => a.holding.state === "exceeded").length };
  });
  const officers = users
    .filter((u) => ["officer", "inspector"].includes(u.role) && u.status === "active")
    .map((u) => {
      const held = active.filter((a) => a.holderId === u.id);
      return { u, held: held.length, over: held.filter((a) => a.holding.state === "exceeded").length };
    })
    .filter((r) => r.held > 0)
    .sort((a, b) => b.over - a.over || b.held - a.held)
    .slice(0, 6);
  const issued6m = trend.reduce((s, r) => s + Math.round(r.decided * 0.78), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Management dashboard · TOR 2.5"
        title="Permitting performance"
        description="Workload, holding time and throughput across zones and departments. Historical series are illustrative; current-pipeline figures come from the demo records."
        actions={
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer /> Print
          </Button>
        }
      />
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Zone" className="w-36">
          {(a) => (
            <Select {...a} value={zone} onChange={(e) => setZone(e.target.value)}>
              <option value="">All zones</option>
              {ZONES.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Permit type" className="w-44">
          {(a) => (
            <Select {...a} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All types</option>
              <option value="PP">Planning Permits</option>
              <option value="CP">Construction Permits</option>
            </Select>
          )}
        </Field>
        <p className="pb-2 text-xs text-muted">Period: last 6 months</p>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
        <HeroStat label="Active files" value={String(active.length)} sub="In the current pipeline" href="/rajuk/monitoring" />
        <HeroStat label="Over holding limit" value={`${active.length ? Math.round((over.length / active.length) * 100) : 0}%`} sub={`${over.length} files need escalation`} tone={over.length ? "danger" : undefined} href="/rajuk/monitoring" />
        <HeroStat label="Median working days at stage" value={String(active.length ? [...active].sort((a, b) => a.holding.days - b.holding.days)[Math.floor(active.length / 2)]!.holding.days : 0)} sub="Current pipeline" />
        <HeroStat label="Permits issued" value={issued6m.toLocaleString("en-IN")} sub="6 months · illustrative" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartFrame
          title="Submissions and decisions"
          description="Monthly applications received vs decided (illustrative series)."
          series={[
            { key: "submitted", label: "Submitted" },
            { key: "decided", label: "Decided" },
          ]}
          table={{ columns: ["Month", "Submitted", "Decided"], rows: trend.map((r) => [r.month, r.submitted, r.decided]) }}
        >
          <TrendChart data={trend} xKey="month" series={[{ key: "submitted", label: "Submitted" }, { key: "decided", label: "Decided" }]} />
        </ChartFrame>
        <ChartFrame
          title="Workflow distribution"
          description="Active files by stage; red = over holding limit."
          series={[
            { key: "within", label: "Within limit", color: SERIES[0] },
            { key: "over", label: "Over limit", color: STATUS.critical },
          ]}
          table={{ columns: ["Stage", "Within", "Over"], rows: byStage.map((r) => [r.stage, r.within, r.over]) }}
          height={Math.max(220, byStage.length * 30 + 30)}
        >
          <HBarChart data={byStage} yKey="stage" stacked series={[{ key: "within", label: "Within limit", color: SERIES[0] }, { key: "over", label: "Over limit", color: STATUS.critical }]} />
        </ChartFrame>
        <ChartFrame title="Holding duration" description="Working days the file has spent at its current stage." table={{ columns: ["Days at stage", "Files"], rows: bins.map((b) => [b.bin, b.files]) }} height={220}>
          <VBarChart data={bins} xKey="bin" series={[{ key: "files", label: "Files", color: SERIES[0] }]} colorFor={(row) => (row.bin === "11+ days" ? STATUS.critical : row.bin === "6–10 days" ? STATUS.warning : undefined)} />
        </ChartFrame>
        <ChartFrame title="Departmental workload" description="Active files by responsible department." table={{ columns: ["Department", "Files"], rows: depts.map((d) => [d.dept, d.files]) }} height={220}>
          <HBarChart data={depts} yKey="dept" series={[{ key: "files", label: "Files", color: SERIES[2] }]} />
        </ChartFrame>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ChartFrame
          title="Zones"
          description="Active files per zone (all types)."
          series={[
            { key: "within", label: "Within limit", color: SERIES[0] },
            { key: "over", label: "Over limit", color: STATUS.critical },
          ]}
          table={{ columns: ["Zone", "Within", "Over"], rows: byZone.map((z) => [z.zone, z.within, z.over]) }}
          height={220}
        >
          <VBarChart data={byZone} xKey="zone" stacked series={[{ key: "within", label: "Within limit", color: SERIES[0] }, { key: "over", label: "Over limit", color: STATUS.critical }]} />
        </ChartFrame>
        <Panel
          title="Officer-level monitoring"
          description="Highest holding load first."
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href="/rajuk/monitoring">
                Full register <ArrowRight />
              </Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-line">
            {officers.map((r) => (
              <li key={r.u.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={r.u.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-strong">{r.u.name}</p>
                  <p className="truncate text-xs text-muted">
                    {r.u.designation}
                    {r.u.zone ? ` · ${r.u.zone}` : ""}
                  </p>
                </div>
                <span className="tabular text-sm text-ink">{r.held} held</span>
                {r.over > 0 ? (
                  <Badge tone="danger" icon={AlarmClock}>
                    {r.over} over
                  </Badge>
                ) : (
                  <Badge tone="success">On time</Badge>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <Callout tone="demo">Figures labelled illustrative are not RAJUK performance data. Live dashboards would read from the ECPS reporting database with role-based access.</Callout>
    </div>
  );
}

/* ———————————————————————————— Finance (TOR 2.6) ———————————————————————————— */

const CAT_LABEL: Record<Payment["category"], string> = { application_fee: "Application fee", permit_fee: "Permit fee", oc_fee: "OC fee", renewal_fee: "Renewal fee", appeal_fee: "Appeal fee" };

export function FinanceDashboard() {
  const payments = useDemoStore((s) => s.payments);
  const reconcile = useDemoStore((s) => s.reconcilePayment);
  const [period, setPeriod] = useState<"30" | "90" | "180">("90");
  const [cat, setCat] = useState("");
  const [zone, setZone] = useState("");
  const [report, setReport] = useState("collection");
  const [now] = useState(() => Date.now());

  const cutoff = now - Number(period) * 86400000;
  const scoped = useMemo(() => payments.filter((p) => new Date(p.paidAt ?? p.createdAt).getTime() >= cutoff && (!cat || p.category === cat) && (!zone || p.zone === zone)), [payments, cutoff, cat, zone]);
  const paid = scoped.filter((p) => p.status === "paid");
  const pending = scoped.filter((p) => p.status === "pending");
  const failed = scoped.filter((p) => p.status === "failed" || p.status === "refunded");
  const unreconciled = paid.filter((p) => !p.reconciled);

  const monthly = useMemo(() => {
    const keys = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString("en-GB", { month: "short" }) };
    });
    return keys.map((k) => {
      const inMonth = payments.filter((p) => p.status === "paid" && p.paidAt && `${new Date(p.paidAt).getFullYear()}-${new Date(p.paidAt).getMonth()}` === k.key && (!zone || p.zone === zone));
      const sum = (c: Payment["category"][]) => Math.round(inMonth.filter((p) => c.includes(p.category)).reduce((s, p) => s + p.amount, 0) / 1000);
      return { month: k.label, permit: sum(["permit_fee"]), application: sum(["application_fee"]), oc: sum(["oc_fee"]), other: sum(["renewal_fee", "appeal_fee"]) };
    });
  }, [payments, zone]);
  const channels = (["Mobile banking", "Card", "Internet banking"] as const).map((c) => ({ channel: c, amount: Math.round(paid.filter((p) => p.channel === c).reduce((s, p) => s + p.amount, 0) / 1000) }));

  const columns: ColumnDef<Payment, unknown>[] = useMemo(
    () => [
      { id: "date", header: "Date", accessorFn: (p) => p.paidAt ?? p.createdAt, cell: ({ getValue }) => <span className="tabular whitespace-nowrap text-muted">{formatDate(getValue() as string)}</span> },
      { id: "ref", header: "Application", accessorFn: (p) => p.applicationRef, cell: ({ getValue }) => <span className="ref whitespace-nowrap text-ink-strong">{getValue() as string}</span> },
      { id: "cat", header: "Category", accessorFn: (p) => CAT_LABEL[p.category] },
      { id: "zone", header: "Zone", accessorFn: (p) => p.zone },
      { id: "channel", header: "Channel", accessorFn: (p) => p.channel },
      { id: "gw", header: "Gateway ref", accessorFn: (p) => p.gatewayRef ?? "—", cell: ({ getValue }) => <span className="ref text-xs text-muted">{getValue() as string}</span> },
      { id: "amount", header: "Amount", accessorFn: (p) => p.amount, meta: { align: "right" }, cell: ({ getValue }) => <span className="tabular font-medium text-ink-strong">{formatBDT(getValue() as number)}</span> },
      {
        id: "status",
        header: "Status",
        accessorFn: (p) => p.status,
        cell: ({ row: { original: p } }) => (
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <Badge tone={p.status === "paid" ? "success" : p.status === "pending" ? "warning" : "danger"}>{p.status}</Badge>
            {p.status === "paid" && !p.reconciled && <Badge tone="accent">unreconciled</Badge>}
          </span>
        ),
      },
    ],
    [],
  );

  const exportReport = () => {
    const rows =
      report === "collection"
        ? paid.map((p) => ({ date: (p.paidAt ?? "").slice(0, 10), application: p.applicationRef, category: CAT_LABEL[p.category], zone: p.zone, channel: p.channel, gateway_ref: p.gatewayRef ?? "", amount_bdt: p.amount }))
        : report === "category"
          ? (Object.keys(CAT_LABEL) as Payment["category"][]).map((c) => ({ category: CAT_LABEL[c], transactions: paid.filter((p) => p.category === c).length, amount_bdt: paid.filter((p) => p.category === c).reduce((s, p) => s + p.amount, 0) }))
          : report === "zone"
            ? ZONES.map((z) => ({ zone: z, transactions: paid.filter((p) => p.zone === z).length, amount_bdt: paid.filter((p) => p.zone === z).reduce((s, p) => s + p.amount, 0) }))
            : failed.map((p) => ({ date: p.createdAt.slice(0, 10), application: p.applicationRef, status: p.status, amount_bdt: p.amount }));
    downloadText(`ecps-finance-${report}-${period}d.csv`, toCsv(rows));
    toast.success("Report exported", `${rows.length} rows · illustrative data`);
  };

  return (
    <div className="space-y-6">
      <PageHeader kicker="Finance dashboard · TOR 2.6" title="Payments & reconciliation" description="Collections, payment status and gateway reconciliation. All amounts are illustrative demonstration data, not RAJUK revenue." />
      <div className="flex flex-wrap items-end gap-3">
        <SegmentedControl
          label="Period"
          value={period}
          onChange={setPeriod}
          options={[
            { value: "30", label: "30 days" },
            { value: "90", label: "90 days" },
            { value: "180", label: "180 days" },
          ]}
        />
        <Select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Fee category" className="w-44">
          <option value="">All categories</option>
          {Object.entries(CAT_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Select value={zone} onChange={(e) => setZone(e.target.value)} aria-label="Zone" className="w-36">
          <option value="">All zones</option>
          {ZONES.map((z) => (
            <option key={z}>{z}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
        <HeroStat label="Collected" value={formatBDT(paid.reduce((s, p) => s + p.amount, 0))} sub={`${paid.length} transaction${paid.length === 1 ? "" : "s"}`} />
        <HeroStat label="Pending payment" value={formatBDT(pending.reduce((s, p) => s + p.amount, 0))} sub={`${pending.length} request${pending.length === 1 ? "" : "s"} open`} />
        <HeroStat label="Failed / refunded" value={String(failed.length)} sub="Gateway status" tone={failed.length ? "danger" : undefined} />
        <HeroStat label="Awaiting reconciliation" value={String(unreconciled.length)} sub="Paid, not yet matched" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ChartFrame
          title="Monthly collections by fee category"
          description="Thousand Taka · last six months."
          series={[
            { key: "permit", label: "Permit fee" },
            { key: "application", label: "Application fee" },
            { key: "oc", label: "OC fee" },
            { key: "other", label: "Renewal & appeal" },
          ]}
          table={{ columns: ["Month", "Permit", "Application", "OC", "Other"], rows: monthly.map((m) => [m.month, m.permit, m.application, m.oc, m.other]) }}
        >
          <VBarChart data={monthly} xKey="month" stacked format={(v) => `${v}k`} series={[{ key: "permit", label: "Permit fee" }, { key: "application", label: "Application fee" }, { key: "oc", label: "OC fee" }, { key: "other", label: "Renewal & appeal" }]} />
        </ChartFrame>
        <ChartFrame title="Payment channel" description="Collected, thousand Taka." table={{ columns: ["Channel", "Amount (k৳)"], rows: channels.map((c) => [c.channel, c.amount]) }}>
          <HBarChart data={channels} yKey="channel" format={(v) => `${v}k`} series={[{ key: "amount", label: "Collected", color: SERIES[2] }]} />
        </ChartFrame>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel title="Transactions" bodyClassName="p-0">
          <DataTable data={scoped} columns={columns} caption="Payment transactions" initialSort={[{ id: "date", desc: true }]} pageSize={12} dense className="p-3" />
        </Panel>
        <div className="space-y-6">
          <Panel title="Reports" description="Generate reports as defined by RAJUK (illustrative set).">
            <div className="space-y-3">
              <Select value={report} onChange={(e) => setReport(e.target.value)} aria-label="Report type">
                <option value="collection">Collection register</option>
                <option value="category">Category-wise summary</option>
                <option value="zone">Zone-wise summary</option>
                <option value="exceptions">Failed & refunded</option>
              </Select>
              <Button className="w-full" variant="secondary" onClick={exportReport}>
                <Download /> Export CSV
              </Button>
              <Button className="w-full" variant="ghost" onClick={() => window.print()}>
                <FileBarChart2 /> Print / PDF
              </Button>
            </div>
          </Panel>
          <Panel title="Reconciliation queue" description="Paid in ECPS, not yet matched to gateway settlement." bodyClassName="p-0">
            {unreconciled.length === 0 ? (
              <p className="flex items-center gap-2 px-5 py-5 text-sm text-success-700">
                <CheckCircle2 className="size-4" aria-hidden /> All matched for this period.
              </p>
            ) : (
              <ul className="scrollbar-thin max-h-80 divide-y divide-line overflow-y-auto">
                {unreconciled.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="ref truncate text-ink-strong">{p.gatewayRef}</p>
                      <p className="text-xs text-muted">
                        {p.applicationRef} · {formatBDT(p.amount)}
                      </p>
                    </div>
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => {
                        reconcile(p.id);
                        toast.success("Marked reconciled (simulated)");
                      }}
                    >
                      <RefreshCw /> Match
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <p className="flex items-center gap-1.5 border-t border-line px-5 py-2.5 text-[0.6875rem] text-muted">
              <XCircle className="size-3.5" aria-hidden /> Live matching requires the payment gateway settlement API.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

