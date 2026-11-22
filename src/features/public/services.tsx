"use client";

import { ArrowRight, Check, Clock, FileText, Info, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SERVICE_ICON } from "@/components/domain/status";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/display";
import { Callout } from "@/components/ui/feedback";
import { DOCUMENT_CATEGORY_LABEL, PROFESSIONAL_ROLE_LABEL, SERVICES, serviceBySlug, type ServiceDefinition } from "@/lib/domain/catalog";
import { flowFor, STAGE_LABEL } from "@/lib/domain/workflow";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { ecps } from "@/lib/services";
import { useDemoStore } from "@/lib/store/demo-store";
import { cn } from "@/lib/utils";
import { Container, PageIntro } from "./page-intro";

function useStartApplication() {
  const router = useRouter();
  const session = useDemoStore((s) => s.session);
  const [busy, setBusy] = useState(false);
  return {
    busy,
    start: async (s: ServiceDefinition) => {
      if (!s.wizard) return router.push("/sign-in?next=/workspace");
      if (!session || !["applicant", "professional"].includes(session.role)) return router.push(`/sign-in?next=${encodeURIComponent("/workspace")}`);
      setBusy(true);
      const id = await ecps.applications.createDraft(s.type);
      router.push(`/workspace/applications/${id}/edit`);
    },
  };
}

const GROUPS: Array<{ key: ServiceDefinition["group"]; title: MessageKey }> = [
  { key: "permits", title: "svc.group.permits" },
  { key: "after_approval", title: "svc.group.after_approval" },
  { key: "appeals", title: "svc.group.appeals" },
];

