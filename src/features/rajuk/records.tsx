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
import { STAGE_LABEL } from "@/lib/domain/workflow";
import { useDemoStore, userName } from "@/lib/store/demo-store";
import { cn, downloadText, formatDate, formatDateTime, formatRelative, toCsv, workingDaysBetween } from "@/lib/utils";
import { ACTIVE, useRajukData } from "./hooks";

/* ———————————————————————————— Estate (TOR 2.13) ———————————————————————————— */

export function EstateWorkspace() {
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
      <PageHeader kicker="Estate section · TOR 2.13" title="Estate · NOC and PP verification" description="Files routed to Estate for a no-objection certificate on RAJUK lease plots, and verification of issued Planning Permits." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Panel title={`Awaiting Estate NOC (${routed.length})`} bodyClassName="p-0">
          {routed.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={FileCheck2} title="No files waiting" body="Files routed by Town Planning or Development Control appear here." />
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
                      <Badge tone="info">{a.property.ownershipType === "rajuk_lease" ? "RAJUK lease plot" : a.property.ownershipType}</Badge>
                      <HoldingIndicator app={a} />
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted">
                      {a.owners[0]?.name} · {a.property.address}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">Routed by {userName(users, [...a.history].reverse().find((h) => h.action === "routed")?.actorId)}</p>
                  </div>
                  <Button size="sm" onClick={() => { setTarget(a.id); setMemo(`EST/NOC/DEMO/${String(Math.floor(Math.random() * 9000) + 1000)}`); setFile(null); }}>
                    <Upload /> Upload NOC
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Verify a Planning Permit" description="Checks the issued PP record directly (TOR 1.4, 2.13).">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setChecked(q.trim());
              }}
            >
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="PP-26-Z1-01442" className="ref uppercase" aria-label="Planning Permit number" />
              <Button type="submit" variant="secondary" aria-label="Verify">
                <Search />
              </Button>
            </form>
            {checked && (
              <div className="mt-4" aria-live="polite">
                {permit ? (
                  <div className="rounded-lg border border-success-600/25 bg-success-100/50 p-3 text-sm">
                    <p className="flex items-center gap-1.5 font-semibold text-success-700">
                      <ShieldCheck className="size-4" aria-hidden /> Valid Planning Permit
                    </p>
                    <p className="mt-1 text-ink">
                      {permit.owners.join(", ")} · {permit.area} · approved {formatDate(permit.approvedOn)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-danger-700">No Planning Permit found with that number.</p>
                )}
              </div>
            )}
          </Panel>
          <Panel title="NOC register" bodyClassName="p-0">
            <ul className="divide-y divide-line">
              {nocs.map((n) => {
                const a = applications.find((x) => x.id === n.applicationId);
                return (
                  <li key={n.id} className="px-5 py-3 text-sm">
                    <p className="ref font-medium text-ink-strong">{n.memoNo}</p>
                    <p className="text-xs text-muted">
                      {a?.ref} · {userName(users, n.issuedBy)} · {formatDate(n.issuedOn)}
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
          title="Upload Estate NOC"
          eyebrow={targetApp?.ref}
          description="The NOC is attached to the file and the file returns to the processing desk."
          footer={
            <>
              <Button variant="secondary" onClick={() => setTarget(null)}>
                Cancel
              </Button>
              <Button
                disabled={!file || !memo.trim()}
                onClick={() => {
                  uploadNoc(target!, memo.trim());
                  setTarget(null);
                  toast.success("NOC uploaded", "File returned to processing.");
                }}
              >
                Attach and return file
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Memo number" required>
              {(a) => <Input {...a} value={memo} onChange={(e) => setMemo(e.target.value)} className="ref" />}
            </Field>
            {file ? <p className="rounded-md bg-surface-2 px-3 py-2 text-sm">{file} · sample</p> : <FileDrop label="Signed NOC (PDF)" accept=".pdf" sampleName="estate_noc_signed_sample.pdf" onUploaded={(f) => setFile(f.name)} />}
            <p className="text-xs text-muted">Uploaded by {me?.name} · recorded in the audit trail.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ———————————————————————————— Record monitoring (TOR 1.1 · 2.10) ———————————————————————————— */

export function RecordMonitoring() {
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
    constructed: [["Completed with OC", 412], ["Completed, OC pending", 138], ["Occupied without OC (reported)", 27]],
    under: [["Foundation", 96], ["Up to plinth", 74], ["Superstructure", 211], ["Finishing", 88]],
    floor: [["1–5 storeys", 640], ["6–9 storeys", 512], ["10–14 storeys", 141], ["15+ storeys", 38]],
    usage: [["Residential (A)", 1022], ["Business (E)", 176], ["Mercantile (F)", 81], ["Mixed / other", 52]],
  }[category].map(([k, v]) => ({ label: k as string, count: v as number }));

  const exportCsv = () =>
    downloadText(
      "ecps-officer-register.csv",
      toCsv(rows.map((r) => ({ officer: r.user.name, designation: r.user.designation, zone: r.user.zone ?? "", files_held: r.held, over_limit: r.over, avg_days_held: r.avg, disposed_register: r.disposed }))),
    );

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="TOR 1.1 · 2.10"
        title="Record monitoring"
        description="Consolidated report of who holds each file, for how long, and how many files each officer has disposed of — down to Building Inspector level."
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv}>
              <Download /> Excel (CSV)
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer /> PDF / print
            </Button>
          </>
        }
      />
      <Panel
        title="Officer register"
        description="Files held, files over the holding limit and disposal count (demo period)."
        actions={
          <Select value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Hierarchy level" className="h-8 w-56 text-xs">
            <option value="all">All levels</option>
            {levels.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </Select>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Officer register</caption>
            <thead className="bg-surface-2 text-[0.6875rem] uppercase tracking-[0.06em] text-muted">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-semibold">Officer</th>
                <th scope="col" className="px-3 py-2.5 text-right font-semibold">Holding</th>
                <th scope="col" className="px-3 py-2.5 text-right font-semibold">Over limit</th>
                <th scope="col" className="px-3 py-2.5 text-right font-semibold">Avg days held</th>
                <th scope="col" className="px-5 py-2.5 text-right font-semibold">Disposed (register)</th>
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
                          {r.user.designation} · {r.user.zone}
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
        <Panel title="Holding report" description="Current holder, days held at stage and total working days since submission." bodyClassName="p-0">
          <div className="scrollbar-thin max-h-[26rem] overflow-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Holding report</caption>
              <thead className="sticky top-0 bg-surface-2 text-[0.6875rem] uppercase tracking-[0.06em] text-muted">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-semibold">File</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Holder</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">At stage</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {active.map((a) => (
                  <tr key={a.id} className={cn(a.holding.state === "exceeded" && "bg-danger-100/35")}>
                    <td className="px-5 py-2.5">
                      <Link href={`/rajuk/files/${a.id}`} className="ref text-ink-strong hover:text-teal-700">
                        {a.ref}
                      </Link>
                      <span className="block text-xs text-muted">{STAGE_LABEL[a.stage]}</span>
                    </td>
                    <td className="max-w-[10rem] truncate px-3 py-2.5">{a.holderName ?? <span className="text-muted">Queue / applicant</span>}</td>
                    <td className="px-3 py-2.5">
                      <HoldingIndicator app={a} />
                    </td>
                    <td className="tabular px-5 py-2.5 text-right">{workingDaysBetween(a.submittedAt ?? a.createdAt)} d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <ChartFrame
          title="Advanced reporting categories"
          description="Illustrative counts for the TOR 1.1 report categories."
          table={{ columns: ["Category", "Buildings"], rows: cat.map((c) => [c.label, c.count]) }}
          actions={
            <SegmentedControl
              size="sm"
              label="Report category"
              value={category}
              onChange={setCategory}
              options={[
                { value: "constructed", label: "Constructed" },
                { value: "under", label: "Under constr." },
                { value: "floor", label: "Floor-wise" },
                { value: "usage", label: "Usage-wise" },
              ]}
            />
          }
          height={260}
        >
          <HBarChart data={cat} yKey="label" series={[{ key: "count", label: "Buildings", color: SERIES[0] }]} />
        </ChartFrame>
      </div>
    </div>
  );
}

/* ———————————————————————————— File reverts (TOR 2.12) ———————————————————————————— */

export function FileReverts() {
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
        title="File revert requests"
        description="Move an on-process, archived, approved or rejected file back to an earlier desk — only with a recorded reason and a second approval."
        actions={
          role === "officer" && (
            <Button onClick={() => { setOpen(true); setAppId(eligible[0]?.id ?? ""); setReason(""); }}>
              <ArrowLeftRight /> New revert request
            </Button>
          )
        }
      />
      <Callout tone="info" className="mb-5">
        {isApprover ? "As administrator you approve or decline requests raised by officers." : "Requests are approved by an administrator (approval authority to be confirmed by RAJUK)."}
      </Callout>
      {reverts.length === 0 ? (
        <EmptyState title="No revert requests" />
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
                      <Tag>{r.fromState.replace("_", " ")} → {STAGE_LABEL[r.toStage]}</Tag>
                      <Badge tone={r.status === "approved" ? "success" : r.status === "declined" ? "danger" : "warning"}>{r.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-ink">{r.reason}</p>
                    <p className="mt-1 text-xs text-muted">
                      Requested by {userName(users, r.requestedBy)} · {formatRelative(r.requestedAt)}
                      {r.decidedBy && ` · decided by ${userName(users, r.decidedBy)} ${formatRelative(r.decidedAt!)}`}
                    </p>
                  </div>
                  {r.status === "pending" && isApprover && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="danger-outline" onClick={() => setDecision({ id: r.id, approve: false })}>
                        Decline
                      </Button>
                      <Button size="sm" onClick={() => setDecision({ id: r.id, approve: true })}>
                        Approve revert
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
        title="Request a file revert"
        description="The request is recorded and must be approved before the file moves."
        confirmLabel="Submit request"
        confirmDisabled={!appId || reason.trim().length < 15}
        onConfirm={() => {
          requestRevert(appId, from, reason.trim());
          setOpen(false);
          toast.success("Revert requested", "Sent for approval.");
        }}
      >
        <div className="space-y-4">
          <Field label="File" required>
            {(a) => (
              <Select {...a} value={appId} onChange={(e) => setAppId(e.target.value)}>
                {eligible.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.ref} — {x.status}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Current state" required>
            {(a) => (
              <Select {...a} value={from} onChange={(e) => setFrom(e.target.value as RevertRequest["fromState"])}>
                <option value="on_process">On process</option>
                <option value="archive">Archive</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Select>
            )}
          </Field>
          <Field label="Reason" required hint="At least 15 characters.">
            {(a) => <Textarea {...a} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />}
          </Field>
          <p className="text-xs text-muted">Requested by {me?.name}</p>
        </div>
      </ConfirmDialog>
      <ConfirmDialog
        open={!!decision}
        onOpenChange={(o) => !o && setDecision(null)}
        title={decision?.approve ? "Approve this revert?" : "Decline this revert?"}
        description={decision?.approve ? "The file returns to the requesting officer's desk and the change is audited." : "The file stays in its current state."}
        tone={decision?.approve ? "primary" : "danger"}
        confirmLabel={decision?.approve ? "Yes, approve" : "Yes, decline"}
        onConfirm={() => {
          decideRevert(decision!.id, decision!.approve);
          setDecision(null);
          toast.success(decision?.approve ? "Revert approved" : "Revert declined");
        }}
      />
    </div>
  );
}

/* ———————————————————————————— 2C file management (TOR 2.7) ———————————————————————————— */

export function TwoCFiles() {
  const files = useDemoStore((s) => s.twoC);
  const users = useDemoStore((s) => s.users);
  const move = useDemoStore((s) => s.moveTwoC);
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
      <PageHeader kicker="TOR 2.7 · Building Construction Act, 1952" title="2C file management" description="Register, document and track 2C files with a complete movement history." />
      <Callout tone="demo" className="mb-5">
        Field structure is illustrative. Legal requirements for 2C documentation, notices and record-keeping must be confirmed with RAJUK Law and Development Control.
      </Callout>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div>
          <SegmentedControl className="mb-3" label="Filter" value={filter} onChange={setFilter} options={[{ value: "open", label: "Open" }, { value: "all", label: "All" }]} />
          <ul className="space-y-2">
            {list.map((x) => (
              <li key={x.id}>
                <button type="button" onClick={() => setSel(x.id)} aria-current={sel === x.id ? "true" : undefined} className={cn("w-full rounded-xl border p-4 text-left transition-colors", sel === x.id ? "border-teal-600 bg-teal-50/50" : "border-line bg-surface hover:border-slate-ink/40")}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="ref text-sm font-medium text-ink-strong">{x.fileNo}</span>
                    <Badge tone={STATUS_TONE[x.status]}>{x.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink">{x.subject}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {x.premises} · custodian {userName(users, x.custodianId)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {f ? (
          <Panel
            title={f.fileNo}
            description={`${f.subject} · opened ${formatDate(f.openedOn)}`}
            actions={
              canManage &&
              f.status !== "closed" && (
                <Button size="sm" variant="secondary" onClick={() => { setMoving(true); setTo(officers[0]?.id ?? ""); setNote(""); }}>
                  <ArrowLeftRight /> Move file
                </Button>
              )
            }
          >
            <Tabs defaultValue="movements">
              <TabsList>
                <TabsTrigger value="movements">Movement log</TabsTrigger>
                <TabsTrigger value="docs">Documents ({f.documents.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="movements" className="pt-4">
                {f.movements.length === 0 ? (
                  <p className="text-sm text-muted">No movements recorded.</p>
                ) : (
                  <Timeline
                    items={[...f.movements].reverse().map((m, i) => ({
                      id: String(i),
                      title: `${userName(users, m.fromId)} → ${userName(users, m.toId)}`,
                      meta: formatDateTime(m.at),
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
                      <span className="text-xs text-muted">{formatDate(d.addedOn)}</span>
                    </li>
                  ))}
                </ul>
                {canManage && (
                  <Button size="sm" variant="ghost" className="mt-3" onClick={() => toast.info("Document added (sample)", "In production this attaches a scanned record to the 2C file.")}>
                    <FilePlus2 /> Add document
                  </Button>
                )}
              </TabsContent>
            </Tabs>
          </Panel>
        ) : (
          <EmptyState icon={Building2} title="Select a file" />
        )}
      </div>
      <ConfirmDialog
        open={moving}
        onOpenChange={setMoving}
        title="Move this 2C file?"
        description="The new custodian becomes responsible and the movement is logged."
        confirmLabel="Yes, move file"
        confirmDisabled={!to || !note.trim()}
        onConfirm={() => {
          move(f!.id, to, note.trim());
          setMoving(false);
          toast.success("File moved");
        }}
      >
        <div className="space-y-4">
          <Field label="New custodian" required>
            {(a) => (
              <Select {...a} value={to} onChange={(e) => setTo(e.target.value)}>
                {officers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.designation}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Purpose" required>
            {(a) => <Textarea {...a} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}
          </Field>
        </div>
      </ConfirmDialog>
    </div>
  );
}

