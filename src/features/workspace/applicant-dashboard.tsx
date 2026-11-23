"use client";

import { AlertTriangle, ArrowRight, BookOpen, CreditCard, FilePen, LifeBuoy, ReceiptText, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SERVICE_ICON, StageTrack, StatusBadge } from "@/components/domain/status";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/display";
import { EmptyState } from "@/components/ui/feedback";
import { SegmentedControl } from "@/components/ui/form";
import type { Application } from "@/lib/domain/types";
import { holdingInfo } from "@/lib/domain/workflow";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { notifBody, notifTitle } from "@/lib/i18n/notify";
import { useDemoStore, userName } from "@/lib/store/demo-store";
import { cn, formatBDT, formatDate, formatRelative } from "@/lib/utils";
import { useMe, useMyApplications, useUsers } from "./hooks";
import { NewApplicationButton } from "./new-application-dialog";

const WIZARD_STEPS = 8;

interface ActionItem {
  id: string;
  tone: "warning" | "danger" | "info";
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  app: Application;
}

export function ApplicantDashboard() {
  const { t, locale } = useI18n();
  const me = useMe();
  const apps = useMyApplications();
  const users = useUsers();
  const notifications = useDemoStore((s) => s.notifications);
  const payments = useDemoStore((s) => s.payments);
  const limits = useDemoStore((s) => s.holdingLimits);
  const [tab, setTab] = useState<"progress" | "drafts" | "completed">("progress");

  const actions: ActionItem[] = useMemo(() => {
    const list: ActionItem[] = [];
    apps
      .filter((a) => a.status === "correction_requested")
      .forEach((a) =>
        list.push({
          id: `c-${a.id}`,
          tone: "warning",
          icon: AlertTriangle,
          eyebrow: t("status.correction_requested"),
          title: a.title,
          body: a.correctionNote ?? t("dash.corrFallback"),
          href: `/workspace/applications/${a.id}`,
          cta: t("ws.fix"),
          app: a,
        }),
      );
    apps
      .filter((a) => a.status === "fee_pending")
      .forEach((a) =>
        list.push({
          id: `f-${a.id}`,
          tone: "danger",
          icon: CreditCard,
          eyebrow: t("status.fee_pending"),
          title: a.title,
          body: t("dash.feeBody", { amount: formatBDT(a.fee?.total ?? 0, locale) }),
          href: `/workspace/applications/${a.id}?pay=1`,
          cta: t("ws.pay"),
          app: a,
        }),
      );
    apps
      .filter((a) => a.status === "draft")
      .forEach((a) =>
        list.push({
          id: `d-${a.id}`,
          tone: "info",
          icon: FilePen,
          eyebrow: `${t("status.draft")} · ${a.draftStep ?? 0}/${WIZARD_STEPS}`,
          title: a.title,
          body: a.professionals.some((p) => p.status === "invited") ? t("dash.waitArchitect") : t("dash.lastSaved", { when: formatRelative(a.createdAt, undefined, locale) }),
          href: `/workspace/applications/${a.id}/edit`,
          cta: t("ws.continue"),
          app: a,
        }),
      );
    return list;
  }, [apps, t, locale]);

  const groups = {
    progress: apps.filter((a) => !["draft", "approved", "rejected"].includes(a.status)),
    drafts: apps.filter((a) => a.status === "draft"),
    completed: apps.filter((a) => ["approved", "rejected"].includes(a.status)),
  };
  const myNotes = notifications.filter((n) => n.userId === me?.id).slice(0, 4);
  const due = payments.filter((p) => p.status === "pending" && apps.some((a) => a.id === p.applicationId));
  const paid = payments.filter((p) => p.status === "paid" && apps.some((a) => a.id === p.applicationId));
  const activity = useMemo(
    () =>
      apps
        .flatMap((a) => a.history.map((h) => ({ ...h, app: a })))
        .filter((h) => h.actorId !== me?.id)
        .sort((x, y) => y.at.localeCompare(x.at))
        .slice(0, 5),
    [apps, me],
  );

  const firstName = (me?.name ?? "").split(" ")[0];
  const [primary, ...rest] = actions;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">{formatDate(new Date().toISOString(), locale, { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="mt-3 font-display text-[1.75rem] font-semibold tracking-[-0.02em] text-ink-strong md:text-[2rem]">{t("ws.greeting", { name: firstName ?? "" })}</h1>
          <p className="mt-1 text-[0.9375rem] text-muted">{t("ws.lead")}</p>
        </div>
        <NewApplicationButton />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          {/* Priority action */}
          <section aria-labelledby="priority-title">
            <h2 id="priority-title" className="mb-3 font-display text-[0.9375rem] font-semibold text-ink-strong">
              {t("ws.priority")} <span className="tabular ml-1 text-muted">({actions.length})</span>
            </h2>
            {actions.length === 0 ? (
              <EmptyState title={t("ws.priority.none")} />
            ) : (
              <div className="space-y-3">
                {primary && <PrimaryAction item={primary} />}
                {rest.length > 0 && (
                  <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                    {rest.map((a) => (
                      <li key={a.id}>
                        <Link href={a.href} className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-2">
                          <span className={cn("grid size-9 shrink-0 place-items-center rounded-md", a.tone === "danger" ? "bg-danger-100 text-danger-700" : a.tone === "warning" ? "bg-amber-50 text-amber-700" : "bg-teal-50 text-teal-700")}>
                            <a.icon className="size-4" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs text-muted">{a.eyebrow}</span>
                            <span className="block truncate text-sm font-medium text-ink-strong">{a.title}</span>
                          </span>
                          <span className="hidden text-sm font-medium text-teal-700 group-hover:underline sm:inline">{a.cta}</span>
                          <ArrowRight className="size-4 text-subtle" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          {/* Applications */}
          <Panel
            id="apps"
            title={t("ws.applications")}
            actions={
              <SegmentedControl
                size="sm"
                label={t("ws.applications")}
                value={tab}
                onChange={setTab}
                options={[
                  { value: "progress", label: t("ws.inprogress"), count: groups.progress.length },
                  { value: "drafts", label: t("ws.drafts"), count: groups.drafts.length },
                  { value: "completed", label: t("ws.completed"), count: groups.completed.length },
                ]}
              />
            }
            bodyClassName="p-0"
          >
            {groups[tab].length === 0 ? (
              <div className="p-5">
                <EmptyState title={t("dash.empty")} body={t("dash.emptyBody")} />
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {groups[tab].map((a) => {
                  const Icon = SERVICE_ICON[a.type];
                  const h = holdingInfo(a, limits);
                  return (
                    <li key={a.id}>
                      <Link href={a.status === "draft" ? `/workspace/applications/${a.id}/edit` : `/workspace/applications/${a.id}`} className="group block px-5 py-4 transition-colors hover:bg-surface-2">
                        <div className="flex items-start gap-4">
                          <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-slate-ink">
                            <Icon className="size-[18px]" aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="font-medium text-ink-strong group-hover:text-teal-700">{a.title}</span>
                              <StatusBadge status={a.status} />
                            </div>
                            <p className="mt-0.5 text-xs text-muted">
                              <span className="ref">{a.ref}</span> · {t(`svcs.${a.type}`)} · {a.property.area || t("ws2.locPending")}
                            </p>
                            {a.status !== "draft" && (
                              <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem] md:items-end">
                                <StageTrack type={a.type} stage={a.stage} status={a.status} showLabels />
                                <p className="text-xs text-muted md:text-right">
                                  {["approved", "rejected", "appealed"].includes(a.status) ? (
                                    <>{t("apps.decided", { date: formatDate(a.decidedAt, locale) })}</>
                                  ) : (
                                    <>
                                      {t("ws.holder")} <span className="font-medium text-ink">{a.stage === "fee_and_drawings" ? t("dash.youPay") : t(`stage.${a.stage}` as MessageKey)}</span>
                                      <span className={cn("ml-1", h.state === "exceeded" && "font-medium text-danger-700")}>· {h.days}d</span>
                                    </>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Panel
            title={t("ws.notifications")}
            actions={
              <Link href="/workspace/notifications" className="text-xs font-medium text-teal-700 hover:underline">
                {t("common.viewall")}
              </Link>
            }
            bodyClassName="p-0"
          >
            <ul className="divide-y divide-line">
              {myNotes.map((n) => (
                <li key={n.id} className="px-5 py-3">
                  <Link href={n.href ?? "#"} className="group block">
                    <span className="flex items-center gap-2">
                      {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-teal-600" aria-label={t("ws2.unread")} />}
                      <span className="truncate text-sm font-medium text-ink-strong group-hover:text-teal-700">{notifTitle(n, locale)}</span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted">{notifBody(n, locale)}</span>
                    <span className="mt-1 block text-[0.6875rem] text-subtle">{formatRelative(n.at, undefined, locale)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title={t("ws.payments")} actions={<ReceiptText className="size-4 text-subtle" aria-hidden />}>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-muted">{t("dash.dueNow")}</dt>
                <dd className={cn("tabular mt-1 font-display text-xl font-semibold", due.length ? "text-danger-700" : "text-ink-strong")}>{formatBDT(due.reduce((s, p) => s + p.amount, 0), locale)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">{t("dash.paid")}</dt>
                <dd className="tabular mt-1 font-display text-xl font-semibold text-ink-strong">{formatBDT(paid.reduce((s, p) => s + p.amount, 0), locale)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[0.6875rem] text-subtle">{t("dash.amountsNote")}</p>
            <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
              <Link href="/workspace/payments">{t("dash.viewPayments")}</Link>
            </Button>
          </Panel>

          <Panel title={t("ws.activity")} bodyClassName="py-4">
            <ol className="space-y-3.5">
              {activity.map((h) => (
                <li key={h.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-line-strong" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-ink">
                      <span className="font-medium text-ink-strong">{userName(users, h.actorId)}</span> · {t(`act.${h.action}` as MessageKey)}
                      {h.toStage && <> → {t(`stage.${h.toStage}`)}</>}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {h.app.ref} · {formatRelative(h.at, undefined, locale)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </Panel>

          <div className="rounded-xl border border-line bg-navy-900 p-5 text-on-dark">
            <p className="font-display font-semibold text-white">{t("ws.help")}</p>
            <p className="mt-1 text-sm text-on-dark-muted">{t("ws.help.body")}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline-dark">
                <Link href="/guides">
                  <BookOpen /> {t("dash.guide")}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline-dark">
                <Link href="/workspace/support">
                  <LifeBuoy /> {t("dash.support")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrimaryAction({ item }: { item: ActionItem }) {
  const tone = {
    warning: { bar: "bg-amber-500", chip: "bg-amber-50 text-amber-700 ring-amber-500/30", icon: "text-amber-700" },
    danger: { bar: "bg-danger-600", chip: "bg-danger-100 text-danger-700 ring-danger-600/20", icon: "text-danger-700" },
    info: { bar: "bg-teal-600", chip: "bg-teal-50 text-teal-800 ring-teal-600/20", icon: "text-teal-700" },
  }[item.tone];
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", tone.bar)} />
      <div className="flex flex-col gap-5 p-5 pl-6 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", tone.chip)}>
            <item.icon className={cn("size-3.5", tone.icon)} aria-hidden />
            {item.eyebrow}
          </span>
          <p className="mt-2.5 font-display text-lg font-semibold text-ink-strong">{item.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{item.body}</p>
          <p className="ref mt-2 text-xs text-subtle">{item.app.ref}</p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link href={item.href}>
            {item.cta}
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