export function ServicesIndex() {
  const { t } = useI18n();
  return (
    <>
      <PageIntro breadcrumbs={[{ label: "Home", href: "/" }, { label: t("nav.services") }]} kicker={t("svc.kicker")} title={t("svc.title")} lead={t("svc.lead")} />
      <Container>
        <div className="space-y-14">
          {GROUPS.map((g, gi) => (
            <section key={g.key} aria-labelledby={`g-${g.key}`}>
              <div className="mb-5 flex items-center gap-3">
                <span className="ref grid size-8 place-items-center rounded-full border border-navy-900 text-xs font-semibold text-navy-900">{String(gi + 1).padStart(2, "0")}</span>
                <h2 id={`g-${g.key}`} className="font-display text-xl font-semibold text-ink-strong">
                  {t(g.title)}
                </h2>
              </div>
              <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {SERVICES.filter((s) => s.group === g.key).map((s) => {
                  const Icon = SERVICE_ICON[s.type];
                  return (
                    <li key={s.type}>
                      <Link href={`/services/${s.slug}`} className="group flex h-full flex-col rounded-xl border border-line bg-surface p-6 shadow-xs transition-[border-color,box-shadow] hover:border-teal-600/40 hover:shadow-md">
                        <div className="flex items-start justify-between gap-3">
                          <span className="grid size-11 place-items-center rounded-lg bg-surface-3 text-slate-ink transition-colors group-hover:bg-teal-50 group-hover:text-teal-700">
                            <Icon className="size-5" aria-hidden />
                          </span>
                          <Badge tone={s.scope === "new" ? "warning" : "neutral"}>{t(`svc.scope.${s.scope}`)}</Badge>
                        </div>
                        <h3 className="mt-5 font-display text-lg font-semibold text-ink-strong">{t(s.nameKey as MessageKey)}</h3>
                        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{t(s.descKey as MessageKey)}</p>
                        <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-xs text-muted">
                          <span className="flex items-center gap-1.5">
                            <Users className="size-3.5" aria-hidden /> {t(`svc.who.${s.audience}`)}
                          </span>
                          <span className="inline-flex items-center gap-1 font-medium text-teal-700">
                            {t("svc.open")} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
        <Callout tone="info" className="mt-14" title="About fees and processing times">
          Fees are calculated automatically from occupancy type and total project area under the applicable rules, and shown before you pay. This prototype does not state official fees or statutory processing times.
        </Callout>
      </Container>
    </>
  );
}

export function ServiceDetail({ slug }: { slug: string }) {
  const { t } = useI18n();
  const s = serviceBySlug(slug);
  const { start, busy } = useStartApplication();
  if (!s) return null;
  const Icon = SERVICE_ICON[s.type];
  const flow = flowFor(s.type);
  return (
    <>
      <PageIntro dark breadcrumbs={[{ label: "Home", href: "/" }, { label: t("nav.services"), href: "/services" }, { label: t(s.nameKey as MessageKey) }]} kicker={`${s.short} · ${t(`svc.scope.${s.scope}`)}`} title={t(s.nameKey as MessageKey)} lead={t(s.descKey as MessageKey)}>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="accent" size="lg" onClick={() => start(s)} loading={busy} disabled={!s.wizard}>
            {t("svc.start")} <ArrowRight />
          </Button>
          {!s.wizard && <p className="text-sm text-on-dark-muted">The interactive journey for this service is not part of the prototype.</p>}
        </div>
      </PageIntro>
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-10">
            <section aria-labelledby="need">
              <h2 id="need" className="flex items-center gap-2 font-display text-xl font-semibold text-ink-strong">
                <FileText className="size-5 text-teal-700" aria-hidden /> {t("svc.documents")}
              </h2>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {s.keyDocuments.map((d) => (
                  <li key={d} className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-ink">
                    <Check className="size-4 shrink-0 text-teal-700" aria-hidden /> {DOCUMENT_CATEGORY_LABEL[d]}
                    {["nid", "tax_return", "photo"].includes(d) && <span className="text-xs text-muted">— for every owner</span>}
                  </li>
                ))}
              </ul>
            </section>
            <section aria-labelledby="route">
              <h2 id="route" className="flex items-center gap-2 font-display text-xl font-semibold text-ink-strong">
                <Clock className="size-5 text-teal-700" aria-hidden /> How it is processed
              </h2>
              <ol className="mt-5 space-y-0">
                {flow.map((st, i) => (
                  <li key={st} className="relative flex gap-4 pb-5 last:pb-0">
                    {i < flow.length - 1 && <span aria-hidden className="absolute left-[13px] top-7 h-[calc(100%-1.25rem)] w-px bg-line" />}
                    <span className="ref relative z-10 grid size-7 shrink-0 place-items-center rounded-full border border-line-strong bg-surface text-[0.6875rem] font-semibold text-slate-ink">{i + 1}</span>
                    <span className="pt-0.5 text-[0.9375rem] text-ink-strong">{STAGE_LABEL[st]}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-xs text-muted">Illustrative stage sequence; RAJUK configures the approved workflow, routing and holding limits.</p>
            </section>
          </div>
          <aside className="space-y-5">
            <div className="rounded-xl border border-line bg-surface p-5">
              <span className="grid size-11 place-items-center rounded-lg bg-teal-50 text-teal-700">
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="mt-4 text-sm font-semibold text-ink-strong">{t("svc.professionals")}</h2>
              {s.requiresProfessionals.length ? (
                <ul className="mt-2 space-y-1.5 text-sm text-ink">
                  {s.requiresProfessionals.map((p) => (
                    <li key={p}>{PROFESSIONAL_ROLE_LABEL[p]}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">Owner only</p>
              )}
              <h2 className="mt-5 text-sm font-semibold text-ink-strong">{t("svc.torref")}</h2>
              <p className="ref mt-1 text-sm text-muted">{s.torRefs.join(" · ")}</p>
            </div>
            <Callout tone="info" icon={Info}>
              Fees are calculated automatically and shown with their rule version before payment. Amounts in this prototype are illustrative.
            </Callout>
            <Link href="/guides" className={cn("flex items-center justify-between rounded-xl border border-line bg-surface p-5 text-sm font-medium text-ink-strong hover:border-teal-600/40")}>
              {t("guide.read")} <ArrowRight className="size-4 text-teal-700" aria-hidden />
            </Link>
          </aside>
        </div>
      </Container>
    </>
  );
}
