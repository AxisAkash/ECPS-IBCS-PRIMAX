"use client";

import { BadgeCheck, Check, Clock3, MailPlus, ShieldAlert, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SERVICE_ICON, StageTrack, StatusBadge } from "@/components/domain/status";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, Panel } from "@/components/ui/display";
import { Callout, EmptyState } from "@/components/ui/feedback";
import { Field, Textarea } from "@/components/ui/form";
import { ConfirmDialog } from "@/components/ui/overlay";
import { toast } from "@/components/ui/toast";
import type { Application, ProfessionalParticipation } from "@/lib/domain/types";
import { useI18n } from "@/lib/i18n";
import { useLabels } from "@/lib/i18n/labels";
import { notifBody, notifTitle } from "@/lib/i18n/notify";
import { ecps } from "@/lib/services";
import { useDemoStore, userName } from "@/lib/store/demo-store";
import { formatDate, formatRelative } from "@/lib/utils";
import { useInvitations, useMe, useMyApplications, useUsers } from "./hooks";

export function InvitationCard({ app, participation }: { app: Application; participation: ProfessionalParticipation }) {
  const { t, locale } = useI18n();
  const L = useLabels();
  const users = useUsers();
  const me = useMe();
  const [mode, setMode] = useState<"accept" | "decline" | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const Icon = SERVICE_ICON[app.type];

  const respond = async () => {
    if (mode === "decline" && note.trim().length < 5) return setError(t("pw.errReason"));
    setBusy(true);
    await ecps.applications.respondToInvitation(app.id, me!.id, mode === "accept", note.trim() || undefined);
    setBusy(false);
    setMode(null);
    toast.success(mode === "accept" ? t("pw.accepted") : t("pw.declined"), mode === "accept" ? t("pw.acceptedBody") : t("pw.declinedBody"));
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-xs">
      <div className="flex flex-wrap items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700">
          <Icon className="size-[18px]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-ink-strong">{app.title}</p>
            <Badge tone="info">{L.pro(participation.role)}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted">
            {t("pw.from")} <span className="font-medium text-ink">{userName(users, app.applicantId)}</span> · {L.service(app.type)} · {app.property.area || t("pw.noLocation")} · {t("pw.invited", { when: formatRelative(participation.invitedAt, undefined, locale) })}
          </p>
          {participation.note && <p className="mt-2 text-xs text-muted">{t("pw.note", { note: participation.note })}</p>}
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button variant="secondary" size="sm" className="flex-1 sm:flex-none" onClick={() => { setMode("decline"); setNote(""); setError(""); }}>
            <X /> {t("pw.decline")}
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none" onClick={() => { setMode("accept"); setNote(""); setError(""); }}>
            <Check /> {t("pw.accept")}
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={mode !== null}
        onOpenChange={(o) => !o && setMode(null)}
        eyebrow={t("pw.eyebrow")}
        title={mode === "accept" ? t("pw.qAccept") : t("pw.qDecline")}
        description={
          mode === "accept"
            ? t("pw.dAccept", { role: L.pro(participation.role), title: app.title })
            : t("pw.dDecline")
        }
        confirmLabel={mode === "accept" ? t("pw.yesAccept") : t("pw.yesDecline")}
        tone={mode === "decline" ? "danger" : "primary"}
        loading={busy}
        onConfirm={respond}
      >
        <Field label={mode === "decline" ? t("pw.reason") : t("pw.noteOwner")} optional={mode === "accept"} required={mode === "decline"} error={error}>
          {(a) => <Textarea {...a} value={note} onChange={(e) => { setNote(e.target.value); setError(""); }} rows={3} />}
        </Field>
      </ConfirmDialog>
    </div>
  );
}

