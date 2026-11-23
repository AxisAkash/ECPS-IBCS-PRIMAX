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
import { PROFESSIONAL_ROLE_LABEL, SERVICE_SHORT_LABEL } from "@/lib/domain/catalog";
import type { Application, ProfessionalParticipation } from "@/lib/domain/types";
import { useI18n } from "@/lib/i18n";
import { notifBody, notifTitle } from "@/lib/i18n/notify";
import { ecps } from "@/lib/services";
import { useDemoStore, userName } from "@/lib/store/demo-store";
import { formatDate, formatRelative } from "@/lib/utils";
import { useInvitations, useMe, useMyApplications, useUsers } from "./hooks";

export function InvitationCard({ app, participation }: { app: Application; participation: ProfessionalParticipation }) {
  const users = useUsers();
  const me = useMe();
  const [mode, setMode] = useState<"accept" | "decline" | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const Icon = SERVICE_ICON[app.type];

  const respond = async () => {
    if (mode === "decline" && note.trim().length < 5) return setError("Give a short reason so the owner can invite someone else.");
    setBusy(true);
    await ecps.applications.respondToInvitation(app.id, me!.id, mode === "accept", note.trim() || undefined);
    setBusy(false);
    setMode(null);
    toast.success(mode === "accept" ? "Invitation accepted" : "Invitation declined", mode === "accept" ? "The application now appears in your participating list." : "The owner has been notified.");
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
            <Badge tone="info">{PROFESSIONAL_ROLE_LABEL[participation.role]}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted">
            From <span className="font-medium text-ink">{userName(users, app.applicantId)}</span> · {SERVICE_SHORT_LABEL[app.type]} · {app.property.area || "Location not yet entered"} · invited {formatRelative(participation.invitedAt)}
          </p>
          {participation.note && <p className="mt-2 text-xs text-muted">Note: {participation.note}</p>}
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button variant="secondary" size="sm" className="flex-1 sm:flex-none" onClick={() => { setMode("decline"); setNote(""); setError(""); }}>
            <X /> Decline
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none" onClick={() => { setMode("accept"); setNote(""); setError(""); }}>
            <Check /> Accept
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={mode !== null}
        onOpenChange={(o) => !o && setMode(null)}
        eyebrow="Professional invitation"
        title={mode === "accept" ? "Accept this invitation?" : "Decline this invitation?"}
        description={
          mode === "accept"
            ? `You will be recorded as ${PROFESSIONAL_ROLE_LABEL[participation.role]} for "${app.title}" and can upload and endorse drawings.`
            : "The owner will be notified and can invite another professional."
        }
        confirmLabel={mode === "accept" ? "Yes, accept" : "Yes, decline"}
        tone={mode === "decline" ? "danger" : "primary"}
        loading={busy}
        onConfirm={respond}
      >
        <Field label={mode === "decline" ? "Reason" : "Note to owner"} optional={mode === "accept"} required={mode === "decline"} error={error}>
          {(a) => <Textarea {...a} value={note} onChange={(e) => { setNote(e.target.value); setError(""); }} rows={3} />}
        </Field>
      </ConfirmDialog>
    </div>
  );
}

export function ProfessionalDashboard() {
  const { t, locale } = useI18n();
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
          <p className="kicker">Professional workspace</p>
          <h1 className="mt-3 font-display text-[1.75rem] font-semibold tracking-[-0.02em] text-ink-strong md:text-[2rem]">{t("ws.greeting", { name: firstName ?? "" })}</h1>
          <p className="mt-1 text-[0.9375rem] text-muted">
            {pending.length} invitation{pending.length === 1 ? "" : "s"} awaiting your response · {apps.length} participating application{apps.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="inv-title">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="inv-title" className="font-display text-[0.9375rem] font-semibold text-ink-strong">
                Invitations awaiting response
              </h2>
              <Link href="/workspace/invitations" className="text-xs font-medium text-teal-700 hover:underline">
                All invitations
              </Link>
            </div>
            {pending.length === 0 ? (
              <EmptyState icon={MailPlus} title="No pending invitations" body="When an owner invites you to an application it appears here." />
            ) : (
              <div className="space-y-3">
                {pending.map((i) => (
                  <InvitationCard key={i.app.id + i.participation.role} app={i.app} participation={i.participation} />
                ))}
              </div>
            )}
          </section>

          {needsMe.length > 0 && (
            <Callout tone="warning" title="Applications that may need your input">
              {needsMe.map((a) => (
                <span key={a.id} className="block">
                  <Link href={`/workspace/applications/${a.id}`}>{a.title}</Link> — {a.status === "correction_requested" ? "correction requested by RAJUK" : "service drawings requested after approval"}
                </span>
              ))}
            </Callout>
          )}

          <Panel title="Participating applications" bodyClassName="p-0">
            {apps.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No participating applications" />
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
                          <span className="ref">{a.ref}</span> · {PROFESSIONAL_ROLE_LABEL[myRole]} · {a.documents.filter((d) => d.category === "drawing" && d.status !== "superseded").length} drawing sheets
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
          <Panel title="Professional profile">
            <div className="flex items-center gap-3">
              <Avatar name={me.name} size="lg" />
              <div className="min-w-0">
                <p className="font-semibold text-ink-strong">{me.name}</p>
                <p className="text-xs text-muted">{me.designation}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Professional body</dt>
                <dd className="font-medium text-ink-strong">{me.membership?.body}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Membership</dt>
                <dd className="ref text-ink-strong">{me.membership?.number}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Verification</dt>
                <dd>
                  {me.membership?.verified ? (
                    <Badge tone="success" icon={BadgeCheck}>
                      Verified (simulated)
                    </Badge>
                  ) : (
                    <Badge tone="warning" icon={ShieldAlert}>
                      Pending
                    </Badge>
                  )}
                </dd>
              </div>
            </dl>
            <p className="mt-4 border-t border-line pt-3 text-[0.6875rem] leading-relaxed text-subtle">Verification would come from the {me.membership?.body} integration (TOR 1.8). Membership number is fictional.</p>
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
