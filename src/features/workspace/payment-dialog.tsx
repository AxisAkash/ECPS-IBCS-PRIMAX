"use client";

import { Building, CheckCircle2, CreditCard, Lock, Smartphone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout, SimulatedTag, Spinner } from "@/components/ui/feedback";
import { ChoiceCard, RadioGroup } from "@/components/ui/form";
import { Dialog, DialogContent } from "@/components/ui/overlay";
import { toast } from "@/components/ui/toast";
import { useDomainLabels } from "@/features/wizard/steps";
import type { Application } from "@/lib/domain/types";
import { useI18n } from "@/lib/i18n";
import { ecps } from "@/lib/services";
import { formatBDT } from "@/lib/utils";

type Channel = "Card" | "Mobile banking" | "Internet banking";

/** SIMULATED payment gateway hand-off. No payment data is collected. */
export function PaymentDialog({ app, open, onOpenChange }: { app: Application; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t, locale } = useI18n();
  const L = useDomainLabels();
  const [channel, setChannel] = useState<Channel>("Mobile banking");
  const [phase, setPhase] = useState<"choose" | "processing" | "done">("choose");
  const total = app.fee?.total ?? 0;
  const amount = formatBDT(total, locale);

  const pay = async () => {
    setPhase("processing");
    await ecps.applications.payFee(app.id, channel);
    setPhase("done");
    toast.success(t("pay.toast"), t("pay.toastBody"));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (phase === "processing") return;
        onOpenChange(o);
        if (!o) setPhase("choose");
      }}
    >
      <DialogContent
        size="md"
        eyebrow={app.ref}
        title={phase === "done" ? t("pay.received") : t("pay.title")}
        description={phase === "done" ? undefined : t("pay.lead")}
        footer={
          phase === "choose" ? (
            <>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={pay}>
                <Lock /> {t("pay.pay", { amount })}
              </Button>
            </>
          ) : phase === "done" ? (
            <Button
              onClick={() => {
                onOpenChange(false);
                setPhase("choose");
              }}
            >
              {t("pay.done.btn")}
            </Button>
          ) : undefined
        }
      >
        {phase === "choose" && (
          <div className="space-y-5">
            <div className="rounded-lg border border-line">
              {app.fee?.lines.map((l) => (
                <div key={l.key} className="flex justify-between gap-4 border-b border-line px-4 py-2.5 text-sm last:border-0">
                  <span className="text-ink">{L.feeLine(l)}</span>
                  <span className="tabular font-medium text-ink-strong">{formatBDT(l.amount, locale)}</span>
                </div>
              ))}
              <div className="flex justify-between gap-4 bg-surface-2 px-4 py-3">
                <span className="text-sm font-semibold text-ink-strong">{t("pay.total")}</span>
                <span className="tabular font-display text-lg font-semibold text-ink-strong">{amount}</span>
              </div>
            </div>
            <RadioGroup value={channel} onValueChange={(v) => setChannel(v as Channel)} className="grid gap-2" aria-label={t("pay.channel")}>
              <ChoiceCard value="Mobile banking" icon={<Smartphone className="size-4 text-slate-ink" />} title={t("pay.mfs")} />
              <ChoiceCard value="Card" icon={<CreditCard className="size-4 text-slate-ink" />} title={t("pay.card")} />
              <ChoiceCard value="Internet banking" icon={<Building className="size-4 text-slate-ink" />} title={t("pay.bank")} />
            </RadioGroup>
            <Callout tone="demo">
              <span className="flex flex-wrap items-center gap-2">
                <SimulatedTag>{t("common.simulated")}</SimulatedTag> {t("pay.demo")}
              </span>
            </Callout>
          </div>
        )}
        {phase === "processing" && (
          <div className="flex flex-col items-center py-8 text-center" role="status">
            <Spinner className="size-8 text-teal-700" />
            <p className="mt-4 font-medium text-ink-strong">{t("pay.waiting")}</p>
            <p className="mt-1 text-sm text-muted">{t("pay.simulated")}</p>
          </div>
        )}
        {phase === "done" && (
          <div className="flex flex-col items-center py-4 text-center" role="status">
            <CheckCircle2 className="size-12 text-success-700" aria-hidden />
            <p className="mt-3 font-display text-lg font-semibold text-ink-strong">{t("pay.done", { amount })}</p>
            <p className="mt-1 max-w-sm text-sm text-muted">{t("pay.doneBody")}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
