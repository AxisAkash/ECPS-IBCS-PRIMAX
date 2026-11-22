"use client";

import { Check, Eye, EyeOff, KeyRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout, SimulatedTag } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n";
import { useDemoStore } from "@/lib/store/demo-store";
import { cn, sleep } from "@/lib/utils";

export default function ChangePasswordPage() {
  const { t } = useI18n();
  const router = useRouter();
  const policy = useDemoStore((s) => s.security.password);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const rules = [
    { ok: pw.length >= policy.minLength, label: t("pw.rule.length", { n: policy.minLength }) },
    { ok: /[a-z]/.test(pw) && /[A-Z]/.test(pw), label: t("pw.rule.case") },
    { ok: /\d/.test(pw), label: t("pw.rule.number") },
    ...(policy.requireSymbols ? [{ ok: /[^A-Za-z0-9]/.test(pw), label: t("pw.rule.symbol") }] : []),
  ];
  const strength = rules.filter((r) => r.ok).length / rules.length;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rules.every((r) => r.ok)) return setError(t("pw.err.weak"));
    if (pw !== confirm) return setError(t("pw.err.match"));
    setBusy(true);
    await sleep(800);
    setBusy(false);
    toast.success("Password updated (simulated)", "Choose a demo role to continue exploring.");
    router.push("/demo");
  };

  return (
    <div className="animate-fade-up">
      <span className="grid size-12 place-items-center rounded-xl bg-amber-50 text-amber-700">
        <KeyRound className="size-6" aria-hidden />
      </span>
      <div className="mt-6 flex items-center gap-2">
        <h1 className="font-display text-[1.75rem] font-semibold tracking-[-0.02em] text-ink-strong">{t("pw.title")}</h1>
        <SimulatedTag />
      </div>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{t("pw.lead")}</p>

      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        <Field label={t("pw.new")} required error={error && error === t("pw.err.weak") ? error : undefined}>
          {(a) => (
            <Input
              {...a}
              type={show ? "text" : "password"}
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setError("");
              }}
              autoComplete="new-password"
              trailing={
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setShow((s) => !s)} aria-label={show ? t("auth.hide") : t("auth.show")} aria-pressed={show}>
                  {show ? <EyeOff /> : <Eye />}
                </Button>
              }
            />
          )}
        </Field>
        <div>
          <div className="flex gap-1" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={cn("h-1 flex-1 rounded-full", strength * 4 > i ? (strength === 1 ? "bg-success-600" : strength >= 0.5 ? "bg-amber-500" : "bg-danger-600") : "bg-surface-3")} />
            ))}
          </div>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2" aria-label="Password requirements">
            {rules.map((r) => (
              <li key={r.label} className={cn("flex items-center gap-2 text-xs", r.ok ? "text-success-700" : "text-muted")}>
                {r.ok ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5 text-subtle" aria-hidden />}
                {r.label}
                <span className="sr-only">{r.ok ? "met" : "not met"}</span>
              </li>
            ))}
          </ul>
        </div>
        <Field label={t("pw.confirm")} required error={error && error === t("pw.err.match") ? error : undefined}>
          {(a) => <Input {...a} type={show ? "text" : "password"} value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(""); }} autoComplete="new-password" />}
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          {t("pw.save")}
        </Button>
      </form>
      <Callout tone="demo" className="mt-8">
        Policy values come from Admin → Security (configurable per TOR 1.9). Nothing is stored; enforcement must happen on the server.
      </Callout>
    </div>
  );
}
