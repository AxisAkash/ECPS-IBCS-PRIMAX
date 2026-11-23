"use client";

import { AlarmClock, ArrowLeftRight, Building2, Download, FileCheck2, FilePlus2, FolderArchive, Printer, Search, ShieldCheck, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ChartFrame, HBarChart, SERIES } from "@/components/charts/charts";
import { FileDrop } from "@/components/domain/file-drop";
import { HoldingIndicator } from "@/components/domain/status";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, PageHeader, Panel, Tag, Timeline } from "@/components/ui/display";
import { Callout, EmptyState } from "@/components/ui/feedback";
import { Field, Input, SegmentedControl, Select, Textarea } from "@/components/ui/form";
import { ConfirmDialog, Dialog, DialogContent, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";
import { toast } from "@/components/ui/toast";
import { usePermits } from "@/features/public/register";
import { can } from "@/lib/domain/roles";
import type { RevertRequest, TwoCFile } from "@/lib/domain/types";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { useLabels } from "@/lib/i18n/labels";
import { useDemoStore, userName } from "@/lib/store/demo-store";
import { cn, downloadText, formatDate, formatDateTime, formatRelative, toCsv, workingDaysBetween } from "@/lib/utils";
import { ACTIVE, useRajukData } from "./hooks";

/* ———————————————————————————— Estate (TOR 2.13) ———————————————————————————— */

export function EstateWorkspace() {
  const { t, locale } = useI18n();
  const { me, applications, users } = useRajukData();
  const nocs = useDemoStore((s) => s.nocs);
  const uploadNoc = useDemoStore((s) => s.uploadNoc);
  const permits = usePermits();
  const routed = applications.filter((a) => a.stage === "department_review" && a.department === "estate");
  const [target, setTarget] = useState<string | null>(null);
  const [memo, setMemo] = useState("");
  const [file, setFile] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [checked, setChecked] = useState<string | null>(null);
  const permit = checked ? permits.find((p) => p.permitNo.toLowerCase() === checked.toLowerCase() && p.type === "PP") : undefined;
  const targetApp = applications.find((a) => a.id === target);

  return (
    <div>
      <PageHeader kicker={t("es.kicker")} title={t("es.title")} description={t("es.desc")} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Panel title={t("es.awaiting", { n: routed.length })} bodyClassName="p-0">
          {routed.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={FileCheck2} title={t("es.none")} body={t("es.noneBody")} />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {routed.map((a) => (
                <li key={a.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/rajuk/files/${a.id}`} className="ref font-medium text-ink-strong hover:text-teal-700">
                        {a.ref}
                      </Link>
                      <Badge tone="info">{a.property.ownershipType === "rajuk_lease" ? t("es.leasePlot") : a.property.ownershipType}</Badge>
                      <HoldingIndicator app={a} />
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted">
                      {a.owners[0]?.name} · {a.property.address}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{t("es.routedBy", { who: userName(users, [...a.history].reverse().find((h) => h.action === "routed")?.actorId) })}</p>
                  </div>
                  <Button size="sm" onClick={() => { setTarget(a.id); setMemo(`EST/NOC/DEMO/${String(Math.floor(Math.random() * 9000) + 1000)}`); setFile(null); }}>
                    <Upload /> {t("es.upload")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title={t("es.verify")} description={t("es.verifyDesc")}>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setChecked(q.trim());
              }}
            >
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="PP-26-Z1-01442" className="ref uppercase" aria-label={t("es.ppNumber")} />
              <Button type="submit" variant="secondary" aria-label={t("es.verifyBtn")}>
                <Search />
              </Button>
            </form>
            {checked && (
              <div className="mt-4" aria-live="polite">
                {permit ? (
                  <div className="rounded-lg border border-success-600/25 bg-success-100/50 p-3 text-sm">
                    <p className="flex items-center gap-1.5 font-semibold text-success-700">
                      <ShieldCheck className="size-4" aria-hidden /> {t("es.valid")}
                    </p>
                    <p className="mt-1 text-ink">
                      {t("es.approvedOn", { owners: permit.owners.join(", "), area: permit.area, date: formatDate(permit.approvedOn, locale) })}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-danger-700">{t("es.notFound")}</p>
                )}
              </div>
            )}
          </Panel>
          <Panel title={t("es.register")} bodyClassName="p-0">
            <ul className="divide-y divide-line">
              {nocs.map((n) => {
                const a = applications.find((x) => x.id === n.applicationId);
                return (
                  <li key={n.id} className="px-5 py-3 text-sm">
                    <p className="ref font-medium text-ink-strong">{n.memoNo}</p>
                    <p className="text-xs text-muted">
                      {a?.ref} · {userName(users, n.issuedBy)} · {formatDate(n.issuedOn, locale)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent
          title={t("es.dlgTitle")}
          eyebrow={targetApp?.ref}
          description={t("es.dlgDesc")}
          footer={
            <>
              <Button variant="secondary" onClick={() => setTarget(null)}>
                {t("es.cancel")}
              </Button>
              <Button
                disabled={!file || !memo.trim()}
                onClick={() => {
                  uploadNoc(target!, memo.trim());
                  setTarget(null);
                  toast.success(t("es.toast"), t("es.toastBody"));
                }}
              >
                {t("es.attach")}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label={t("es.memo")} required>
              {(a) => <Input {...a} value={memo} onChange={(e) => setMemo(e.target.value)} className="ref" />}
            </Field>
            {file ? <p className="rounded-md bg-surface-2 px-3 py-2 text-sm">{t("es.sample", { name: file })}</p> : <FileDrop label={t("es.signedNoc")} accept=".pdf" sampleName="estate_noc_signed_sample.pdf" onUploaded={(f) => setFile(f.name)} />}
            <p className="text-xs text-muted">{t("es.uploadedBy", { who: me?.name ?? "" })}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ———————————————————————————— Record monitoring (TOR 1.1 · 2.10) ———————————————————————————— */

export function RecordMonitoring() {
  const { t, term } = useI18n();
  const L = useLabels();
  const { applications, users } = useRajukData();
  const audit = useDemoStore((s) => s.audit);
  const [level, setLevel] = useState("all");
  const [category, setCategory] = useState<"constructed" | "under" | "floor" | "usage">("under");

  const officers = users.filter((u) => ["officer", "inspector"].includes(u.role) && u.status === "active" && u.department === "development_control");
  const levels = ["Authorized Officer", "Assistant Authorized Officer", "Chief Building Inspector", "Building Inspector", "Front Desk Officer"];
  const rows = officers
    .filter((u) => level === "all" || u.designation === level)
    .map((u) => {
      const held = applications.filter((a) => a.holderId === u.id && ACTIVE(a));
      const disposed = applications.reduce((n, a) => n + a.history.filter((h) => h.actorId === u.id && ["forwarded", "approved", "rejected", "committee_listed", "correction_requested"].includes(h.action)).length, 0) + audit.filter((x) => x.actorId === u.id && x.action.startsWith("file.")).length;
      return {
        user: u,
        held: held.length,
        over: held.filter((a) => a.holding.state === "exceeded").length,
        avg: held.length ? Math.round(held.reduce((s, a) => s + a.holding.days, 0) / held.length) : 0,
        disposed,
      };
    })
    .sort((a, b) => b.over - a.over || b.held - a.held);

  const active = applications.filter(ACTIVE).sort((a, b) => b.holding.days - a.holding.days);
  const cat = {
    constructed: [["mo.c.ocDone", 412], ["mo.c.ocPending", 138], ["mo.c.noOc", 27]],
    under: [["mo.c.foundation", 96], ["mo.c.plinth", 74], ["mo.c.super", 211], ["mo.c.finishing", 88]],
    floor: [["mo.c.f1", 640], ["mo.c.f2", 512], ["mo.c.f3", 141], ["mo.c.f4", 38]],
    usage: [["mo.c.res", 1022], ["mo.c.bus", 176], ["mo.c.mer", 81], ["mo.c.mixed", 52]],
  }[category].map(([k, v]) => ({ label: t(k as MessageKey), count: v as number }));

  const exportCsv = () =>
    downloadText(
      "ecps-officer-register.csv",
      toCsv(rows.map((r) => ({ officer: r.user.name, designation: r.user.designation, zone: r.user.zone ?? "", files_held: r.held, over_limit: r.over, avg_days_held: r.avg, disposed_register: r.disposed }))),
    );

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="TOR 1.1 · 2.10"
        title={t("mo.title")}
        description={t("mo.desc")}
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv}>
              <Download /> {t("mo.csv")}
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer /> {t("mo.print")}
            </Button>
          </>
        }
      />
      <Panel
        title={t("mo.register")}
        description={t("mo.registerDesc")}
        actions={
          <Select value={level} onChange={(e) => setLevel(e.target.value)} aria-label={t("mo.level")} className="h-8 w-56 text-xs">
            <option value="all">{t("mo.allLevels")}</option>
            {levels.map((l) => (
              <option key={l} value={l}>
                {term("desig", l)}
              </option>
            ))}
          </Select>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">{t("mo.register")}</caption>
            <thead className="bg-surface-2 text-[0.6875rem] uppercase tracking-[0.06em] text-muted">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-semibold">{t("mo.officer")}</th>
                <th scope="col" className="px-3 py-2.5 text-right font-semibold">{t("mo.holding")}</th>
                <th scope="col" className="px-3 py-2.5 text-right font-semibold">{t("mo.over")}</th>
                <th scope="col" className="px-3 py-2.5 text-right font-semibold">{t("mo.avg")}</th>
                <th scope="col" className="px-5 py-2.5 text-right font-semibold">{t("mo.disposed")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.user.id} className={cn(r.over > 0 && "bg-danger-100/30")}>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2.5">
                      <Avatar name={r.user.name} size="sm" />
                      <span>
                        <span className="block font-medium text-ink-strong">{r.user.name}</span>
                        <span className="block text-xs text-muted">
                          {term("desig", r.user.designation)} · {term("zone", r.user.zone)}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="tabular px-3 py-3 text-right">{r.held}</td>
                  <td className={cn("tabular px-3 py-3 text-right", r.over ? "font-semibold text-danger-700" : "text-muted")}>
                    {r.over ? (
                      <span className="inline-flex items-center gap-1">
                        <AlarmClock className="size-3.5" aria-hidden /> {r.over}
                      </span>
                    ) : (
                      0
                    )}
                  </td>
                  <td className="tabular px-3 py-3 text-right">{r.avg}</td>
                  <td className="tabular px-5 py-3 text-right font-medium text-ink-strong">{r.disposed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title={t("mo.holdingReport")} description={t("mo.holdingDesc")} bodyClassName="p-0">
          <div className="scrollbar-thin max-h-[26rem] overflow-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{t("mo.holdingReport")}</caption>
              <thead className="sticky top-0 bg-surface-2 text-[0.6875rem] uppercase tracking-[0.06em] text-muted">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-semibold">{t("mo.file")}</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">{t("mo.holder")}</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">{t("mo.atStage")}</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-semibold">{t("mo.total")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {active.map((a) => (
                  <tr key={a.id} className={cn(a.holding.state === "exceeded" && "bg-danger-100/35")}>
                    <td className="px-5 py-2.5">
                      <Link href={`/rajuk/files/${a.id}`} className="ref text-ink-strong hover:text-teal-700">
                        {a.ref}
                      </Link>
                      <span className="block text-xs text-muted">{L.stage(a.stage)}</span>
                    </td>
                    <td className="max-w-[10rem] truncate px-3 py-2.5">{a.holderName ?? <span className="text-muted">{t("mo.queue")}</span>}</td>
                    <td className="px-3 py-2.5">
                      <HoldingIndicator app={a} />
                    </td>
                    <td className="tabular px-5 py-2.5 text-right">{t("mo.days", { n: workingDaysBetween(a.submittedAt ?? a.createdAt) })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <ChartFrame
          title={t("mo.cat")}
          description={t("mo.catDesc")}
          table={{ columns: [t("mo.category"), t("mo.buildings")], rows: cat.map((c) => [c.label, c.count]) }}
          actions={
            <SegmentedControl
              size="sm"
              label={t("mo.reportCat")}
              value={category}
              onChange={setCategory}
              options={[
                { value: "constructed", label: t("mo.constructed") },
                { value: "under", label: t("mo.under") },
                { value: "floor", label: t("mo.floor") },
                { value: "usage", label: t("mo.usage") },
              ]}
            />
          }
          height={260}
        >
          <HBarChart data={cat} yKey="label" series={[{ key: "count", label: t("mo.buildings"), color: SERIES[0] }]} />
        </ChartFrame>
      </div>
    </div>
  );
}

/* ———————————————————————————— File reverts (TOR 2.12) ———————————————————————————— */

export function FileReverts() {
  const { t, locale } = useI18n();
  const L = useLabels();
  const { applications, users, me } = useRajukData();
  const reverts = useDemoStore((s) => s.reverts);
  const requestRevert = useDemoStore((s) => s.requestRevert);
  const decideRevert = useDemoStore((s) => s.decideRevert);
  const role = useDemoStore((s) => s.session?.role);
  const [open, setOpen] = useState(false);
  const [appId, setAppId] = useState("");
  const [from, setFrom] = useState<RevertRequest["fromState"]>("rejected");
  const [reason, setReason] = useState("");
  const [decision, setDecision] = useState<{ id: string; approve: boolean } | null>(null);
  const eligible = applications.filter((a) => ["approved", "rejected"].includes(a.status) || a.legacy);
  const isApprover = role === "admin";

  return (
    <div>
      <PageHeader
        kicker="TOR 2.12"
        title={t("rvt.title")}
        description={t("rvt.desc")}
        actions={
          role === "officer" && (
            <Button onClick={() => { setOpen(true); setAppId(eligible[0]?.id ?? ""); setReason(""); }}>
              <ArrowLeftRight /> {t("rvt.new")}
            </Button>
          )
        }
      />
      <Callout tone="info" className="mb-5">
        {isApprover ? t("rvt.adminNote") : t("rvt.note")}
      </Callout>
      {reverts.length === 0 ? (
        <EmptyState title={t("rvt.none")} />
      ) : (
        <ul className="space-y-3">
          {reverts.map((r) => {
            const a = applications.find((x) => x.id === r.applicationId);
            return (
              <li key={r.id} className="rounded-xl border border-line bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/rajuk/files/${r.applicationId}`} className="ref font-medium text-ink-strong hover:text-teal-700">
                        {a?.ref}
                      </Link>
                      <Tag>{t(`rvt.from.${r.fromState}`)} → {L.stage(r.toStage)}</Tag>
                      <Badge tone={r.status === "approved" ? "success" : r.status === "declined" ? "danger" : "warning"}>{t(`rvt.st.${r.status}`)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-ink">{r.reason}</p>
                    <p className="mt-1 text-xs text-muted">
                      {t("rvt.requested", { who: userName(users, r.requestedBy), when: formatRelative(r.requestedAt, undefined, locale) })}
                      {r.decidedBy && t("rvt.decided", { who: userName(users, r.decidedBy), when: formatRelative(r.decidedAt!, undefined, locale) })}
                    </p>
                  </div>
                  {r.status === "pending" && isApprover && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="danger-outline" onClick={() => setDecision({ id: r.id, approve: false })}>
                        {t("rvt.decline")}
                      </Button>
                      <Button size="sm" onClick={() => setDecision({ id: r.id, approve: true })}>
                        {t("rvt.approve")}
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("rvt.q")}
        description={t("rvt.qDesc")}
        confirmLabel={t("rvt.submit")}
        confirmDisabled={!appId || reason.trim().length < 15}
        onConfirm={() => {
          requestRevert(appId, from, reason.trim());
          setOpen(false);
          toast.success(t("rvt.toast"), t("rvt.toastBody"));
        }}
      >
        <div className="space-y-4">
          <Field label={t("rvt.file")} required>
            {(a) => (
              <Select {...a} value={appId} onChange={(e) => setAppId(e.target.value)}>
                {eligible.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.ref} — {L.status(x.status)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t("rvt.state")} required>
            {(a) => (
              <Select {...a} value={from} onChange={(e) => setFrom(e.target.value as RevertRequest["fromState"])}>
                <option value="on_process">{t("rvt.from.on_process")}</option>
                <option value="archive">{t("rvt.from.archive")}</option>
                <option value="approved">{t("rvt.from.approved")}</option>
                <option value="rejected">{t("rvt.from.rejected")}</option>
              </Select>
            )}
          </Field>
          <Field label={t("rvt.reason")} required hint={t("rvt.reasonHint")}>
            {(a) => <Textarea {...a} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />}
          </Field>
          <p className="text-xs text-muted">{t("rvt.by", { who: me?.name ?? "" })}</p>
        </div>
      </ConfirmDialog>
      <ConfirmDialog
        open={!!decision}
        onOpenChange={(o) => !o && setDecision(null)}
        title={decision?.approve ? t("rvt.qApprove") : t("rvt.qDecline")}
        description={decision?.approve ? t("rvt.dApprove") : t("rvt.dDecline")}
        tone={decision?.approve ? "primary" : "danger"}
        confirmLabel={decision?.approve ? t("rvt.yesApprove") : t("rvt.yesDecline")}
        onConfirm={() => {
          decideRevert(decision!.id, decision!.approve);
          setDecision(null);
          toast.success(decision?.approve ? t("rvt.tApproved") : t("rvt.tDeclined"));
        }}
      />
    </div>
  );
}

/* ———————————————————————————— 2C file management (TOR 2.7) ———————————————————————————— */

export function TwoCFiles() {
  const { t, term, locale } = useI18n();
  const files = useDemoStore((s) => s.twoC);
  const users = useDemoStore((s) => s.users);
  const move = useDemoStore((s) => s.moveTwoC);
  const addDoc = useDemoStore((s) => s.addTwoCDocument);
  const [adding, setAdding] = useState(false);
  const [docName, setDocName] = useState("");
  const [docFile, setDocFile] = useState<string | null>(null);
  const role = useDemoStore((s) => s.session?.role);
  const [sel, setSel] = useState(files[0]?.id);
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [moving, setMoving] = useState(false);
  const [to, setTo] = useState("");
  const [note, setNote] = useState("");
  const list = files.filter((f) => filter === "all" || f.status !== "closed");
  const f = files.find((x) => x.id === sel);
  const officers = users.filter((u) => ["officer", "inspector"].includes(u.role) && u.status === "active");
  const STATUS_TONE: Record<TwoCFile["status"], "info" | "warning" | "accent" | "neutral"> = { open: "info", notice_issued: "warning", hearing: "accent", closed: "neutral" };
  const canManage = can(role, "twoc.manage");

  return (
    <div>
      <PageHeader kicker={t("tc.kicker")} title={t("tc.title")} description={t("tc.desc")} />
      <Callout tone="demo" className="mb-5">
        {t("tc.note")}
      </Callout>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div>
          <SegmentedControl className="mb-3" label={t("tc.filter")} value={filter} onChange={setFilter} options={[{ value: "open", label: t("tc.open") }, { value: "all", label: t("tc.all") }]} />
          <ul className="space-y-2">
            {list.map((x) => (
              <li key={x.id}>
                <button type="button" onClick={() => setSel(x.id)} aria-current={sel === x.id ? "true" : undefined} className={cn("w-full rounded-xl border p-4 text-left transition-colors", sel === x.id ? "border-teal-600 bg-teal-50/50" : "border-line bg-surface hover:border-slate-ink/40")}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="ref text-sm font-medium text-ink-strong">{x.fileNo}</span>
                    <Badge tone={STATUS_TONE[x.status]}>{t(`tc.st.${x.status}`)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink">{x.subject}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {t("tc.custodian", { premises: x.premises, who: userName(users, x.custodianId) })}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {f ? (
          <Panel
            title={f.fileNo}
            description={t("tc.opened", { subject: f.subject, date: formatDate(f.openedOn, locale) })}
            actions={
              canManage &&
              f.status !== "closed" && (
                <Button size="sm" variant="secondary" onClick={() => { setMoving(true); setTo(officers[0]?.id ?? ""); setNote(""); }}>
                  <ArrowLeftRight /> {t("tc.move")}
                </Button>
              )
            }
          >
            <Tabs defaultValue="movements">
              <TabsList>
                <TabsTrigger value="movements">{t("tc.log")}</TabsTrigger>
                <TabsTrigger value="docs">{t("tc.docs", { n: f.documents.length })}</TabsTrigger>
              </TabsList>
              <TabsContent value="movements" className="pt-4">
                {f.movements.length === 0 ? (
                  <p className="text-sm text-muted">{t("tc.noMoves")}</p>
                ) : (
                  <Timeline
                    items={[...f.movements].reverse().map((m, i) => ({
                      id: String(i),
                      title: `${userName(users, m.fromId)} → ${userName(users, m.toId)}`,
                      meta: formatDateTime(m.at, locale),
                      body: m.note,
                      tone: i === 0 ? "current" : "default",
                    }))}
                  />
                )}
              </TabsContent>
              <TabsContent value="docs" className="pt-4">
                <ul className="space-y-2">
                  {f.documents.map((d) => (
                    <li key={d.name} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2 text-sm">
                      <FolderArchive className="size-4 text-subtle" aria-hidden />
                      <span className="flex-1 text-ink-strong">{d.name}</span>
                      <span className="text-xs text-muted">{formatDate(d.addedOn, locale)}</span>
                    </li>
                  ))}
                </ul>
                {canManage && (
                  <Button size="sm" variant="ghost" className="mt-3" onClick={() => { setAdding(true); setDocName(""); setDocFile(null); }}>
                    <FilePlus2 /> {t("tc.addDoc")}
                  </Button>
                )}
              </TabsContent>
            </Tabs>
          </Panel>
        ) : (
          <EmptyState icon={Building2} title={t("tc.select")} />
        )}
      </div>
      <ConfirmDialog
        open={adding}
        onOpenChange={setAdding}
        title={t("tc.qAdd")}
        description={t("tc.qAddDesc")}
        confirmLabel={t("tc.addDoc")}
        confirmDisabled={!docName.trim() || !docFile}
        onConfirm={() => {
          addDoc(f!.id, docName.trim());
          setAdding(false);
          toast.success(t("tc.added"));
        }}
      >
        <div className="space-y-4">
          <Field label={t("tc.docTitle")} required hint={t("tc.docHint")}>
            {(a) => <Input {...a} value={docName} onChange={(e) => setDocName(e.target.value)} />}
          </Field>
          {docFile ? (
            <p className="rounded-md bg-surface-2 px-3 py-2 text-sm">{t("es.sample", { name: docFile })}</p>
          ) : (
            <FileDrop compact label={t("tc.scanned")} accept=".pdf" sampleName="2c_record_sample.pdf" onUploaded={(x) => setDocFile(x.name)} />
          )}
        </div>
      </ConfirmDialog>
      <ConfirmDialog
        open={moving}
        onOpenChange={setMoving}
        title={t("tc.qMove")}
        description={t("tc.qMoveDesc")}
        confirmLabel={t("tc.yesMove")}
        confirmDisabled={!to || !note.trim()}
        onConfirm={() => {
          move(f!.id, to, note.trim());
          setMoving(false);
          toast.success(t("tc.moved"));
        }}
      >
        <div className="space-y-4">
          <Field label={t("tc.newCustodian")} required>
            {(a) => (
              <Select {...a} value={to} onChange={(e) => setTo(e.target.value)}>
                {officers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {term("desig", u.designation)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t("tc.purpose")} required>
            {(a) => <Textarea {...a} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}
          </Field>
        </div>
      </ConfirmDialog>
    </div>
  );
}

