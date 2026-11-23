"use client";

import { Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout, SimulatedTag } from "@/components/ui/feedback";
import { useI18n } from "@/lib/i18n";
import { ecps } from "@/lib/services";
import { cn } from "@/lib/utils";

export default function VerifyDevicePage() {
  const { t } = useI18n();
  const router = useRouter();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "");
    if (clean.length > 1) {
      const next = [...digits];
      clean.slice(0, 6 - i).split("").forEach((d, k) => (next[i + k] = d));
      setDigits(next);
      refs.current[Math.min(5, i + clean.length)]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    setError("");
    if (clean && i < 5) refs.current[i + 1]?.focus();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < 6) return setError(t("otp.err"));
    setBusy(true);
    const ok = await ecps.auth.verifyOtp(code);
    setBusy(false);
    if (!ok) {
      setError(t("otp.err"));
      setDigits(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
      return;
    }
    router.push("/sign-in/change-password");
  };

  return (
    <div className="animate-fade-up">
      <span className="grid size-12 place-items-center rounded-xl bg-teal-50 text-teal-700">
        <Smartphone className="size-6" aria-hidden />
      </span>
      <div className="mt-6 flex items-center gap-2">
        <h1 className="font-display text-[1.75rem] font-semibold tracking-[-0.02em] text-ink-strong">{t("otp.title")}</h1>
        <SimulatedTag />
      </div>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{t("otp.lead", { last: "•• 4711" })}</p>

      <form onSubmit={submit} noValidate className="mt-8">
        <fieldset>
          <legend className="mb-3 text-[0.8125rem] font-medium text-ink-strong">{t("otp.code")}</legend>
          <div className="flex gap-2 sm:gap-3">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
                }}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength={6}
                aria-label={`Digit ${i + 1} of 6`}
                aria-invalid={!!error || undefined}
                className={cn(
                  "ref h-14 w-full min-w-0 rounded-lg border bg-surface text-center text-xl font-semibold text-ink-strong shadow-xs focus:border-teal-600 focus:shadow-focus focus:outline-none",
                  error ? "border-danger-600" : "border-line-strong",
                )}
              />
            ))}
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-danger-700">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="mt-6 w-full" loading={busy}>
          {t("otp.verify")}
        </Button>
        <div className="mt-4 text-center text-sm">
          {countdown > 0 ? (
            <span className="tabular text-muted">{t("otp.resendin", { s: countdown })}</span>
          ) : (
            <button type="button" onClick={() => setCountdown(45)} className="font-medium text-teal-700 hover:underline">
              {t("otp.resend")}
            </button>
          )}
        </div>
      </form>

      <Callout tone="demo" className="mt-8">
        {t("otp.demo")} {t("otp.real")}
      </Callout>
      <p className="mt-6 text-center text-sm">
        <Link href="/sign-in" className="text-muted hover:text-ink-strong hover:underline">
          {t("common.back")}
        </Link>
      </p>
    </div>
  );
}
