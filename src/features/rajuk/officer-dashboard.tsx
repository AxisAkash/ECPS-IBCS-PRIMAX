"use client";

import { AlarmClock, ArrowRight, FileSignature, Gavel, Inbox, Search, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChartFrame, STATUS, SERIES, VBarChart } from "@/components/charts/charts";
import { HoldingIndicator, StatusBadge } from "@/components/domain/status";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/display";
import { EmptyState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { SERVICE_SHORT_LABEL } from "@/lib/domain/catalog";
import { nextActionFor, STAGE_LABEL, STAGE_SHORT } from "@/lib/domain/workflow";
import type { StageKey } from "@/lib/domain/types";
import { ecps } from "@/lib/services";
import { useDemoStore } from "@/lib/store/demo-store";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import { ACTIVE, useRajukData } from "./hooks";

export function OfficerDashboard() {
  const router = useRouter();
  const { me, applications } = useRajukData();
  const signing = useDemoStore((s) => s.signing);
  const meetings = useDemoStore((s) => s.meetings);
  const audit = useDemoStore((s) => s.audit);
  const [q, setQ] = useState("");
  const [taking, setTaking] = useState<string | null>(null);

  const zone = me?.zone ?? "Zone 4";
  const zoneFiles = applications.filter((a) => a.property.zone === zone && ACTIVE(a));
  const mine = applications.filter((a) => a.holderId === me?.id && ACTIVE(a)).sort((a, b) => (b.holding.state === "exceeded" ? 1 : 0) - (a.holding.state === "exceeded" ? 1 : 0) || b.holding.days - a.holding.days);
  const frontDesk = zoneFiles.filter((a) => a.stage === "front_desk" && !a.holderId);
  const overdue = zoneFiles.filter((a) => a.holding.state === "exceeded");
  const toSign = signing.filter((p) => p.status === "awaiting" && p.requiredSignerIds.includes(me?.id ?? "") && !p.signatures.some((s) => s.signerId === me?.id));
  const listed = meetings.find((m) => m.status !== "concluded")?.items.length ?? 0;
  const myActivity = useMemo(() => audit.filter((a) => a.actorId === me?.id).slice(0, 5), [audit, me]);

  const stageOrder: StageKey[] = ["front_desk", "building_inspector", "chief_building_inspector", "assistant_authorized_officer", "authorized_officer", "department_review", "bc_committee", "signing", "fee_and_drawings"];
  const byStage = stageOrder.map((s) => {
    const files = zoneFiles.filter((a) => a.stage === s);
    return { stage: STAGE_SHORT[s], label: STAGE_LABEL[s], within: files.filter((a) => a.holding.state !== "exceeded").length, over: files.filter((a) => a.holding.state === "exceeded").length };
  });

  const take = async (id: string) => {
    setTaking(id);
    await ecps.files.take(id);
    setTaking(null);
    toast.success("File taken into your tray", "You are now the responsible holder.");
    router.push(`/rajuk/files/${id}`);
  };

  const strip = [
    { label: "In my tray", value: mine.length, icon: Inbox, href: "/rajuk/inbox" },
    { label: "Over holding limit · zone", value: overdue.length, icon: AlarmClock, href: "/rajuk/inbox?filter=overdue", danger: overdue.length > 0 },
    { label: "Awaiting my signature", value: toSign.length, icon: FileSignature, href: "/rajuk/signing" },
    { label: "New at Front Desk", value: frontDesk.length, icon: Undo2, href: "/rajuk/inbox" },
    { label: "Listed for next BCC", value: listed, icon: Gavel, href: "/rajuk/committee" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">
            {zone} · Development Control · {formatDate(new Date().toISOString(), "en", { weekday: "short", day: "numeric", month: "short" })}
          </p>
          <h1 className="mt-3 font-display text-[1.75rem] font-semibold tracking-[-0.02em] text-ink-strong">{me?.designation} workspace</h1>
        </div>
        <form
          className="flex w-full gap-2 sm:w-auto"
          onSubmit={(e) => {
            e.preventDefault();
            const hit = applications.find((a) => a.ref.toLowerCase() === q.trim().toLowerCase());
            if (hit) router.push(`/rajuk/files/${hit.id}`);
            else toast.error("No file with that reference", "Check the reference or search the inbox.");
          }}
        >
          <Input leading={<Search />} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Open file by reference" className="ref sm:w-72" aria-label="Open file by reference" />
          <Button type="submit" variant="navy">
            Open
          </Button>
        </form>
      </div>

      {/* Summary strip */}
      <nav aria-label="Workload summary" className="grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-surface sm:grid-cols-3 xl:grid-cols-5">
        {strip.map((s, i) => (
          <Link key={s.label} href={s.href} className={cn("group flex items-center gap-3 border-line px-5 py-4 transition-colors hover:bg-surface-2", i > 0 && "border-l", s.danger && "bg-danger-100/40")}>
            <s.icon className={cn("size-5 shrink-0", s.danger ? "text-danger-700" : "text-subtle group-hover:text-teal-700")} aria-hidden />
            <span className="min-w-0">
              <span className={cn("tabular block font-display text-2xl font-semibold leading-none", s.danger ? "text-danger-700" : "text-ink-strong")}>{s.value}</span>
              <span className="mt-1 block truncate text-xs text-muted">{s.label}</span>
            </span>
          </Link>
        ))}
      </nav>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Panel
          title="Action queue"
          description="Files you currently hold, most urgent first."
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href="/rajuk/inbox">
                Full inbox <ArrowRight />
              </Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          {mine.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Inbox} title="Your tray is clear" body="Take a file from the Front Desk queue to start." />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {mine.map((a) => (
                <li key={a.id}>
                  <Link href={`/rajuk/files/${a.id}`} className={cn("group grid gap-3 px-5 py-4 transition-colors hover:bg-surface-2 md:grid-cols-[minmax(0,1fr)_8rem_11rem] md:items-center", a.holding.state === "exceeded" && "bg-danger-100/30 shadow-[inset_3px_0_0_var(--color-danger-600)]")}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="ref text-sm font-medium text-ink-strong group-hover:text-teal-700">{a.ref}</span>
                        <StatusBadge status={a.status} />
                        {a.priority === "high" && <span className="rounded-xs bg-danger-100 px-1 text-[0.625rem] font-semibold uppercase text-danger-700">Priority</span>}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted">
                        {a.owners[0]?.name} · {SERVICE_SHORT_LABEL[a.type]} · {a.property.area}
                      </p>
                    </div>
                    <HoldingIndicator app={a} />
                    <span className="flex items-center justify-between gap-2 text-sm font-medium text-teal-700 md:justify-end">
                      {nextActionFor(a)} <ArrowRight className="size-4" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Front Desk queue" description={`Received in ${zone}, not yet assigned`} bodyClassName="p-0">
            {frontDesk.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">No unassigned files.</p>
            ) : (
              <ul className="divide-y divide-line">
                {frontDesk.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/rajuk/files/${a.id}`} className="ref block text-sm font-medium text-ink-strong hover:text-teal-700">
                        {a.ref}
                      </Link>
                      <p className="truncate text-xs text-muted">
                        {a.owners[0]?.name} · received {formatRelative(a.submittedAt ?? a.createdAt)}
                      </p>
                    </div>
                    <Button size="xs" variant="secondary" loading={taking === a.id} onClick={() => take(a.id)}>
                      Take
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          {toSign.length > 0 && (
            <Panel title="Signature requests" bodyClassName="p-0">
              <ul className="divide-y divide-line">
                {toSign.map((p) => {
                  const a = applications.find((x) => x.id === p.applicationId);
                  return (
                    <li key={p.id}>
                      <Link href={`/rajuk/signing/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2">
                        <FileSignature className="size-4 text-teal-700" aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="ref block text-sm font-medium text-ink-strong">{a?.ref}</span>
                          <span className="block truncate text-xs text-muted">
                            {p.title} · v{p.version} · {p.sheets.filter((s) => s.signable).length} pages
                          </span>
                        </span>
                        <ArrowRight className="size-4 text-subtle" aria-hidden />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <ChartFrame
          title={`${zone} files by stage`}
          description="Active files; red segments have exceeded the configured holding limit."
          series={[
            { key: "within", label: "Within limit", color: SERIES[0] },
            { key: "over", label: "Over limit", color: STATUS.critical },
          ]}
          table={{ columns: ["Stage", "Within limit", "Over limit"], rows: byStage.map((r) => [r.label, r.within, r.over]) }}
          height={230}
        >
          <VBarChart data={byStage} xKey="stage" stacked series={[{ key: "within", label: "Within limit", color: SERIES[0] }, { key: "over", label: "Over limit", color: STATUS.critical }]} />
        </ChartFrame>
        <Panel title="Recently processed by you">
          {myActivity.length === 0 ? (
            <p className="text-sm text-muted">Actions you take today appear here.</p>
          ) : (
            <ol className="space-y-3">
              {myActivity.map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="text-ink-strong">
                    <span className="ref text-xs text-muted">{a.action}</span> · {a.target}
                  </p>
                  <p className="text-xs text-muted">
                    {a.detail} · {formatRelative(a.at)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  );
}
