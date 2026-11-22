"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SimulatedTag } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/form";
import { Dialog, DialogContent } from "@/components/ui/overlay";
import { ecps } from "@/lib/services";
import { useDemoStore } from "@/lib/store/demo-store";

/**
 * SIMULATED multi-factor confirmation for approval actions (TOR 1.3, 1.4, 1.5, 1.9).
 * Any 6-digit code except 000000 succeeds. Real MFA must be verified server-side.
 */
export function MfaDialog({ open, onOpenChange, onVerified, action }: { open: boolean; onOpenChange: (o: boolean) => void; onVerified: () => void | Promise<void>; action: string }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const markMfa = useDemoStore((s) => s.markMfaVerified);
  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok = await ecps.auth.verifyOtp(code);
    if (!ok) {
      setBusy(false);
      setErr("Code not accepted. Check the authenticator and try again.");
      return;
    }
    markMfa();
    await onVerified();
    setBusy(false);
    setCode("");
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent
        size="sm"
        eyebrow="Multi-factor confirmation"
        title="Confirm it's you"
        description={`${action} requires a second factor. Enter the 6-digit code from your registered authenticator or SMS.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button form="mfa-form" type="submit" loading={busy} disabled={code.length !== 6}>
              Verify and continue
            </Button>
          </>
        }
      >
        <form id="mfa-form" onSubmit={verify} className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-teal-50 px-3 py-2.5 text-sm text-teal-800">
            <ShieldCheck className="size-4 shrink-0" aria-hidden /> Approval actions are protected by MFA.
          </div>
          <Field label="Verification code" error={err}>
            {(a) => (
              <Input
                {...a}
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ""));
                  setErr("");
                }}
                className="ref h-12 text-center text-xl tracking-[0.5em]"
              />
            )}
          </Field>
          <p className="flex items-center gap-2 text-xs text-muted">
            <SimulatedTag /> Demo: any 6 digits work; 000000 shows the failure state.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
