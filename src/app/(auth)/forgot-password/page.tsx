"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n";
import { sleep } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [id, setId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent)
    return (
      <div className="animate-fade-up text-center sm:text-left">
        <span className="mx-auto grid size-12 place-items-center rounded-xl bg-success-100 text-success-700 sm:mx-0">
          <MailCheck className="size-6" aria-hidden />
        </span>
        <h1 className="mt-6 font-display text-[1.75rem] font-semibold tracking-[-0.02em] text-ink-strong">{t("fp.sent.title")}</h1>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted" role="status">
          {t("fp.sent.body", { id })}
        </p>
        <Callout tone="demo" className="mt-6 text-left">
          Simulation — no message was sent. A generic response is shown whether or not an account exists, to avoid revealing registered users.
        </Callout>
        <Button asChild variant="secondary" className="mt-6">
          <Link href="/sign-in">{t("exp.again")}</Link>
        </Button>
      </div>
    );

  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-[1.75rem] font-semibold tracking-[-0.02em] text-ink-strong">{t("fp.title")}</h1>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{t("fp.lead")}</p>
      <form
        noValidate
        className="mt-8 space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!id.trim()) return setError(t("auth.err.identifier"));
          setBusy(true);
          await sleep(900);
          setBusy(false);
          setSent(true);
        }}
      >
        <Field label={t("auth.identifier")} required error={error}>
          {(a) => <Input {...a} value={id} onChange={(e) => { setId(e.target.value); setError(""); }} autoComplete="username" />}
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          {t("fp.send")}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link href="/sign-in" className="text-muted hover:text-ink-strong hover:underline">
          {t("common.back")}
        </Link>
      </p>
    </div>
  );
}
