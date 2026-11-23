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
import { useI18n, type MessageKey } from "@/lib/i18n";
import { useLabels } from "@/lib/i18n/labels";
import { useDemoStore } from "@/lib/store/demo-store";
import { cn, downloadText, formatBDT, formatDate, formatNumber, toBnDigits, toCsv } from "@/lib/utils";
import { ACTIVE, useRajukData } from "./hooks";

/** Six illustrative months ending November 2026, named in the reader's language. */
const monthNames = (locale: string) => Array.from({ length: 6 }, (_, i) => new Date(2026, 5 + i, 1).toLocaleString(locale === "bn" ? "bn-BD" : "en-GB", { month: "short" }));

/** Payment channel → message key (channels are stored in English). */
const CHANNEL_KEY = { Card: "pay.card", "Mobile banking": "pay.mfs", "Internet banking": "pay.bank" } as const satisfies Record<string, MessageKey>;

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
  const { t, term, locale } = useI18n();
  const L = useLabels();
  const { applications, users } = useRajukData();
  const [zone, setZone] = useState("");
  const [type, setType] = useState("");
  const scoped = applications.filter((a) => (!zone || a.property.zone === zone) && (!type || a.type.startsWith(type)));
  const active = scoped.filter(ACTIVE);
  const over = active.filter((a) => a.holding.state === "exceeded");

  // Illustrative six-month series (scaled by the current filter so the view reacts to it).
  const factor = (zone ? 0.18 : 1) * (type === "PP" ? 0.45 : type === "CP" ? 0.4 : 1);
  const trend = monthNames(locale).map((m, i) => ({ month: m, submitted: Math.round((182 + i * 9 + (i % 2) * 14) * factor), decided: Math.round((160 + i * 11 - (i === 3 ? 18 : 0)) * factor) }));

  const stages: StageKey[] = ["front_desk", "building_inspector", "chief_building_inspector", "assistant_authorized_officer", "authorized_officer", "deputy_town_planner", "town_planner", "chief_town_planner", "department_review", "bc_committee", "signing", "fee_and_drawings"];
  const byStage = stages
    .map((s) => ({ stage: L.stage(s), within: active.filter((a) => a.stage === s && a.holding.state !== "exceeded").length, over: active.filter((a) => a.stage === s && a.holding.state === "exceeded").length }))
    .filter((r) => r.within + r.over > 0);
  const bins = [
    { bin: t("mg.bin1"), files: active.filter((a) => a.holding.days <= 2).length },
    { bin: t("mg.bin2"), files: active.filter((a) => a.holding.days >= 3 && a.holding.days <= 5).length },
    { bin: t("mg.bin3"), files: active.filter((a) => a.holding.days >= 6 && a.holding.days <= 10).length },
    { bin: t("mg.bin4"), files: active.filter((a) => a.holding.days > 10).length },
  ];
  const depts = [
    { dept: L.dept("development_control"), files: active.filter((a) => ["front_desk", "building_inspector", "chief_building_inspector", "assistant_authorized_officer", "authorized_officer", "signing"].includes(a.stage)).length },
    { dept: L.dept("town_planning"), files: active.filter((a) => ["deputy_town_planner", "town_planner", "chief_town_planner"].includes(a.stage) || a.department === "town_planning").length },
    { dept: L.dept("estate"), files: active.filter((a) => a.department === "estate").length },
    { dept: L.dept("committee"), files: active.filter((a) => a.stage === "bc_committee").length },
  ];
  const byZone = ZONES.map((z) => {
    const files = applications.filter((a) => ACTIVE(a) && a.property.zone === z);
    return { zone: t("mg.zoneShort", { n: locale === "bn" ? toBnDigits(z.replace("Zone ", "")) : z.replace("Zone ", "") }), within: files.filter((a) => a.holding.state !== "exceeded").length, over: files.filter((a) => a.holding.state === "exceeded").length };
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
        kicker={t("mg.kicker")}
        title={t("mg.title")}
        description={t("mg.desc")}
        actions={
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer /> {t("mg.print")}
          </Button>
        }
      />
      <div className="flex flex-wrap items-end gap-3">
        <Field label={t("mg.zone")} className="w-36">
          {(a) => (
            <Select {...a} value={zone} onChange={(e) => setZone(e.target.value)}>
              <option value="">{t("mg.allZones")}</option>
              {ZONES.map((z) => (
                <option key={z} value={z}>
                  {term("zone", z)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("mg.type")} className="w-44">
          {(a) => (
            <Select {...a} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">{t("mg.allTypes")}</option>
              <option value="PP">{t("mg.pp")}</option>
              <option value="CP">{t("mg.cp")}</option>
            </Select>
          )}
        </Field>
        <p className="pb-2 text-xs text-muted">{t("mg.period")}</p>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
        <HeroStat label={t("mg.active")} value={formatNumber(active.length, locale)} sub={t("mg.activeSub")} href="/rajuk/monitoring" />
        <HeroStat label={t("mg.over")} value={`${formatNumber(active.length ? Math.round((over.length / active.length) * 100) : 0, locale)}%`} sub={t("mg.overSub", { n: over.length })} tone={over.length ? "danger" : undefined} href="/rajuk/monitoring" />
        <HeroStat label={t("mg.median")} value={formatNumber(active.length ? [...active].sort((a, b) => a.holding.days - b.holding.days)[Math.floor(active.length / 2)]!.holding.days : 0, locale)} sub={t("mg.medianSub")} />
        <HeroStat label={t("mg.issued")} value={formatNumber(issued6m, locale)} sub={t("mg.issuedSub")} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartFrame
          title={t("mg.trend")}
          description={t("mg.trendDesc")}
          series={[
            { key: "submitted", label: t("mg.submitted") },
            { key: "decided", label: t("mg.decided") },
          ]}
          table={{ columns: [t("mg.month"), t("mg.submitted"), t("mg.decided")], rows: trend.map((r) => [r.month, r.submitted, r.decided]) }}
        >
          <TrendChart data={trend} xKey="month" series={[{ key: "submitted", label: t("mg.submitted") }, { key: "decided", label: t("mg.decided") }]} />
        </ChartFrame>
        <ChartFrame
          title={t("mg.flow")}
          description={t("mg.flowDesc")}
          series={[
            { key: "within", label: t("rk.withinLimit"), color: SERIES[0] },
            { key: "over", label: t("rk.overLimit"), color: STATUS.critical },
          ]}
          table={{ columns: [t("rk.stage"), t("mg.within"), t("mg.overShort")], rows: byStage.map((r) => [r.stage, r.within, r.over]) }}
          height={Math.max(220, byStage.length * 30 + 30)}
        >
          <HBarChart data={byStage} yKey="stage" stacked series={[{ key: "within", label: t("rk.withinLimit"), color: SERIES[0] }, { key: "over", label: t("rk.overLimit"), color: STATUS.critical }]} />
        </ChartFrame>
        <ChartFrame title={t("mg.duration")} description={t("mg.durationDesc")} table={{ columns: [t("mg.daysAtStage"), t("mg.files")], rows: bins.map((b) => [b.bin, b.files]) }} height={220}>
          <VBarChart data={bins} xKey="bin" series={[{ key: "files", label: t("mg.files"), color: SERIES[0] }]} colorFor={(row) => (row.bin === t("mg.bin4") ? STATUS.critical : row.bin === t("mg.bin3") ? STATUS.warning : undefined)} />
        </ChartFrame>
        <ChartFrame title={t("mg.dept")} description={t("mg.deptDesc")} table={{ columns: [t("mg.department"), t("mg.files")], rows: depts.map((d) => [d.dept, d.files]) }} height={220}>
          <HBarChart data={depts} yKey="dept" series={[{ key: "files", label: t("mg.files"), color: SERIES[2] }]} />
        </ChartFrame>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ChartFrame
          title={t("mg.zones")}
          description={t("mg.zonesDesc")}
          series={[
            { key: "within", label: t("rk.withinLimit"), color: SERIES[0] },
            { key: "over", label: t("rk.overLimit"), color: STATUS.critical },
          ]}
          table={{ columns: [t("mg.zone"), t("mg.within"), t("mg.overShort")], rows: byZone.map((z) => [z.zone, z.within, z.over]) }}
          height={220}
        >
          <VBarChart data={byZone} xKey="zone" stacked series={[{ key: "within", label: t("rk.withinLimit"), color: SERIES[0] }, { key: "over", label: t("rk.overLimit"), color: STATUS.critical }]} />
        </ChartFrame>
        <Panel
          title={t("mg.officers")}
          description={t("mg.officersDesc")}
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href="/rajuk/monitoring">
                {t("mg.fullRegister")} <ArrowRight />
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
                    {term("desig", r.u.designation)}
                    {r.u.zone ? ` · ${term("zone", r.u.zone)}` : ""}
                  </p>
                </div>
                <span className="tabular text-sm text-ink">{t("mg.held", { n: r.held })}</span>
                {r.over > 0 ? (
                  <Badge tone="danger" icon={AlarmClock}>
                    {t("mg.overN", { n: r.over })}
                  </Badge>
                ) : (
                  <Badge tone="success">{t("mg.onTime")}</Badge>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <Callout tone="demo">{t("mg.note")}</Callout>
    </div>
  );
}

/* ———————————————————————————— Finance (TOR 2.6) ———————————————————————————— */

/** English labels for CSV exports (data interchange stays in English). */
const CAT_LABEL: Record<Payment["category"], string> = { application_fee: "Application fee", permit_fee: "Permit fee", oc_fee: "OC fee", renewal_fee: "Renewal fee", appeal_fee: "Appeal fee" };

export function FinanceDashboard() {
  const { t, term, locale } = useI18n();
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
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString(locale === "bn" ? "bn-BD" : "en-GB", { month: "short" }) };
    });
    return keys.map((k) => {
      const inMonth = payments.filter((p) => p.status === "paid" && p.paidAt && `${new Date(p.paidAt).getFullYear()}-${new Date(p.paidAt).getMonth()}` === k.key && (!zone || p.zone === zone));
      const sum = (c: Payment["category"][]) => Math.round(inMonth.filter((p) => c.includes(p.category)).reduce((s, p) => s + p.amount, 0) / 1000);
      return { month: k.label, permit: sum(["permit_fee"]), application: sum(["application_fee"]), oc: sum(["oc_fee"]), other: sum(["renewal_fee", "appeal_fee"]) };
    });
  }, [payments, zone, locale]);
  const channels = (["Mobile banking", "Card", "Internet banking"] as const).map((c) => ({ channel: t(CHANNEL_KEY[c]), amount: Math.round(paid.filter((p) => p.channel === c).reduce((s, p) => s + p.amount, 0) / 1000) }));

  const columns: ColumnDef<Payment, unknown>[] = useMemo(
    () => [
      { id: "date", header: t("fn.col.date"), accessorFn: (p) => p.paidAt ?? p.createdAt, cell: ({ getValue }) => <span className="tabular whitespace-nowrap text-muted">{formatDate(getValue() as string, locale)}</span> },
      { id: "ref", header: t("fn.col.app"), accessorFn: (p) => p.applicationRef, cell: ({ getValue }) => <span className="ref whitespace-nowrap text-ink-strong">{getValue() as string}</span> },
      { id: "cat", header: t("fn.col.cat"), accessorFn: (p) => t(`paycat.${p.category}`) },
      { id: "zone", header: t("fn.col.zone"), accessorFn: (p) => term("zone", p.zone) },
      { id: "channel", header: t("fn.col.channel"), accessorFn: (p) => (p.channel && p.channel in CHANNEL_KEY ? t(CHANNEL_KEY[p.channel as keyof typeof CHANNEL_KEY]) : (p.channel ?? "—")) },
      { id: "gw", header: t("fn.col.gw"), accessorFn: (p) => p.gatewayRef ?? "—", cell: ({ getValue }) => <span className="ref text-xs text-muted">{getValue() as string}</span> },
      { id: "amount", header: t("fn.col.amount"), accessorFn: (p) => p.amount, meta: { align: "right" }, cell: ({ getValue }) => <span className="tabular font-medium text-ink-strong">{formatBDT(getValue() as number, locale)}</span> },
      {
        id: "status",
        header: t("fn.col.status"),
        accessorFn: (p) => p.status,
        cell: ({ row: { original: p } }) => (
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <Badge tone={p.status === "paid" ? "success" : p.status === "pending" ? "warning" : "danger"}>{t(`pst.${p.status}`)}</Badge>
            {p.status === "paid" && !p.reconciled && <Badge tone="accent">{t("fn.unreconciled")}</Badge>}
          </span>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- labels change only with the locale
    [locale],
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
    toast.success(t("fn.exported"), t("fn.exportedBody", { n: rows.length }));
  };

  return (
    <div className="space-y-6">
      <PageHeader kicker={t("fn.kicker")} title={t("fn.title")} description={t("fn.desc")} />
      <div className="flex flex-wrap items-end gap-3">
        <SegmentedControl
          label={t("fn.period")}
          value={period}
          onChange={setPeriod}
          options={[
            { value: "30", label: t("fn.days", { n: formatNumber(30, locale) }) },
            { value: "90", label: t("fn.days", { n: formatNumber(90, locale) }) },
            { value: "180", label: t("fn.days", { n: formatNumber(180, locale) }) },
          ]}
        />
        <Select value={cat} onChange={(e) => setCat(e.target.value)} aria-label={t("fn.feeCat")} className="w-44">
          <option value="">{t("fn.allCats")}</option>
          {Object.keys(CAT_LABEL).map((k) => (
            <option key={k} value={k}>
              {t(`paycat.${k as Payment["category"]}`)}
            </option>
          ))}
        </Select>
        <Select value={zone} onChange={(e) => setZone(e.target.value)} aria-label={t("mg.zone")} className="w-36">
          <option value="">{t("mg.allZones")}</option>
          {ZONES.map((z) => (
            <option key={z} value={z}>
              {term("zone", z)}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
        <HeroStat label={t("fn.collected")} value={formatBDT(paid.reduce((s, p) => s + p.amount, 0), locale)} sub={paid.length === 1 ? t("fn.txn1") : t("fn.txn", { n: formatNumber(paid.length, locale) })} />
        <HeroStat label={t("fn.pending")} value={formatBDT(pending.reduce((s, p) => s + p.amount, 0), locale)} sub={pending.length === 1 ? t("fn.reqOpen1") : t("fn.reqOpen", { n: formatNumber(pending.length, locale) })} />
        <HeroStat label={t("fn.failed")} value={formatNumber(failed.length, locale)} sub={t("fn.gwStatus")} tone={failed.length ? "danger" : undefined} />
        <HeroStat label={t("fn.awaitRecon")} value={formatNumber(unreconciled.length, locale)} sub={t("fn.awaitReconSub")} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ChartFrame
          title={t("fn.monthly")}
          description={t("fn.monthlyDesc")}
          series={[
            { key: "permit", label: t("paycat.permit_fee") },
            { key: "application", label: t("paycat.application_fee") },
            { key: "oc", label: t("paycat.oc_fee") },
            { key: "other", label: t("fn.renewalAppeal") },
          ]}
          table={{ columns: [t("mg.month"), t("fn.permit"), t("fn.application"), t("fn.oc"), t("fn.other")], rows: monthly.map((m) => [m.month, m.permit, m.application, m.oc, m.other]) }}
        >
          <VBarChart data={monthly} xKey="month" stacked format={(v) => `${v}k`} series={[{ key: "permit", label: t("paycat.permit_fee") }, { key: "application", label: t("paycat.application_fee") }, { key: "oc", label: t("paycat.oc_fee") }, { key: "other", label: t("fn.renewalAppeal") }]} />
        </ChartFrame>
        <ChartFrame title={t("fn.channelTitle")} description={t("fn.channelDesc")} table={{ columns: [t("fn.col.channel"), t("fn.amountK")], rows: channels.map((c) => [c.channel, c.amount]) }}>
          <HBarChart data={channels} yKey="channel" format={(v) => `${v}k`} series={[{ key: "amount", label: t("fn.collected"), color: SERIES[2] }]} />
        </ChartFrame>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel title={t("fn.txns")} bodyClassName="p-0">
          <DataTable data={scoped} columns={columns} caption={t("fn.txnCaption")} initialSort={[{ id: "date", desc: true }]} pageSize={12} dense className="p-3" />
        </Panel>
        <div className="space-y-6">
          <Panel title={t("fn.reports")} description={t("fn.reportsDesc")}>
            <div className="space-y-3">
              <Select value={report} onChange={(e) => setReport(e.target.value)} aria-label={t("fn.reportType")}>
                <option value="collection">{t("fn.r.collection")}</option>
                <option value="category">{t("fn.r.category")}</option>
                <option value="zone">{t("fn.r.zone")}</option>
                <option value="exceptions">{t("fn.r.exceptions")}</option>
              </Select>
              <Button className="w-full" variant="secondary" onClick={exportReport}>
                <Download /> {t("fn.exportCsv")}
              </Button>
              <Button className="w-full" variant="ghost" onClick={() => window.print()}>
                <FileBarChart2 /> {t("fn.printPdf")}
              </Button>
            </div>
          </Panel>
          <Panel title={t("fn.recon")} description={t("fn.reconDesc")} bodyClassName="p-0">
            {unreconciled.length === 0 ? (
              <p className="flex items-center gap-2 px-5 py-5 text-sm text-success-700">
                <CheckCircle2 className="size-4" aria-hidden /> {t("fn.allMatched")}
              </p>
            ) : (
              <ul className="scrollbar-thin max-h-80 divide-y divide-line overflow-y-auto">
                {unreconciled.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="ref truncate text-ink-strong">{p.gatewayRef}</p>
                      <p className="text-xs text-muted">
                        {p.applicationRef} · {formatBDT(p.amount, locale)}
                      </p>
                    </div>
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => {
                        reconcile(p.id);
                        toast.success(t("fn.matched"));
                      }}
                    >
                      <RefreshCw /> {t("fn.match")}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <p className="flex items-center gap-1.5 border-t border-line px-5 py-2.5 text-[0.6875rem] text-muted">
              <XCircle className="size-3.5" aria-hidden /> {t("fn.liveNote")}
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

