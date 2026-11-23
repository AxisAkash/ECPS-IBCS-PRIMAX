"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AlarmClock, ArrowRight, Download, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { HoldingIndicator, StatusBadge } from "@/components/domain/status";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Avatar, PageHeader, Tag } from "@/components/ui/display";
import { EmptyState } from "@/components/ui/feedback";
import { Input, SegmentedControl, Select } from "@/components/ui/form";
import { ZONES } from "@/lib/domain/catalog";
import type { ApplicationStatus } from "@/lib/domain/types";
import { useI18n } from "@/lib/i18n";
import { useLabels } from "@/lib/i18n/labels";
import { cn, downloadText, formatDate, toCsv } from "@/lib/utils";
import { ACTIVE, useRajukData, type EnrichedApplication } from "./hooks";

type Scope = "mine" | "zone" | "all";

export function useInboxColumns(): ColumnDef<EnrichedApplication, unknown>[] {
  const { t, locale } = useI18n();
  const L = useLabels();
  return useMemo(
    () => [
      {
        id: "ref",
        header: t("ib.col.ref"),
        accessorFn: (r) => r.ref,
        cell: ({ row: { original: a } }) => (
          <div className="min-w-[10.5rem]">
            <Link href={`/rajuk/files/${a.id}`} onClick={(e) => e.stopPropagation()} className="ref font-medium text-ink-strong hover:text-teal-700 hover:underline">
              {a.ref}
            </Link>
            <div className="mt-0.5 flex items-center gap-1.5">
              {a.priority === "high" && <span className="rounded-xs bg-danger-100 px-1 text-[0.625rem] font-semibold uppercase text-danger-700">{t("rk.priority")}</span>}
              {a.legacy && <Tag>{t("ib.legacy")}</Tag>}
              <span className="max-w-[12rem] truncate text-xs text-muted">{a.property.area}</span>
            </div>
          </div>
        ),
      },
      {
        id: "applicant",
        header: t("ib.col.applicant"),
        accessorFn: (r) => r.owners[0]?.name ?? "",
        cell: ({ getValue }) => <span className="block max-w-[11rem] truncate text-ink">{getValue() as string}</span>,
      },
      {
        id: "type",
        header: t("ib.col.category"),
        accessorFn: (r) => r.type,
        cell: ({ row: { original: a } }) => (
          <span className="whitespace-nowrap">
            <Tag className="mr-1.5">{a.type.replace("PP_PRIVATE_HOUSING", "PPH").replace("PP_RENEWAL", "PPR").replace("OC_APPEAL", "OCA")}</Tag>
            <span className="hidden text-muted 2xl:inline">{L.service(a.type)}</span>
          </span>
        ),
      },
      {
        id: "holder",
        header: t("ib.col.assigned"),
        accessorFn: (r) => r.holderName ?? "",
        cell: ({ row: { original: a } }) =>
          a.holderName ? (
            <span className="flex items-center gap-2 whitespace-nowrap">
              <Avatar name={a.holderName} size="xs" />
              <span className="max-w-[9rem] truncate">{a.holderName}</span>
            </span>
          ) : (
            <span className="text-xs text-muted">{a.stage === "front_desk" ? t("ib.fdQueue") : a.stage === "fee_and_drawings" ? t("ib.applicantHolds") : "—"}</span>
          ),
      },
      {
        id: "stage",
        header: t("rk.stage"),
        accessorFn: (r) => r.stage,
        cell: ({ row: { original: a } }) => (
          <span className="whitespace-nowrap" title={L.stage(a.stage)}>
            <span className="ref mr-1.5 text-[0.6875rem] text-subtle">{t(`sts.${a.stage}`)}</span>
            {a.stage === "department_review" && a.department ? t("ib.deptStage", { dept: L.dept(a.department) }) : L.stage(a.stage)}
          </span>
        ),
      },
      {
        id: "submitted",
        header: t("ib.col.submitted"),
        accessorFn: (r) => r.submittedAt ?? "",
        cell: ({ getValue }) => <span className="tabular whitespace-nowrap text-muted">{formatDate(getValue() as string, locale)}</span>,
      },
      {
        id: "holding",
        header: t("ib.col.held"),
        accessorFn: (r) => (r.holding.state === "exceeded" ? 1000 : 0) + r.holding.days,
        cell: ({ row: { original: a } }) => <HoldingIndicator app={a} />,
      },
      {
        id: "status",
        header: t("ib.col.status"),
        accessorFn: (r) => r.status,
        cell: ({ row: { original: a } }) => <StatusBadge status={a.status} />,
      },
      {
        id: "next",
        header: t("ib.col.next"),
        enableSorting: false,
        accessorFn: (r) => L.next(r),
        cell: ({ getValue }) => <span className="whitespace-nowrap text-ink">{getValue() as string}</span>,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- labels change only with the locale
    [locale],
  );
}

export function FileInbox() {
  const { t } = useI18n();
  const L = useLabels();
  const router = useRouter();
  const params = useSearchParams();
  const { me, applications } = useRajukData();
  const columns = useInboxColumns();
  const [scope, setScope] = useState<Scope>(me?.role === "officer" ? "zone" : "mine");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const [zone, setZone] = useState(me?.zone ?? "");
  const [overdue, setOverdue] = useState(params.get("filter") === "overdue");
  const [includeClosed, setIncludeClosed] = useState(false);

  const rows = applications
    .filter((a) => includeClosed || ACTIVE(a))
    .filter((a) => (scope === "mine" ? a.holderId === me?.id : scope === "zone" ? a.property.zone === (zone || me?.zone) : !zone || a.property.zone === zone))
    .filter((a) => !status || a.status === status)
    .filter((a) => !overdue || a.holding.state === "exceeded")
    .filter((a) => !q || `${a.ref} ${a.title} ${a.owners.map((o) => o.name).join(" ")} ${a.property.area}`.toLowerCase().includes(q.toLowerCase()));

  const counts = {
    mine: applications.filter((a) => ACTIVE(a) && a.holderId === me?.id).length,
    zone: applications.filter((a) => ACTIVE(a) && a.property.zone === me?.zone).length,
    all: applications.filter(ACTIVE).length,
  };

  const exportCsv = () =>
    downloadText(
      `ecps-file-inbox-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(rows.map((a) => ({ reference: a.ref, applicant: a.owners[0]?.name, category: a.type, zone: a.property.zone, stage: L.stage(a.stage), holder: a.holderName ?? "", submitted: a.submittedAt?.slice(0, 10), held_working_days: a.holding.days, limit: a.holding.limit ?? "", over_limit: a.holding.state === "exceeded" ? "YES" : "", status: a.status }))),
    );

  return (
    <div>
      <PageHeader
        kicker={me?.zone ? t("ib.kickerZone", { zone: L.zone(me.zone) }) : t("ib.kicker")}
        title={me?.role === "inspector" ? t("ib.title.inspector") : me?.role === "estate" ? t("ib.title.estate") : t("ib.title")}
        description={t("ib.desc")}
        actions={
          <Button variant="secondary" onClick={exportCsv}>
            <Download /> {t("ib.export")}
          </Button>
        }
      />
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <SegmentedControl
          label={t("ib.scope")}
          value={scope}
          onChange={setScope}
          options={[
            { value: "mine", label: t("ib.scope.mine"), count: counts.mine },
            { value: "zone", label: me?.zone ? L.zone(me.zone) : t("ib.scope.zone"), count: counts.zone },
            { value: "all", label: t("ib.scope.all"), count: counts.all },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full sm:w-64">
            <Input leading={<Search />} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("ib.search")} aria-label={t("ib.searchLabel")} />
          </div>
          {scope === "all" && (
            <Select value={zone} onChange={(e) => setZone(e.target.value)} aria-label={t("ib.zone")} className="w-32">
              <option value="">{t("ib.scope.all")}</option>
              {ZONES.map((z) => (
                <option key={z} value={z}>
                  {L.zone(z)}
                </option>
              ))}
            </Select>
          )}
          <Select value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus | "")} aria-label={t("ib.status")} className="w-44">
            <option value="">{t("ib.anyStatus")}</option>
            {(["submitted", "in_review", "correction_requested", "committee", "signing", "fee_pending"] as const).map((s) => (
              <option key={s} value={s}>
                {L.status(s)}
              </option>
            ))}
          </Select>
          <Button variant={overdue ? "danger-outline" : "secondary"} aria-pressed={overdue} onClick={() => setOverdue((o) => !o)}>
            <AlarmClock /> {t("ib.overLimit")}
          </Button>
          <label className="flex items-center gap-2 px-1 text-xs text-muted">
            <input type="checkbox" checked={includeClosed} onChange={(e) => setIncludeClosed(e.target.checked)} className="accent-teal-600" />
            {t("ib.includeDecided")}
          </label>
        </div>
      </div>
      <DataTable
        data={rows}
        columns={columns}
        caption={t("ib.caption")}
        initialSort={[{ id: "holding", desc: true }]}
        onRowClick={(a) => router.push(`/rajuk/files/${a.id}`)}
        rowClassName={(a) => cn(a.holding.state === "exceeded" && "bg-danger-100/35 shadow-[inset_3px_0_0_var(--color-danger-600)]")}
        maxHeight="calc(100dvh - 18rem)"
        pageSize={25}
        empty={<EmptyState title={t("ib.empty")} body={t("ib.emptyBody")} />}
        mobileCard={(a) => (
          <Link href={`/rajuk/files/${a.id}`} className={cn("block rounded-lg border border-line bg-surface p-4", a.holding.state === "exceeded" && "border-danger-600/40")}>
            <div className="flex items-start justify-between gap-2">
              <span className="ref text-sm font-medium text-ink-strong">{a.ref}</span>
              <StatusBadge status={a.status} />
            </div>
            <p className="mt-1 truncate text-sm text-ink">{a.owners[0]?.name}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-muted">
              <span>{L.stage(a.stage)}</span>
              <HoldingIndicator app={a} compact />
            </div>
            <p className="mt-2 flex items-center gap-1 text-xs font-medium text-teal-700">
              {L.next(a)} <ArrowRight className="size-3" aria-hidden />
            </p>
          </Link>
        )}
      />
    </div>
  );
}