export function ProfessionalDashboard() {
  const { t, term, locale } = useI18n();
  const L = useLabels();
  const me = useMe();
  const invites = useInvitations();
  const apps = useMyApplications();
  const notifications = useDemoStore((s) => s.notifications);
  const pending = invites.filter((i) => i.participation.status === "invited");
  const myNotes = useMemo(() => notifications.filter((n) => n.userId === me?.id).slice(0, 5), [notifications, me]);
  if (!me) return null;
  const firstName = me.name.replace(/^Ar\.\s*/, "").split(" ")[0];

  const needsMe = apps.filter((a) => a.status === "correction_requested" || a.status === "fee_pending");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">{t("pw.kicker")}</p>
          <h1 className="mt-3 font-display text-[1.75rem] font-semibold tracking-[-0.02em] text-ink-strong md:text-[2rem]">{t("ws.greeting", { name: firstName ?? "" })}</h1>
          <p className="mt-1 text-[0.9375rem] text-muted">
            {t("pw.summary", { inv: pending.length, apps: apps.length })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="inv-title">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="inv-title" className="font-display text-[0.9375rem] font-semibold text-ink-strong">
                {t("pw.awaiting")}
              </h2>
              <Link href="/workspace/invitations" className="text-xs font-medium text-teal-700 hover:underline">
                {t("pw.all")}
              </Link>
            </div>
            {pending.length === 0 ? (
              <EmptyState icon={MailPlus} title={t("pw.none")} body={t("pw.noneBody")} />
            ) : (
              <div className="space-y-3">
                {pending.map((i) => (
                  <InvitationCard key={i.app.id + i.participation.role} app={i.app} participation={i.participation} />
                ))}
              </div>
            )}
          </section>

          {needsMe.length > 0 && (
            <Callout tone="warning" title={t("pw.needs")}>
              {needsMe.map((a) => (
                <span key={a.id} className="block">
                  <Link href={`/workspace/applications/${a.id}`}>{a.title}</Link> — {a.status === "correction_requested" ? t("pw.corr") : t("pw.svc")}
                </span>
              ))}
            </Callout>
          )}

          <Panel title={t("pw.participating")} bodyClassName="p-0">
            {apps.length === 0 ? (
              <div className="p-5">
                <EmptyState title={t("pw.noParticipating")} />
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {apps.map((a) => {
                  const myRole = a.professionals.find((p) => p.userId === me.id && p.status === "accepted")!.role;
                  return (
                    <li key={a.id}>
                      <Link href={`/workspace/applications/${a.id}`} className="group block px-5 py-4 hover:bg-surface-2">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-medium text-ink-strong group-hover:text-teal-700">{a.title}</span>
                          <StatusBadge status={a.status} />
                        </div>
                        <p className="mt-0.5 text-xs text-muted">
                          <span className="ref">{a.ref}</span> · {L.pro(myRole)} · {t("pw.sheets", { n: a.documents.filter((d) => d.category === "drawing" && d.status !== "superseded").length })}
                        </p>
                        {a.status !== "draft" && <StageTrack className="mt-3 max-w-xl" type={a.type} stage={a.stage} status={a.status} />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title={t("pw.profile")}>
            <div className="flex items-center gap-3">
              <Avatar name={me.name} size="lg" />
              <div className="min-w-0">
                <p className="font-semibold text-ink-strong">{me.name}</p>
                <p className="text-xs text-muted">{term("desig", me.designation)}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">{t("pw.body")}</dt>
                <dd className="font-medium text-ink-strong">{me.membership?.body}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">{t("pw.membership")}</dt>
                <dd className="ref text-ink-strong">{me.membership?.number}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">{t("pw.verification")}</dt>
                <dd>
                  {me.membership?.verified ? (
                    <Badge tone="success" icon={BadgeCheck}>
                      {t("pw.verified")}
                    </Badge>
                  ) : (
                    <Badge tone="warning" icon={ShieldAlert}>
                      {t("pw.pending")}
                    </Badge>
                  )}
                </dd>
              </div>
            </dl>
            <p className="mt-4 border-t border-line pt-3 text-[0.6875rem] leading-relaxed text-subtle">{t("pw.verifyNote", { body: me.membership?.body ?? "" })}</p>
          </Panel>

          <Panel title={t("ws.notifications")} bodyClassName="p-0">
            <ul className="divide-y divide-line">
              {myNotes.map((n) => (
                <li key={n.id} className="px-5 py-3">
                  <p className="text-sm font-medium text-ink-strong">{notifTitle(n, locale)}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{notifBody(n, locale)}</p>
                  <p className="mt-1 flex items-center gap-1 text-[0.6875rem] text-subtle">
                    <Clock3 className="size-3" aria-hidden /> {formatDate(n.at, locale)}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
