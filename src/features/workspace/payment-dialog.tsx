"use client";

import { Building, CheckCircle2, CreditCard, Lock, Smartphone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout, SimulatedTag, Spinner } from "@/components/ui/feedback";
import { ChoiceCard, RadioGroup } from "@/components/ui/form";
import { Dialog, DialogContent } from "@/components/ui/overlay";
import { toast } from "@/components/ui/toast";
import type { Application } from "@/lib/domain/types";
import { useI18n } from "@/lib/i18n";
import { ecps } from "@/lib/services";
import { formatBDT } from "@/lib/utils";

type Channel = "Card" | "Mobile banking" | "Internet banking";

/** SIMULATED payment gateway hand-off. No payment data is collected. */
export function PaymentDialog({ app, open, onOpenChange }: { app: Application; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { locale } = useI18n();
  const [channel, setChannel] = useState<Channel>("Mobile banking");
  const [phase, setPhase] = useState<"choose" | "processing" | "done">("choose");
  const total = app.fee?.total ?? 0;

  const pay = async () => {
    setPhase("processing");
    await ecps.applications.payFee(app.id, channel);
    setPhase("done");
    toast.success("Payment recorded (simulated)", "Your permit has been issued.");
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
        title={phase === "done" ? "Payment received" : "Pay permit fee"}
        description={phase === "done" ? undefined : "You will be handed over to the payment gateway to complete payment."}
        footer={
          phase === "choose" ? (
            <>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={pay}>
                <Lock /> Pay {formatBDT(total, locale)}
              </Button>
            </>
          ) : phase === "done" ? (
            <Button onClick={() => { onOpenChange(false); setPhase("choose"); }}>Done</Button>
          ) : undefined
        }
      >
        {phase === "choose" && (
          <div className="space-y-5">
            <div className="rounded-lg border border-line">
              {app.fee?.lines.map((l) => (
                <div key={l.key} className="flex justify-between gap-4 border-b border-line px-4 py-2.5 text-sm last:border-0">
                  <span className="text-ink">{l.label}</span>
                  <span className="tabular font-medium text-ink-strong">{formatBDT(l.amount, locale)}</span>
                </div>
              ))}
              <div className="flex justify-between gap-4 bg-surface-2 px-4 py-3">
                <span className="text-sm font-semibold text-ink-strong">Total</span>
                <span className="tabular font-display text-lg font-semibold text-ink-strong">{formatBDT(total, locale)}</span>
              </div>
            </div>
            <RadioGroup value={channel} onValueChange={(v) => setChannel(v as Channel)} className="grid gap-2" aria-label="Payment channel">
              <ChoiceCard value="Mobile banking" icon={<Smartphone className="size-4 text-slate-ink" />} title="Mobile financial service" />
              <ChoiceCard value="Card" icon={<CreditCard className="size-4 text-slate-ink" />} title="Debit / credit card" />
              <ChoiceCard value="Internet banking" icon={<Building className="size-4 text-slate-ink" />} title="Internet banking" />
            </RadioGroup>
            <Callout tone="demo">
              <span className="flex flex-wrap items-center gap-2">
                <SimulatedTag /> No gateway is contacted and no payment details are requested. Amounts are illustrative, not RAJUK fees.
              </span>
            </Callout>
          </div>
        )}
        {phase === "processing" && (
          <div className="flex flex-col items-center py-8 text-center" role="status">
            <Spinner className="size-8 text-teal-600" />
            <p className="mt-4 font-medium text-ink-strong">Waiting for gateway confirmation…</p>
            <p className="mt-1 text-sm text-muted">Simulated {channel.toLowerCase()} payment</p>
          </div>
        )}
        {phase === "done" && (
          <div className="flex flex-col items-center py-4 text-center" role="status">
            <CheckCircle2 className="size-12 text-success-600" aria-hidden />
            <p className="mt-3 font-display text-lg font-semibold text-ink-strong">{formatBDT(total, locale)} received</p>
            <p className="mt-1 max-w-sm text-sm text-muted">The permit is now issued and its public summary has been added to the Public Register (demonstration).</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
