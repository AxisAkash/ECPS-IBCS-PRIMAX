"use client";

import { ArrowLeft, ArrowRight, Check, CheckCircle2, Copy, Save } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs, Stepper } from "@/components/ui/display";
import { EmptyState, ProgressBar } from "@/components/ui/feedback";
import { ConfirmDialog } from "@/components/ui/overlay";
import { toast } from "@/components/ui/toast";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { ecps } from "@/lib/services";
import { useDemoStore } from "@/lib/store/demo-store";
import { cn, formatRelative } from "@/lib/utils";
import { useApplication } from "@/features/workspace/hooks";
import { BuildingStep, DocumentsStep, LocationStep, OwnersStep, ProfessionalsStep, PropertyStep, ReviewStep, TypeStep } from "./steps";
import { allIssues, STEP_KEYS, validateStep } from "./validation";

const STEP_LABEL: Record<(typeof STEP_KEYS)[number], MessageKey> = {
  type: "wiz.step.type",
  property: "wiz.step.property",
  owners: "wiz.step.owners",
  professionals: "wiz.step.professionals",
  location: "wiz.step.location",
  building: "wiz.step.building",
  documents: "wiz.step.documents",
  review: "wiz.step.review",
};

export function ApplicationWizard({ id }: { id: string }) {
  const { t } = useI18n();
  const app = useApplication(id);
  const far = useDemoStore((s) => s.far);
  const updateApplication = useDemoStore((s) => s.updateApplication);
  const [step, setStep] = useState(() => Math.min(app?.draftStep ?? 0, STEP_KEYS.length - 1));
  const [attempted, setAttempted] = useState<Record<number, boolean>>({});
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [declared, setDeclared] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const issuesByStep = useMemo(() => (app ? STEP_KEYS.map((s) => validateStep(app, s, far, t)) : []), [app, far, t]);
  const issues = useMemo(() => (app ? allIssues(app, far, t) : []), [app, far, t]);

  if (submitted) return <SubmittedScreen id={id} />;
  if (!app) return <EmptyState title={t("wz.notFound")} body={t("wz.notFoundBody")} action={<Button asChild><Link href="/workspace">{t("ad.back")}</Link></Button>} />;
  if (app.status !== "draft")
    return (
      <EmptyState
        title={t("wz.locked")}
        body={t("wz.lockedBody")}
        action={
          <Button asChild>
            <Link href={`/workspace/applications/${app.id}`}>{t("wz.open")}</Link>
          </Button>
        }
      />
    );

  const key = STEP_KEYS[step]!;
  const stepErrors = Object.fromEntries(
    (attempted[step] ? issuesByStep[step]! : []).filter((i) => i.severity === "error").map((i) => [i.field, i.message]),
  );
  const update = (patch: Parameters<typeof updateApplication>[1]) => {
    updateApplication(app.id, patch);
    setSavedAt(new Date().toISOString());
  };

  const persistStep = async (nextStep: number) => {
    setSaving(true);
    await ecps.applications.saveDraft(app.id, { draftStep: Math.max(app.draftStep ?? 0, nextStep) });
    setSaving(false);
    setSavedAt(new Date().toISOString());
  };

  const goNext = async () => {
    setAttempted((a) => ({ ...a, [step]: true }));
    const blocking = issuesByStep[step]!.filter((i) => i.severity === "error");
    if (blocking.length) {
      toast.error(t("wz.missing"), blocking.length === 1 ? blocking[0]!.message : t("wz.missingN", { n: blocking.length }));
      document.getElementById("wizard-step")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    await persistStep(step + 1);
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveDraft = async () => {
    await persistStep(step);
    toast.success(t("wiz.saved"), t("wz.savedToast"));
  };

  const submit = async () => {
    setSubmitting(true);
    await ecps.applications.submit(app.id);
    setSubmitting(false);
    setConfirm(false);
    setSubmitted(app.id);
  };

  const stepStates = STEP_KEYS.map((s, i) => {
    const errs = issuesByStep[i]!.filter((x) => x.severity === "error").length;
    const reached = i <= (app.draftStep ?? 0) || i <= step;
    return {
      id: s,
      label: t(STEP_LABEL[s]),
      state: (i === step ? "current" : errs && (attempted[i] || i < (app.draftStep ?? 0)) ? "error" : reached && !errs && i < Math.max(step, app.draftStep ?? 0) ? "complete" : reached ? "complete" : "upcoming") as "current" | "complete" | "upcoming" | "error",
      hint: i === step ? undefined : errs && (attempted[i] || i < (app.draftStep ?? 0)) ? t("wz.toComplete", { n: errs }) : undefined,
    };
  });
  const canSubmit = issues.filter((i) => i.severity === "error").length === 0 && declared;
  const titleKey: MessageKey = app.type === "CP" ? "wiz.title.CP" : app.type.startsWith("PP") ? "wiz.title.PP" : "wiz.title.other";

  return (
    <div>
      <Breadcrumbs items={[{ label: t("nav.ws.dashboard"), href: "/workspace" }, { label: t("nav.ws.applications"), href: "/workspace/applications" }, { label: t(titleKey) }]} />
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.015em] text-ink-strong">{t(titleKey)}</h1>
          <p className="mt-1 text-sm text-muted">
            <span className="ref">{app.ref}</span> · {app.title}
          </p>
        </div>
        <p className="flex items-center gap-2 text-xs text-muted" aria-live="polite">
          {saving ? (
            t("wiz.saving")
          ) : savedAt ? (
            <>
              <Check className="size-3.5 text-success-600" aria-hidden /> {t("wiz.saved")} · {formatRelative(savedAt)}
            </>
          ) : (
            <>{t("wz.autosave")}</>
          )}
        </p>
      </div>

      {/* Mobile progress */}
      <div className="mt-5 rounded-lg border border-line bg-surface p-3 lg:hidden">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-ink-strong">
            {step + 1}. {t(STEP_LABEL[key])}
          </span>
          <span className="tabular text-muted">
            {step + 1} / {STEP_KEYS.length}
          </span>
        </div>
        <ProgressBar value={(step + 1) / STEP_KEYS.length} className="mt-2" label={t("wz.progress")} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[15.5rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-line bg-surface p-2">
            <Stepper steps={stepStates} current={step} onSelect={(i) => setStep(i)} />
            <div className="mt-2 border-t border-line px-2.5 pb-1 pt-3">
              <ProgressBar value={(app.draftStep ?? 0) / (STEP_KEYS.length - 1)} label="Draft completion" />
              <p className="mt-1.5 text-[0.6875rem] text-muted">{t("wz.draftPct", { pct: Math.round(((app.draftStep ?? 0) / (STEP_KEYS.length - 1)) * 100) })}</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <section id="wizard-step" aria-label={t(STEP_LABEL[key])} className="scroll-mt-24 rounded-xl border border-line bg-surface p-5 shadow-xs sm:p-7">
            {key !== "review" && Object.keys(stepErrors).length > 0 && (
              <div role="alert" className="mb-6 rounded-lg border border-danger-600/25 bg-danger-100/60 px-4 py-3 text-sm text-danger-700">
                <p className="font-semibold">{t("wz.fix")}</p>
                <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
                  {Object.values(stepErrors).map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
            {key === "type" && <TypeStep app={app} update={update} errors={stepErrors} />}
            {key === "property" && <PropertyStep app={app} update={update} errors={stepErrors} />}
            {key === "owners" && <OwnersStep app={app} update={update} errors={stepErrors} />}
            {key === "professionals" && <ProfessionalsStep app={app} update={update} errors={stepErrors} />}
            {key === "location" && <LocationStep app={app} update={update} errors={stepErrors} />}
            {key === "building" && <BuildingStep app={app} update={update} errors={stepErrors} />}
            {key === "documents" && <DocumentsStep app={app} update={update} errors={stepErrors} />}
            {key === "review" && <ReviewStep app={app} update={update} errors={stepErrors} issues={issues} onEdit={setStep} declared={declared} setDeclared={setDeclared} />}
          </section>

          <div className="sticky bottom-0 z-10 -mx-4 mt-4 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:shadow-md">
            <div className="flex items-center justify-between gap-2">
              <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                <ArrowLeft /> <span className="hidden sm:inline">{t("wiz.back")}</span>
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={saveDraft} loading={saving}>
                  <Save /> <span className="hidden sm:inline">{t("wiz.save")}</span>
                </Button>
                {key === "review" ? (
                  <Button onClick={() => setConfirm(true)} disabled={!canSubmit} aria-describedby={!canSubmit ? "submit-why" : undefined}>
                    {t("wiz.submit")}
                  </Button>
                ) : (
                  <Button onClick={goNext} loading={saving}>
                    {t("wiz.next")} <ArrowRight />
                  </Button>
                )}
              </div>
            </div>
            {key === "review" && !canSubmit && (
              <p id="submit-why" className="mt-2 text-right text-xs text-muted">
                {issues.some((i) => i.severity === "error") ? t("wz.submitWhyIssues") : t("wz.submitWhyDeclare")}
              </p>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        eyebrow={app.ref}
        title={t("wiz.confirm.title")}
        description={t("wiz.confirm.body", { zone: app.property.zone })}
        confirmLabel={t("wiz.confirm.yes")}
        cancelLabel={t("wiz.confirm.no")}
        loading={submitting}
        onConfirm={submit}
      >
        <p className="rounded-md bg-surface-2 px-3 py-2 text-xs text-muted">{t("wz.feeOnSubmit")}</p>
      </ConfirmDialog>
    </div>
  );
}

function SubmittedScreen({ id }: { id: string }) {
  const { t } = useI18n();
  const app = useApplication(id);
  if (!app) return null;
  return (
    <div className="mx-auto max-w-2xl animate-fade-up py-6">
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="on-dark relative bg-navy-900 px-8 py-10 text-on-dark">
          <div className="bg-blueprint absolute inset-0" aria-hidden />
          <div className="relative">
            <span className="grid size-12 place-items-center rounded-full bg-success-600 text-white">
              <CheckCircle2 className="size-6" aria-hidden />
            </span>
            <h1 className="mt-5 font-display text-2xl font-semibold text-white" role="status">
              {t("wiz.success.title")}
            </h1>
            <p className="mt-2 text-on-dark-muted">{t("wiz.success.body")}</p>
            <div className="mt-6 flex items-center gap-3">
              <span className="ref rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-lg font-semibold tracking-wide text-white">{app.ref}</span>
              <Button
                variant="outline-dark"
                size="icon"
                aria-label={t("wz.copy")}
                onClick={() => {
                  void navigator.clipboard?.writeText(app.ref);
                  toast.success(t("wz.copied"));
                }}
              >
                <Copy />
              </Button>
            </div>
          </div>
        </div>
        <div className="space-y-4 px-8 py-6 text-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted">{t("wz.receivedAt")}</p>
              <p className="font-medium text-ink-strong">{t("wz.frontDesk", { zone: app.property.zone })}</p>
            </div>
            <div>
              <p className="text-xs text-muted">{t("wz.appFee")}</p>
              <p className="font-medium text-ink-strong">{t("wz.paidSim")}</p>
            </div>
            <div>
              <p className="text-xs text-muted">{t("wz.nextStep")}</p>
              <p className="font-medium text-ink-strong">{t("wz.scrutiny")}</p>
            </div>
          </div>
          <p className={cn("rounded-md bg-teal-50 px-3 py-2 text-xs text-teal-800")}>{t("wz.demoNote")}</p>
        </div>
        <div className="flex flex-col gap-2 border-t border-line bg-surface-2 px-8 py-4 sm:flex-row sm:justify-end">
          <Button asChild variant="secondary">
            <Link href="/workspace">{t("wiz.success.dashboard")}</Link>
          </Button>
          <Button asChild>
            <Link href={`/workspace/applications/${app.id}`}>{t("wiz.success.track")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
