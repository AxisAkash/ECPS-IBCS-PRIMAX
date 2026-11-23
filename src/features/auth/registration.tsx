"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CircleCheckBig } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { z } from "zod";
import { FileDrop, FileRow } from "@/components/domain/file-drop";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { cn, sleep } from "@/lib/utils";

type Kind = "applicant" | "professional";

export function RegistrationWizard({ kind }: { kind: Kind }) {
  const { t } = useI18n();

  const schema = useMemo(
    () =>
      z.object({
        fullName: z.string().trim().min(3, t("err.required")),
        fullNameBn: z.string().optional(),
        nid: z.string().regex(/^(\d{10}|\d{17})$/, t("err.nid")),
        dob: kind === "applicant" ? z.string().min(1, t("err.required")) : z.string().optional(),
        mobile: z.string().regex(/^01\d{9}$/, t("err.mobile")),
        email: z.email(t("err.email")),
        address: kind === "applicant" ? z.string().trim().min(5, t("err.required")) : z.string().optional(),
        body: kind === "professional" ? z.string().min(1, t("err.required")) : z.string().optional(),
        membership: kind === "professional" ? z.string().trim().min(3, t("err.required")) : z.string().optional(),
        discipline: kind === "professional" ? z.string().min(1, t("err.required")) : z.string().optional(),
        docA: z.string().min(1, t("err.required")),
        docB: z.string().min(1, t("err.required")),
        terms: z.literal(true, { error: t("err.terms") }),
      }),
    [t, kind],
  );
  type Values = z.infer<typeof schema>;

  const steps: Array<{ key: MessageKey; fields: FieldPath<Values>[] }> =
    kind === "applicant"
      ? [
          { key: "reg2.s.identity", fields: ["fullName", "fullNameBn", "nid", "dob"] },
          { key: "reg2.s.contact", fields: ["mobile", "email", "address"] },
          { key: "reg2.s.documents", fields: ["docA", "docB"] },
          { key: "reg2.s.review", fields: ["terms"] },
        ]
      : [
          { key: "reg2.s.identity", fields: ["fullName", "nid", "mobile", "email"] },
          { key: "reg2.s.membership", fields: ["body", "membership", "discipline"] },
          { key: "reg2.s.documents", fields: ["docA", "docB"] },
          { key: "reg2.s.review", fields: ["terms"] },
        ];

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { fullName: "", fullNameBn: "", nid: "", dob: "", mobile: "", email: "", address: "", body: "", membership: "", discipline: "", docA: "", docB: "", terms: undefined as unknown as true },
  });
  const { register, formState, trigger, setValue, handleSubmit, control } = form;
  const errors = formState.errors;
  const v = useWatch({ control }) as Values;

  const next = async () => {
    const ok = await trigger(steps[step]!.fields);
    if (ok) setStep((s) => Math.min(steps.length - 1, s + 1));
  };

  const onSubmit = async () => {
    await sleep(1000);
    setDone(true);
  };

  if (done)
    return (
      <div className="animate-fade-up">
        <span className="grid size-12 place-items-center rounded-xl bg-success-100 text-success-700">
          <CircleCheckBig className="size-6" aria-hidden />
        </span>
        <h1 className="mt-6 font-display text-[1.75rem] font-semibold tracking-[-0.02em] text-ink-strong">{t("reg2.done.title")}</h1>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted" role="status">
          {t("reg2.done.body")}
        </p>
        <div className="mt-6 rounded-lg border border-line bg-surface-2 p-4 text-sm">
          <p className="text-xs text-muted">Next steps in the live system</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-ink">
            {kind === "applicant" ? (
              <>
                <li>NID details verified with the Election Commission service (TOR 3.2b).</li>
                <li>Mobile number confirmed by OTP.</li>
                <li>First sign-in requires a password change (TOR 1.9).</li>
              </>
            ) : (
              <>
                <li>Membership verified with {v.body || "the professional body"} (TOR 1.8).</li>
                <li>Account activated once verification succeeds.</li>
                <li>Invitations from owners appear in your workspace.</li>
              </>
            )}
          </ol>
        </div>
        <Button asChild size="lg" className="mt-8">
          <Link href="/demo">{t("reg2.done.cta")}</Link>
        </Button>
      </div>
    );

  return (
    <div>
      <Link href="/register" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink-strong">
        <ArrowLeft className="size-4" aria-hidden /> {t("reg2.back")}
      </Link>
      <p className="kicker">{t(kind === "applicant" ? "reg2.owner.title" : "reg2.pro.title")}</p>
      <h1 className="mt-3 font-display text-[1.75rem] font-semibold tracking-[-0.02em] text-ink-strong">{t(steps[step]!.key)}</h1>

      {/* Progress */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{t("reg2.step", { n: step + 1, total: steps.length })}</span>
        </div>
        <ol className="mt-2 flex gap-1.5" aria-label="Registration progress">
          {steps.map((s, i) => (
            <li key={s.key} className="flex-1">
              <span className={cn("block h-1 rounded-full", i < step ? "bg-teal-600" : i === step ? "bg-emphasis" : "bg-surface-3")} />
              <span className={cn("mt-1.5 block truncate text-[0.6875rem]", i === step ? "font-semibold text-ink-strong" : "text-subtle")}>{t(s.key)}</span>
              <span className="sr-only">{i < step ? "complete" : i === step ? "current" : "upcoming"}</span>
            </li>
          ))}
        </ol>
      </div>

      <Callout tone="demo" className="mt-6">
        {t("reg2.demo")}
      </Callout>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-5">
        {kind === "applicant" && step === 0 && (
          <>
            <Field label={t("f.fullname")} required error={errors.fullName?.message}>
              {(a) => <Input {...a} {...register("fullName")} autoComplete="name" />}
            </Field>
            <Field label={t("f.fullnameBn")} optional>
              {(a) => <Input {...a} {...register("fullNameBn")} lang="bn" />}
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t("f.nid")} hint={t("f.nid.hint")} required error={errors.nid?.message}>
                {(a) => <Input {...a} {...register("nid")} inputMode="numeric" className="ref" />}
              </Field>
              <Field label={t("f.dob")} required error={errors.dob?.message}>
                {(a) => <Input {...a} {...register("dob")} type="date" />}
              </Field>
            </div>
          </>
        )}
        {kind === "applicant" && step === 1 && (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t("f.mobile")} hint={t("f.mobile.hint")} required error={errors.mobile?.message}>
                {(a) => <Input {...a} {...register("mobile")} inputMode="tel" autoComplete="tel" className="ref" />}
              </Field>
              <Field label={t("f.email")} required error={errors.email?.message}>
                {(a) => <Input {...a} {...register("email")} type="email" autoComplete="email" />}
              </Field>
            </div>
            <Field label={t("f.address")} required error={errors.address?.message}>
              {(a) => <Textarea {...a} {...register("address")} rows={3} autoComplete="street-address" />}
            </Field>
          </>
        )}
        {kind === "professional" && step === 0 && (
          <>
            <Field label={t("f.fullname")} required error={errors.fullName?.message}>
              {(a) => <Input {...a} {...register("fullName")} autoComplete="name" />}
            </Field>
            <Field label={t("f.nid")} hint={t("f.nid.hint")} required error={errors.nid?.message}>
              {(a) => <Input {...a} {...register("nid")} inputMode="numeric" className="ref" />}
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t("f.mobile")} hint={t("f.mobile.hint")} required error={errors.mobile?.message}>
                {(a) => <Input {...a} {...register("mobile")} inputMode="tel" className="ref" />}
              </Field>
              <Field label={t("f.email")} required error={errors.email?.message}>
                {(a) => <Input {...a} {...register("email")} type="email" autoComplete="email" />}
              </Field>
            </div>
          </>
        )}
        {kind === "professional" && step === 1 && (
          <>
            <Field label={t("f.body")} required error={errors.body?.message}>
              {(a) => (
                <Select {...a} {...register("body")}>
                  <option value="">Select…</option>
                  <option value="IAB">Institute of Architects Bangladesh (IAB)</option>
                  <option value="IEB">Institution of Engineers, Bangladesh (IEB)</option>
                  <option value="BIP">Bangladesh Institute of Planners (BIP)</option>
                  <option value="IDEB">Institution of Diploma Engineers, Bangladesh (IDEB)</option>
                </Select>
              )}
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t("f.membership")} required error={errors.membership?.message}>
                {(a) => <Input {...a} {...register("membership")} className="ref" placeholder="e.g. A-0000" />}
              </Field>
              <Field label={t("f.discipline")} required error={errors.discipline?.message}>
                {(a) => (
                  <Select {...a} {...register("discipline")}>
                    <option value="">Select…</option>
                    <option>Architect</option>
                    <option>Structural Engineer</option>
                    <option>Electrical Engineer</option>
                    <option>Plumbing Engineer</option>
                    <option>Construction Supervision Engineer</option>
                    <option>Planner</option>
                  </Select>
                )}
              </Field>
            </div>
            <Callout tone="info">Membership is verified against the professional body&apos;s records through an approved integration (TOR 1.8). In this prototype no lookup is made.</Callout>
          </>
        )}
        {step === 2 && (
          <div className="space-y-4">
            {(["docA", "docB"] as const).map((k) => {
              const label = k === "docA" ? (kind === "applicant" ? t("f.upload.nid") : t("f.upload.cert")) : t("f.upload.photo");
              return v[k] ? (
                <div key={k}>
                  <p className="mb-1.5 text-[0.8125rem] font-medium text-ink-strong">{label}</p>
                  <FileRow name={v[k]} sizeKb={240} kind={k === "docB" ? "photo" : "document"} meta="sample · not stored" onRemove={() => setValue(k, "", { shouldValidate: true })} />
                </div>
              ) : (
                <FileDrop
                  key={k}
                  label={label}
                  sampleName={k === "docA" ? (kind === "applicant" ? "nid_copy_sample.pdf" : "membership_certificate_sample.pdf") : "photograph_sample.jpg"}
                  onUploaded={(f) => setValue(k, f.name, { shouldValidate: true })}
                  invalid={!!errors[k]}
                />
              );
            })}
            {(errors.docA || errors.docB) && (
              <p role="alert" className="text-xs font-medium text-danger-700">
                Both documents are required to continue.
              </p>
            )}
          </div>
        )}
        {step === 3 && (
          <div className="space-y-5">
            <dl className="divide-y divide-line rounded-lg border border-line">
              {[
                [t("f.fullname"), v.fullName],
                [t("f.nid"), v.nid ? `•••• ${v.nid.slice(-4)}` : ""],
                [t("f.mobile"), v.mobile],
                [t("f.email"), v.email],
                ...(kind === "professional" ? [[t("f.body"), v.body], [t("f.membership"), v.membership], [t("f.discipline"), v.discipline]] : [[t("f.address"), v.address]]),
                [t("reg2.s.documents"), [v.docA, v.docB].filter(Boolean).join(", ")],
              ].map(([k, val]) => (
                <div key={k} className="grid grid-cols-[9rem_1fr] gap-3 px-4 py-2.5 text-sm">
                  <dt className="text-muted">{k}</dt>
                  <dd className="break-words text-ink-strong">{val || "—"}</dd>
                </div>
              ))}
            </dl>
            <div>
              <label className="flex items-start gap-3 text-sm text-ink">
                <Checkbox className="mt-0.5" checked={v.terms === true} onCheckedChange={(c) => setValue("terms", (c === true) as true, { shouldValidate: true })} aria-invalid={!!errors.terms} />
                {t("f.terms")}
              </label>
              {errors.terms && (
                <p role="alert" className="mt-2 text-xs font-medium text-danger-700">
                  {errors.terms.message}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
          <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ArrowLeft /> {t("reg2.back")}
          </Button>
          {step < steps.length - 1 ? (
            <Button type="button" onClick={next}>
              {t("reg2.next")} <ArrowRight />
            </Button>
          ) : (
            <Button type="submit" loading={formState.isSubmitting}>
              {t("reg2.submit")}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
