"use client";

import { Bell, CheckCheck, FileStack, KeyRound, Laptop, LifeBuoy, MailPlus, Search, ShieldCheck, Smartphone } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DocumentPreview } from "@/components/domain/document-preview";
import { FileRow } from "@/components/domain/file-drop";
import { SERVICE_ICON, StageTrack, StatusBadge } from "@/components/domain/status";
import { Button } from "@/components/ui/button";
import { Badge, KeyValues, PageHeader, Panel } from "@/components/ui/display";
import { Callout, EmptyState, SimulatedTag } from "@/components/ui/feedback";
import { Input, SegmentedControl } from "@/components/ui/form";
import { ConfirmDialog, Dialog, DialogContent } from "@/components/ui/overlay";
import { toast } from "@/components/ui/toast";
import { DOCUMENT_CATEGORY_LABEL, PROFESSIONAL_ROLE_LABEL, SERVICE_SHORT_LABEL } from "@/lib/domain/catalog";
import type { Application, DocumentRecord } from "@/lib/domain/types";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { notifBody, notifTitle } from "@/lib/i18n/notify";
import { useDemoStore, userName } from "@/lib/store/demo-store";
import { cn, formatBDT, formatDate, formatDateTime, formatRelative } from "@/lib/utils";
import { HelpdeskForUser } from "@/features/helpdesk/user-tickets";
import { useInvitations, useMe, useMyApplications, useUsers } from "./hooks";
import { InvitationCard } from "./professional";
import { NewApplicationButton } from "./new-application-dialog";
import { PaymentDialog } from "./payment-dialog";

