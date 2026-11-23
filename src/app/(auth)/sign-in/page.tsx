"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Info } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { DemoRoleGrid } from "@/features/auth/demo-roles";
import { useI18n } from "@/lib/i18n";
import { useDemoUi } from "@/lib/store/demo-ui";
import { sleep } from "@/lib/utils";

function SignInInner() {
  const { t } = useI18n();
  const params = useSearchParams();
  const next = params.get("next") ?? undefined;
  const expired = params.get("reason") === "expired";
  const [show, setShow] = useState(false);
  const [notice, setNotice] = useState(false);
  const demoVisible = useDemoUi((s) => s.visible);
  const showDemo = useDemoUi((s) => s.show);

  const schema = useMemo(
    () =>
      z.object({
        identifier: z.string().trim().min(1, t("auth.err.identifier")),
        password: z.string().min(1, t("auth.err.password")),
        remember: z.boolean(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { identifier: "", password: "", remember: false } });

  const rememberValue = useWatch({ control, name: "remember" });

  const onSubmit = async () => {
    setNotice(false);
    await sleep(900);
    setNotice(true);
  };

  return (
    <div className="animate-fade-up">
      <p className="kicker">{t("brand.full")}</p>
      <h1 className="mt-4 font-display text-[2rem] font-semibold tracking-[-0.02em] text-ink-strong">{t("auth.welcome")}</h1>
      <p className="mt-2 text-[0.9375rem] text-muted">{t("auth.lead")}</p>

      {expired && (
        <Callout tone="warning" className="mt-6" title={t("exp.title")}>
          {t("exp.body")}
        </Callout>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
        <Field label={t("auth.identifier")} hint={t("auth.identifier.hint")} error={errors.identifier?.message} required>
          {(a) => <Input {...a} {...register("identifier")} autoComplete="username" inputMode="email" placeholder="name@example.com" />}
        </Field>
        <Field label={t("auth.password")} error={errors.password?.message} required>
          {(a) => (
            <Input
              {...a}
              {...register("password")}
              type={show ? "text" : "password"}
              autoComplete="current-password"
              trailing={
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setShow((s) => !s)} aria-label={show ? t("auth.hide") : t("auth.show")} aria-pressed={show}>
                  {show ? <EyeOff /> : <Eye />}
                </Button>
              }
            />
          )}
        </Field>
        <div className="flex items-center justify-between gap-4">
          <label className="flex items-center gap-2.5 text-sm text-ink">
            <Checkbox checked={rememberValue} onCheckedChange={(v) => setValue("remember", v === true)} />
            {t("auth.remember")}
          </label>
          <Link href="/forgot-password" className="shrink-0 text-sm font-medium text-teal-700 hover:underline">
            {t("auth.forgot")}
          </Link>
        </div>

        {notice && (
          <Callout tone="demo" icon={Info} title={t("auth.err.demo")}>
            <span className="block">
              <Link href="/sign-in/verify">{t("auth.err.otpLink")}</Link> — {t("auth.err.otpNote")}
            </span>
            {!demoVisible && (
              <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={showDemo}>
                {t("demo.signinHint")}
              </Button>
            )}
          </Callout>
        )}

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          {isSubmitting ? t("auth.signing") : t("auth.submit")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {t("auth.noaccount")}{" "}
        <Link href="/register" className="font-semibold text-teal-700 hover:underline">
          {t("auth.create")}
        </Link>
      </p>

      {demoVisible && (
      <section aria-labelledby="demo-title" className="mt-10 animate-fade-in rounded-xl border border-dashed border-amber-500/50 bg-amber-50/60 p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="demo-title" className="font-display text-base font-semibold text-ink-strong">
              {t("auth.demo.title")}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-amber-700">{t("auth.demo.lead")}</p>
          </div>
          <span className="shrink-0 rounded-xs border border-amber-600/40 px-1.5 py-0.5 font-mono text-[0.625rem] uppercase tracking-wider text-amber-700">{t("demo.toggle")}</span>
        </div>
        <DemoRoleGrid columns={1} next={next} />
      </section>
      )}
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInInner />
    </Suspense>
  );
}
