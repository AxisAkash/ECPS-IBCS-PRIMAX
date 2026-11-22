"use client";

import { ArrowRight, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { SERVICE_ICON } from "@/components/domain/status";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/overlay";
import { SERVICES } from "@/lib/domain/catalog";
import type { ServiceType } from "@/lib/domain/types";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { ecps } from "@/lib/services";
import { cn } from "@/lib/utils";

export function NewApplicationDialog({ trigger, preset }: { trigger: ReactNode; preset?: ServiceType }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<ServiceType | null>(null);

  const start = async (type: ServiceType) => {
    setBusy(type);
    const id = await ecps.applications.createDraft(type);
    router.push(`/workspace/applications/${id}/edit`);
  };

  if (preset) {
    return (
      <span onClick={() => start(preset)} className="contents">
        {trigger}
      </span>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        size="lg"
        eyebrow={t("ws.new")}
        title="Which permission do you need?"
        description="Interactive application journeys are available for the services marked below. Other services are shown so you can see where they will sit."
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {SERVICES.map((s) => {
            const Icon = SERVICE_ICON[s.type];
            const enabled = s.wizard;
            return (
              <li key={s.type}>
                <button
                  type="button"
                  disabled={!enabled || busy !== null}
                  onClick={() => start(s.type)}
                  className={cn(
                    "group flex h-full w-full items-start gap-3 rounded-lg border p-3.5 text-left transition-[border-color,box-shadow]",
                    enabled ? "border-line bg-surface hover:border-teal-600/50 hover:shadow-sm" : "cursor-not-allowed border-dashed border-line bg-surface-2",
                  )}
                  aria-describedby={!enabled ? `${s.type}-na` : undefined}
                >
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-md", enabled ? "bg-teal-50 text-teal-700" : "bg-surface-3 text-subtle")}>
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm font-semibold", enabled ? "text-ink-strong" : "text-muted")}>{t(s.nameKey as MessageKey)}</span>
                    {enabled ? (
                      <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{t(s.descKey as MessageKey)}</span>
                    ) : (
                      <span id={`${s.type}-na`} className="mt-0.5 flex items-center gap-1 text-xs text-subtle">
                        <Lock className="size-3" aria-hidden /> Not interactive in this prototype
                      </span>
                    )}
                  </span>
                  {enabled && (busy === s.type ? <span className="text-xs text-muted">Creating…</span> : <ArrowRight className="mt-1 size-4 text-subtle group-hover:text-teal-700" aria-hidden />)}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs text-muted">Appeals and Occupancy Certificate appeals start from a decided application in your list.</p>
      </DialogContent>
    </Dialog>
  );
}

export function NewApplicationButton({ size = "md" }: { size?: "md" | "lg" }) {
  const { t } = useI18n();
  return (
    <NewApplicationDialog
      trigger={
        <Button size={size}>
          {t("ws.new")}
          <ArrowRight />
        </Button>
      }
    />
  );
}