export function ApplicationsListPage() {
  const { t, locale } = useI18n();
  const apps = useMyApplications();
  const role = useDemoStore((s) => s.session?.role);
  const [filter, setFilter] = useState<"all" | "action" | "progress" | "done">("all");
  const [q, setQ] = useState("");
  const list = apps
    .filter((a) =>
      filter === "all" ? true : filter === "action" ? ["draft", "correction_requested", "fee_pending"].includes(a.status) : filter === "progress" ? ["submitted", "in_review", "committee", "signing"].includes(a.status) : ["approved", "rejected", "appealed"].includes(a.status),
    )
    .filter((a) => !q || `${a.ref} ${a.title} ${a.property.area}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHeader title={t("nav.ws.applications")} description={role === "professional" ? t("apps.leadPro") : t("apps.lead")} actions={role !== "professional" && <NewApplicationButton />} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          label={t("apps.filter")}
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: t("apps.all"), count: apps.length },
            { value: "action", label: t("apps.action") },
            { value: "progress", label: t("ws.inprogress") },
            { value: "done", label: t("ws.completed") },
          ]}
        />
        <div className="w-full sm:w-72">
          <Input leading={<Search />} placeholder={t("apps.search")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("apps.search")} />
        </div>
      </div>
      {list.length === 0 ? (
        <EmptyState icon={FileStack} title={t("apps.none")} body={t("apps.noneBody")} />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {list.map((a) => {
            const Icon = SERVICE_ICON[a.type];
            return (
              <li key={a.id}>
                <Link href={a.status === "draft" && role !== "professional" ? `/workspace/applications/${a.id}/edit` : `/workspace/applications/${a.id}`} className="group flex h-full flex-col rounded-xl border border-line bg-surface p-5 shadow-xs transition-[border-color,box-shadow] hover:border-teal-600/40 hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-3 text-slate-ink">
                      <Icon className="size-[18px]" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink-strong group-hover:text-teal-700">{a.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        <span className="ref">{a.ref}</span> · {SERVICE_SHORT_LABEL[a.type]}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="mt-auto pt-5">
                    {a.status !== "draft" ? <StageTrack type={a.type} stage={a.stage} status={a.status} /> : <div className="h-1.5 rounded-full bg-surface-3"><div className="h-full rounded-full bg-teal-600" style={{ width: `${((a.draftStep ?? 0) / 7) * 100}%` }} /></div>}
                    <p className="mt-2 text-xs text-muted">
                      {a.status === "draft" ? t("apps.draftStep", { n: (a.draftStep ?? 0) + 1 }) : ["approved", "rejected"].includes(a.status) ? t("apps.decided", { date: formatDate(a.decidedAt, locale) }) : t("apps.atStage", { stage: t(`stage.${a.stage}` as MessageKey), date: formatDate(a.submittedAt, locale) })}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function DocumentsPage() {
  const apps = useMyApplications();
  const [preview, setPreview] = useState<{ doc: DocumentRecord; app: Application } | null>(null);
  const [q, setQ] = useState("");
  return (
    <div>
      <PageHeader title="Documents" description="All files attached to your applications, with their version history. Every file in this prototype is a fictional sample." />
      <div className="mb-5 w-full sm:w-80">
        <Input leading={<Search />} placeholder="Search file names" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search documents" />
      </div>
      <div className="space-y-5">
        {apps.map((a) => {
          const docs = a.documents.filter((d) => !q || d.name.toLowerCase().includes(q.toLowerCase()));
          if (!docs.length) return null;
          return (
            <Panel key={a.id} title={a.title} description={`${a.ref} · ${docs.filter((d) => d.status !== "superseded").length} current files`}>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {docs.map((d) => (
                  <FileRow key={d.id} name={d.name} sizeKb={d.sizeKb} kind={d.previewKind} status={d.status} meta={`${DOCUMENT_CATEGORY_LABEL[d.category]} · v${d.version}`} onPreview={() => setPreview({ doc: d, app: a })} />
                ))}
              </div>
            </Panel>
          );
        })}
      </div>
      <Dialog open={preview !== null} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent size="xl" eyebrow="Document preview · sample" title={preview?.doc.name ?? ""}>
          {preview && <DocumentPreview doc={preview.doc} app={preview.app} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PaymentsPage() {
  const { t, locale } = useI18n();
  const apps = useMyApplications();
  const payments = useDemoStore((s) => s.payments);
  const [payFor, setPayFor] = useState<Application | null>(null);
  const mine = useMemo(() => payments.filter((p) => apps.some((a) => a.id === p.applicationId)), [payments, apps]);
  return (
    <div>
      <PageHeader title={t("nav.ws.payments")} description={t("pays.lead")} />
      <Callout tone="demo" className="mb-5">
        {t("pays.note")}
      </Callout>
      {mine.length === 0 ? (
        <EmptyState title={t("ad.noPayments")} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Payments</caption>
            <thead className="bg-surface-2 text-xs text-muted">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">{t("pays.app")}</th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium md:table-cell">{t("pays.cat")}</th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">{t("pays.date")}</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">{t("pays.amount")}</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">{t("pays.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {mine.map((p) => {
                const a = apps.find((x) => x.id === p.applicationId)!;
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <p className="ref text-ink-strong">{p.applicationRef}</p>
                      <p className="max-w-[16rem] truncate text-xs text-muted">{a.title}</p>
                    </td>
                    <td className="hidden px-4 py-3 capitalize md:table-cell">{p.category.replace("_", " ")}</td>
                    <td className="tabular hidden px-4 py-3 text-muted sm:table-cell">{formatDate(p.paidAt ?? p.createdAt, locale)}</td>
                    <td className="tabular px-4 py-3 text-right font-medium text-ink-strong">{formatBDT(p.amount, locale)}</td>
                    <td className="px-4 py-3 text-right">
                      {p.status === "pending" ? (
                        <Button size="xs" onClick={() => setPayFor(a)}>
                          {t("ws.pay")}
                        </Button>
                      ) : (
                        <Badge tone={p.status === "paid" ? "success" : "danger"}>{p.status}</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {payFor && <PaymentDialog app={payFor} open onOpenChange={(o) => !o && setPayFor(null)} />}
    </div>
  );
}

export function NotificationsPage() {
  const { t, locale } = useI18n();
  const me = useMe();
  const all = useDemoStore((s) => s.notifications);
  const markRead = useDemoStore((s) => s.markNotificationRead);
  const markAll = useDemoStore((s) => s.markAllNotificationsRead);
  const [only, setOnly] = useState<"all" | "unread">("all");
  const mine = useMemo(() => all.filter((n) => n.userId === me?.id && (only === "all" || !n.read)), [all, me, only]);
  return (
    <div>
      <PageHeader
        title={t("nav.ws.notifications")}
        description={t("notif.lead")}
        actions={
          <Button variant="secondary" onClick={markAll}>
            <CheckCheck /> {t("notif.markAll")}
          </Button>
        }
      />
      <SegmentedControl className="mb-4" label={t("apps.filter")} value={only} onChange={setOnly} options={[{ value: "all", label: t("apps.all") }, { value: "unread", label: t("notif.unread") }]} />
      {mine.length === 0 ? (
        <EmptyState icon={Bell} title={t("notif.empty")} />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {mine.map((n) => (
            <li key={n.id} className={cn("flex gap-4 px-5 py-4", !n.read && "bg-teal-50/40")}>
              <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-line-strong" : n.kind === "warning" ? "bg-amber-500" : n.kind === "action" ? "bg-danger-600" : n.kind === "success" ? "bg-success-600" : "bg-teal-600")} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-strong">{notifTitle(n, locale)}</p>
                <p className="mt-0.5 text-sm text-muted">{notifBody(n, locale)}</p>
                <p className="mt-1 text-xs text-subtle">{formatDateTime(n.at)}</p>
              </div>
              {n.href && (
                <Button asChild size="sm" variant="ghost" onClick={() => markRead(n.id)}>
                  <Link href={n.href}>{t("notif.open")}</Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function InvitationsPage() {
  const invites = useInvitations();
  const users = useUsers();
  const pending = invites.filter((i) => i.participation.status === "invited");
  const history = invites.filter((i) => i.participation.status !== "invited");
  return (
    <div>
      <PageHeader title="Invitations" description="Owners invite you to participate in their applications. Accepting records you as the responsible professional for your discipline." />
      <section className="mb-8">
        <h2 className="mb-3 font-display text-[0.9375rem] font-semibold text-ink-strong">Awaiting your response ({pending.length})</h2>
        {pending.length === 0 ? <EmptyState icon={MailPlus} title="No pending invitations" /> : <div className="space-y-3">{pending.map((i) => <InvitationCard key={i.app.id + i.participation.role} app={i.app} participation={i.participation} />)}</div>}
      </section>
      <Panel title="Response history" bodyClassName="p-0">
        <ul className="divide-y divide-line">
          {history.map(({ app, participation }) => (
            <li key={app.id + participation.role + participation.invitedAt} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <Link href={`/workspace/applications/${app.id}`} className="font-medium text-ink-strong hover:text-teal-700">
                  {app.title}
                </Link>
                <p className="text-xs text-muted">
                  {PROFESSIONAL_ROLE_LABEL[participation.role]} · owner {userName(users, app.applicantId)} · responded {participation.respondedAt ? formatRelative(participation.respondedAt) : "—"}
                </p>
              </div>
              <Badge tone={participation.status === "accepted" ? "success" : participation.status === "declined" ? "danger" : "neutral"}>{participation.status}</Badge>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

export function ProfilePage() {
  const me = useMe();
  const security = useDemoStore((s) => s.security);
  const allDevices = useDemoStore((s) => s.trustedDevices);
  const removeDevice = useDemoStore((s) => s.removeTrustedDevice);
  const devices = useMemo(() => allDevices.filter((d) => d.userId === me?.id), [allDevices, me]);
  const [removing, setRemoving] = useState<string | null>(null);
  if (!me) return null;
  return (
    <div>
      <PageHeader title="Profile & security" description="Your account details and sign-in security. Personal information shown here is fictional." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Account">
          <KeyValues
            items={[
              { k: "Name", v: me.name },
              { k: "Name (Bangla)", v: me.nameBn ?? "—" },
              { k: "Role", v: me.designation },
              { k: "Email", v: me.email },
              { k: "Mobile", v: me.mobile, mono: true },
              ...(me.membership ? [{ k: "Membership", v: `${me.membership.body} ${me.membership.number}` }] : [{ k: "NID", v: "•••• •••• 4711 (fictional)" }]),
            ]}
          />
        </Panel>
        <Panel title="Sign-in security" actions={<SimulatedTag />}>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-4 text-success-700" aria-hidden />
              <div className="flex-1">
                <p className="font-medium text-ink-strong">One-time code on untrusted devices</p>
                <p className="text-xs text-muted">{security.otpForUntrustedDevice ? "On" : "Off"} · set by RAJUK policy</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <KeyRound className="mt-0.5 size-4 text-slate-ink" aria-hidden />
              <div className="flex-1">
                <p className="font-medium text-ink-strong">Password</p>
                <p className="text-xs text-muted">Must be changed every {security.password.expiryDays} days · minimum {security.password.minLength} characters</p>
              </div>
              <Button asChild size="sm" variant="secondary">
                <Link href="/sign-in/change-password">Change</Link>
              </Button>
            </li>
          </ul>
          <h3 className="mb-2 mt-6 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-muted">Trusted devices</h3>
          {devices.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line-strong px-3 py-3 text-sm text-muted">No trusted devices. You will be asked for a one-time code on every new device.</p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line text-sm">
              {devices.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-3 py-2.5">
                  {d.kind === "laptop" ? <Laptop className="size-4 text-subtle" aria-hidden /> : <Smartphone className="size-4 text-subtle" aria-hidden />}
                  <span className="flex-1">{d.label}</span>
                  <span className="text-xs text-muted">{d.label === "This browser" ? "Now" : formatRelative(d.lastSeenAt)}</span>
                  {d.label !== "This browser" && (
                    <Button size="xs" variant="ghost" onClick={() => setRemoving(d.id)} aria-label={`Remove ${d.label}`}>
                      Remove
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <ConfirmDialog
            open={!!removing}
            onOpenChange={(o) => !o && setRemoving(null)}
            title="Remove this trusted device?"
            description="The next sign-in from that device will require a one-time code (TOR 1.9)."
            confirmLabel="Yes, remove"
            tone="danger"
            onConfirm={() => {
              removeDevice(removing!);
              setRemoving(null);
              toast.success("Device removed", "A one-time code will be required next time.");
            }}
          />
          <p className="mt-3 text-xs text-muted">Automatic sign-out after {security.idleTimeoutMinutes} minutes without activity.</p>
        </Panel>
      </div>
    </div>
  );
}

export function SupportPage() {
  return (
    <div>
      <PageHeader title="Support" description="Raise a request with the ECPS helpdesk and follow its progress. Every request receives a tracking number (TOR §6)." />
      <HelpdeskForUser />
      <p className="mt-6 flex items-center gap-2 text-xs text-muted">
        <LifeBuoy className="size-3.5" aria-hidden /> Helpdesk operates during office hours. Response targets will follow the SLA agreed with RAJUK.
      </p>
    </div>
  );
}
