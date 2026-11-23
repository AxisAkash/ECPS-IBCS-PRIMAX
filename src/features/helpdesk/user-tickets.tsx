"use client";

import { ChevronDown, MessageSquare, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, Panel } from "@/components/ui/display";
import { EmptyState } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import type { Ticket } from "@/lib/domain/types";
import type { Tone } from "@/lib/domain/workflow";
import { ecps } from "@/lib/services";
import { useDemoStore, userName } from "@/lib/store/demo-store";
import { cn, formatDateTime, formatRelative } from "@/lib/utils";
import { useI18n, type MessageKey } from "@/lib/i18n";

export const TICKET_TONE: Record<Ticket["status"], Tone> = { open: "info", in_progress: "progress", awaiting_user: "warning", resolved: "success", closed: "neutral" };
/** Message keys for ticket statuses and categories (render with `t()`). */
export const TICKET_LABEL: Record<Ticket["status"], MessageKey> = { open: "tkst.open", in_progress: "tkst.in_progress", awaiting_user: "tkst.awaiting_user", resolved: "tkst.resolved", closed: "tkst.closed" };
export const CATEGORY_LABEL: Record<Ticket["category"], MessageKey> = { account: "tkcat.account", application: "tkcat.application", payment: "tkcat.payment", signature: "tkcat.signature", technical: "tkcat.technical", other: "tkcat.other" };

export function HelpdeskForUser() {
  const { t: tr, locale } = useI18n();
  const session = useDemoStore((s) => s.session);
  const allTickets = useDemoStore((s) => s.tickets);
  const applications = useDemoStore((s) => s.applications);
  const users = useDemoStore((s) => s.users);
  const tickets = useMemo(() => allTickets.filter((t) => t.raisedBy === session?.userId), [allTickets, session]);
  const myApps = useMemo(() => applications.filter((a) => a.applicantId === session?.userId && a.status !== "draft"), [applications, session]);
  const [form, setForm] = useState({ category: "application" as Ticket["category"], subject: "", description: "", priority: "medium" as Ticket["priority"], applicationRef: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.subject.trim().length < 5) errs.subject = tr("ut.errSubject");
    if (form.description.trim().length < 15) errs.description = tr("ut.errDesc");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    const t = await ecps.helpdesk.create({ ...form, applicationRef: form.applicationRef || undefined });
    setBusy(false);
    setForm({ category: "application", subject: "", description: "", priority: "medium", applicationRef: "" });
    setOpen(t.id);
    toast.success(tr("ut.created", { ref: t.ref }), tr("ut.createdBody"));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Panel id="raise" title={tr("ut.raise")} description={tr("ut.raiseDesc")}>
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tr("ut.category")} required>
              {(a) => (
                <Select {...a} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Ticket["category"] })}>
                  {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {tr(v)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={tr("ut.priority")}>
              {(a) => (
                <Select {...a} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Ticket["priority"] })}>
                  <option value="low">{tr("ut.low")}</option>
                  <option value="medium">{tr("ut.medium")}</option>
                  <option value="high">{tr("ut.high")}</option>
                </Select>
              )}
            </Field>
          </div>
          <Field label={tr("ut.related")} optional>
            {(a) => (
              <Select {...a} value={form.applicationRef} onChange={(e) => setForm({ ...form, applicationRef: e.target.value })}>
                <option value="">{tr("ut.none")}</option>
                {myApps.map((x) => (
                  <option key={x.id} value={x.ref}>
                    {x.ref} — {x.title}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={tr("ut.subject")} required error={errors.subject}>
            {(a) => <Input {...a} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />}
          </Field>
          <Field label={tr("ut.description")} required error={errors.description}>
            {(a) => <Textarea {...a} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />}
          </Field>
          <Button type="submit" loading={busy}>
            <Send /> {tr("ut.submit")}
          </Button>
        </form>
      </Panel>

      <section id="follow" aria-labelledby="my-tickets">
        <h2 id="my-tickets" className="mb-3 font-display text-[0.9375rem] font-semibold text-ink-strong">
          {tr("ut.mine", { n: tickets.length })}
        </h2>
        {tickets.length === 0 ? (
          <EmptyState icon={MessageSquare} title={tr("ut.empty")} body={tr("ut.emptyBody")} />
        ) : (
          <ul className="space-y-2">
            {tickets.map((t) => {
              const expanded = open === t.id;
              return (
                <li key={t.id} className="overflow-hidden rounded-xl border border-line bg-surface">
                  <button type="button" onClick={() => setOpen(expanded ? null : t.id)} aria-expanded={expanded} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink-strong">{t.subject}</p>
                      <p className="text-xs text-muted">
                        <span className="ref">{t.ref}</span> · {tr(CATEGORY_LABEL[t.category])} · {tr("ut.updated", { when: formatRelative(t.updatedAt, undefined, locale) })}
                      </p>
                    </div>
                    <Badge tone={TICKET_TONE[t.status]}>{tr(TICKET_LABEL[t.status])}</Badge>
                    <ChevronDown className={cn("size-4 text-subtle transition-transform", expanded && "rotate-180")} aria-hidden />
                  </button>
                  {expanded && (
                    <div className="border-t border-line bg-surface-2 px-4 py-4">
                      <ol className="space-y-3">
                        {t.thread.map((m, i) => (
                          <li key={i} className={cn("max-w-[85%] rounded-lg px-3 py-2 text-sm", m.authorId === t.raisedBy ? "ml-auto bg-teal-600 text-white" : "border border-line bg-surface text-ink")}>
                            <p>{m.text}</p>
                            <p className={cn("mt-1 text-[0.6875rem]", m.authorId === t.raisedBy ? "text-white/75" : "text-subtle")}>
                              {userName(users, m.authorId)} · {formatDateTime(m.at, locale)}
                            </p>
                          </li>
                        ))}
                      </ol>
                      {!["resolved", "closed"].includes(t.status) && (
                        <form
                          className="mt-4 flex gap-2"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (!reply.trim()) return;
                            await ecps.helpdesk.reply(t.id, reply.trim());
                            setReply("");
                          }}
                        >
                          <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder={tr("ut.addReply")} aria-label={tr("ut.reply")} />
                          <Button type="submit" variant="secondary">
                            {tr("ut.send")}
                          </Button>
                        </form>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
