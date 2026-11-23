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
import { STAGE_SHORT } from "@/lib/domain/workflow";
import { useI18n } from "@/lib/i18n";
import { useLabels } from "@/lib/i18n/labels";
import type { StageKey } from "@/lib/domain/types";
import { ecps } from "@/lib/services";
import { useDemoStore } from "@/lib/store/demo-store";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import { ACTIVE, useRajukData } from "./hooks";

export function OfficerDashboard() {
  const { t, locale } = useI18n();
  const L = useLabels();
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
    return { stage: STAGE_SHORT[s], label: L.stage(s), within: files.filter((a) => a.holding.state !== "exceeded").length, over: files.filter((a) => a.holding.state === "exceeded").length };
  });

  const take = async (id: string) => {
    setTaking(id);
    await ecps.files.take(id);
    setTaking(null);
    toast.success(t("od.toast.taken"), t("od.toast.takenBody"));
    router.push(`/rajuk/files/${id}`);
  };

  const strip = [
    { label: t("od.strip.tray"), value: mine.length, icon: Inbox, href: "/rajuk/inbox" },
    { label: t("od.strip.overdue"), value: overdue.length, icon: AlarmClock, href: "/rajuk/inbox?filter=overdue", danger: overdue.length > 0 },
    { label: t("od.strip.sign"), value: toSign.length, icon: FileSignature, href: "/rajuk/signing" },
    { label: t("od.strip.frontDesk"), value: frontDesk.length, icon: Undo2, href: "/rajuk/inbox" },
    { label: t("od.strip.bcc"), value: listed, icon: Gavel, href: "/rajuk/committee" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">
            {t("od.kicker", { zone: L.zone(zone), date: formatDate(new Date().toISOString(), locale, { weekday: "short", day: "numeric", month: "short" }) })}
          </p>
          <h1 className="mt-3 font-display text-[1.75rem] font-semibold tracking-[-0.02em] text-ink-strong">{t("od.title", { role: L.desig(me?.designation) })}</h1>
        </div>
        <form
          className="flex w-full gap-2 sm:w-auto"
          onSubmit={(e) => {
            e.preventDefault();
            const hit = applications.find((a) => a.ref.toLowerCase() === q.trim().toLowerCase());
            if (hit) router.push(`/rajuk/files/${hit.id}`);
            else toast.error(t("od.notFound"), t("od.notFoundBody"));
          }}
        >
          <Input leading={<Search />} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("od.openRef")} className="ref sm:w-72" aria-label={t("od.openRef")} />
          <Button type="submit" variant="navy">
            {t("rk.open")}
          </Button>
        </form>
      </div>

      {/* Summary strip */}
      <nav aria-label={t("od.summary")} className="grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-surface sm:grid-cols-3 xl:grid-cols-5">
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
          title={t("od.queue")}
          description={t("od.queueDesc")}
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href="/rajuk/inbox">
                {t("od.fullInbox")} <ArrowRight />
              </Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          {mine.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Inbox} title={t("od.clear")} body={t("od.clearBody")} />
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
                        {a.priority === "high" && <span className="rounded-xs bg-danger-100 px-1 text-[0.625rem] font-semibold uppercase text-danger-700">{t("rk.priority")}</span>}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted">
                        {a.owners[0]?.name} · {L.service(a.type)} · {a.property.area}
                      </p>
                    </div>
                    <HoldingIndicator app={a} />
                    <span className="flex items-center justify-between gap-2 text-sm font-medium text-teal-700 md:justify-end">
                      {L.next(a)} <ArrowRight className="size-4" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title={t("od.fd")} description={t("od.fdDesc", { zone: L.zone(zone) })} bodyClassName="p-0">
            {frontDesk.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">{t("od.fdEmpty")}</p>
            ) : (
              <ul className="divide-y divide-line">
                {frontDesk.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/rajuk/files/${a.id}`} className="ref block text-sm font-medium text-ink-strong hover:text-teal-700">
                        {a.ref}
                      </Link>
                      <p className="truncate text-xs text-muted">
                        {a.owners[0]?.name} · {t("od.received", { when: formatRelative(a.submittedAt ?? a.createdAt, undefined, locale) })}
                      </p>
                    </div>
                    <Button size="xs" variant="secondary" loading={taking === a.id} onClick={() => take(a.id)}>
                      {t("od.take")}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          {toSign.length > 0 && (
            <Panel title={t("od.sigReq")} bodyClassName="p-0">
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
                            {p.title} · v{p.version} · {t("rk.pages", { n: p.sheets.filter((s) => s.signable).length })}
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
          title={t("od.chart", { zone: L.zone(zone) })}
          description={t("od.chartDesc")}
          series={[
            { key: "within", label: t("rk.withinLimit"), color: SERIES[0] },
            { key: "over", label: t("rk.overLimit"), color: STATUS.critical },
          ]}
          table={{ columns: [t("rk.stage"), t("rk.withinLimit"), t("rk.overLimit")], rows: byStage.map((r) => [r.label, r.within, r.over]) }}
          height={230}
        >
          <VBarChart data={byStage} xKey="stage" stacked series={[{ key: "within", label: t("rk.withinLimit"), color: SERIES[0] }, { key: "over", label: t("rk.overLimit"), color: STATUS.critical }]} />
        </ChartFrame>
        <Panel title={t("od.recent")}>
          {myActivity.length === 0 ? (
            <p className="text-sm text-muted">{t("od.recentEmpty")}</p>
          ) : (
            <ol className="space-y-3">
              {myActivity.map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="text-ink-strong">
                    <span className="ref text-xs text-muted">{a.action}</span> · {a.target}
                  </p>
                  <p className="text-xs text-muted">
                    {a.detail} · {formatRelative(a.at, undefined, locale)}
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
