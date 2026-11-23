"use client";

import { AlarmClock, Building, Building2, ClipboardCheck, FileCheck2, FilePen, Gavel, HardHat, Landmark, RefreshCcw, Search, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/display";
import { Tooltip } from "@/components/ui/overlay";
import type { Application, ApplicationStatus, ServiceType, StageKey } from "@/lib/domain/types";
import { flowFor, holdingInfo, STATUS_TONE } from "@/lib/domain/workflow";
import { useI18n } from "@/lib/i18n";
import { useDemoStore } from "@/lib/store/demo-store";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
  const { t } = useI18n();
  return (
    <Badge tone={STATUS_TONE[status]} className={className}>
      {t(`status.${status}`)}
    </Badge>
  );
}

export const SERVICE_ICON: Record<ServiceType | "REGISTER", LucideIcon> = {
  PP: FilePen,
  PP_PRIVATE_HOUSING: Landmark,
  CP: Building2,
  RDC: RefreshCcw,
  LSP: Building,
  CSN: HardHat,
  OC: FileCheck2,
  PP_RENEWAL: RefreshCcw,
  APPEAL: Gavel,
  OC_APPEAL: Gavel,
  REGISTER: Search,
};

export function HoldingIndicator({ app, compact }: { app: Pick<Application, "stage" | "stageEnteredAt" | "status">; compact?: boolean }) {
  const { t } = useI18n();
  const limits = useDemoStore((s) => s.holdingLimits);
  const h = holdingInfo(app, limits);
  if (["approved", "rejected", "draft"].includes(app.status)) return <span className="text-xs text-subtle">—</span>;
  const label = t(h.days === 1 ? "ui.day" : "ui.days", { n: h.days });
  const content = (
    <span
      className={cn(
        "tabular inline-flex items-center gap-1 whitespace-nowrap rounded-sm px-1.5 py-0.5 text-xs font-medium",
        h.state === "exceeded" && "bg-danger-100 text-danger-700",
        h.state === "approaching" && "bg-amber-50 text-amber-700",
        h.state === "ok" && "text-ink",
      )}
    >
      {h.state === "exceeded" && <AlarmClock className="size-3" aria-hidden />}
      {label}
      {!compact && h.limit && <span className="font-normal text-muted">/ {h.limit}</span>}
      {h.state === "exceeded" && <span className="sr-only">{t("ui.exceeds")}</span>}
    </span>
  );
  return h.limit ? <Tooltip content={t("ui.holdingTip", { stage: t(`stage.${app.stage}`), limit: h.limit })}>{content}</Tooltip> : content;
}

/** Compact horizontal stage tracker for an application. */
export function StageTrack({ type, stage, status, className, showLabels = false }: { type: ServiceType; stage: StageKey; status: ApplicationStatus; className?: string; showLabels?: boolean }) {
  const { t } = useI18n();
  const flow = flowFor(type);
  const effective = stage === "department_review" ? flow[1] : stage;
  const idx = status === "approved" ? flow.length : status === "draft" ? -1 : flow.indexOf(effective as StageKey);
  return (
    <ol className={cn("flex items-center gap-1", className)} aria-label={t("ui.stages")}>
      {flow.map((s, i) => {
        const done = i < idx;
        const current = i === idx;
        return (
          <li key={s} className="flex min-w-0 flex-1 flex-col gap-1.5" aria-current={current ? "step" : undefined}>
            <span
              className={cn(
                "h-1.5 rounded-full",
                done && "bg-teal-600",
                current && (status === "correction_requested" ? "bg-amber-500" : status === "rejected" ? "bg-danger-600" : "bg-emphasis"),
                !done && !current && "bg-surface-3",
              )}
            />
            {showLabels && (
              <span className={cn("truncate font-mono text-[0.625rem] uppercase tracking-wide", current ? "font-semibold text-ink-strong" : done ? "text-teal-800" : "text-muted")} title={t(`stage.${s}`)}>
                {t(`sts.${s}`)}
              </span>
            )}
            <span className="sr-only">
              {t(`stage.${s}`)}: {done ? t("ui.stepDone") : current ? t("ui.stepCurrent") : t("ui.stepUpcoming")}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export const ACTION_ICON = { review: ClipboardCheck };
