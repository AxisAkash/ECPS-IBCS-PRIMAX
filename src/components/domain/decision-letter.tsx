"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimulatedTag } from "@/components/ui/feedback";
import { useI18n } from "@/lib/i18n";
import { useLabels } from "@/lib/i18n/labels";
import type { Application, User } from "@/lib/domain/types";
import { formatDate, formatNumber } from "@/lib/utils";

/** Construction-term wording required by TOR 1.4 for PP/CP/RDC approval letters (message key "dl.term"). */

export type LetterKind = "approval" | "approval_fee" | "rejection";

export function letterKindFor(app: Application): LetterKind | undefined {
  if (app.status === "rejected" || app.status === "appealed") return "rejection";
  if (app.status === "approved") return "approval";
  if (app.status === "fee_pending") return "approval_fee";
  return undefined;
}

/**
 * DEMONSTRATION letter template. Wording other than the TOR 1.4 construction term is illustrative and
 * must be replaced by RAJUK-approved templates (TOR 1.3, 1.4, 1.16).
 */
export function DecisionLetter({ app, users, kind }: { app: Application; users: User[]; kind: LetterKind }) {
  const { t, locale } = useI18n();
  const L = useLabels();
  const owner = app.owners[0]?.name ?? t("dl.applicant");
  const signer = users.find((u) => u.id === (app.history.findLast((h) => h.action === "signed")?.actorId ?? "u-off-01"));
  const decided = app.decidedAt ?? app.history.findLast((h) => ["signed", "rejected", "committee_decision"].includes(h.action))?.at ?? app.stageEnteredAt;
  const reason = app.history.findLast((h) => h.action === "rejected" || (h.action === "committee_decision" && /reject/i.test(h.note ?? "")))?.note;
  const version = app.letterVersion ?? 1;
  const b = app.building;
  const isCp = ["CP", "RDC", "LSP"].includes(app.type);
  const memo = `RAJUK/DC/${app.property.zone.replace("Zone ", "Z")}/${app.ref.slice(-5)}/DEMO-L${version}`;

  return (
    <div>
      <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2">
        <SimulatedTag>{t("dl.draft")}</SimulatedTag>
        <Button size="sm" variant="secondary" onClick={() => window.print()}>
          <Printer /> {t("dl.print")}
        </Button>
      </div>
      <article data-theme="light" className="relative mx-auto max-w-2xl overflow-hidden rounded-md border border-line bg-white px-10 py-10 font-serif text-[0.9375rem] leading-relaxed text-ink shadow-sm" aria-label={t("dl.aria")}>
        <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="-rotate-[24deg] font-mono text-5xl font-semibold tracking-[0.2em] text-line">{t("dl.watermark")}</span>
        </div>
        <header className="relative border-b border-ink-strong/70 pb-4 text-center">
          <p className="text-xs tracking-wide">{t("dl.gov")}</p>
          <p className="mt-1 font-sans text-base font-semibold text-ink-strong">{t("dl.rajuk")}</p>
          <p className="text-xs">{t("dl.dc", { zone: L.zone(app.property.zone) })}</p>
        </header>
        <div className="relative mt-5 flex flex-wrap justify-between gap-2 font-mono text-xs">
          <span>{t("dl.memo", { memo })}</span>
          <span>{t("dl.date", { date: formatDate(decided, locale) })}</span>
        </div>
        <p className="relative mt-5">
          {t("dl.to")}
          <br />
          {owner}
          <br />
          {app.property.address}
        </p>
        <p className="relative mt-5 font-sans font-semibold text-ink-strong">
          {t("dl.subject")}{" "}
          {kind === "rejection"
            ? t("dl.subj.rejection", { service: L.service(app.type), ref: app.ref })
            : kind === "approval_fee"
              ? t("dl.subj.fee", { service: L.service(app.type), ref: app.ref })
              : t("dl.subj.approval", { service: L.service(app.type), ref: app.permitNo ?? app.ref })}
        </p>
        {kind === "rejection" ? (
          <>
            <p className="relative mt-4">
              {t("dl.rejIntro")}
            </p>
            <p className="relative mt-3 rounded border border-line bg-surface-2 px-4 py-3 font-sans text-sm">{reason ?? t("dl.reasonFile")}</p>
            <p className="relative mt-4">{t("dl.appeal")}</p>
          </>
        ) : (
          <>
            <p className="relative mt-4">
              {t("dl.apprIntro")} <span className="font-mono text-sm">{app.ref}</span>
            </p>
            <table className="relative mt-4 w-full font-sans text-sm">
              <tbody className="[&_td]:border [&_td]:border-line [&_td]:px-3 [&_td]:py-1.5">
                <tr>
                  <td className="w-44 text-muted">{t("dl.plot")}</td>
                  <td>{t("dl.plotVal", { mouza: app.property.mouza, dag: app.property.rsDag, area: formatNumber(app.property.plotAreaSqm, locale) })}</td>
                </tr>
                {b && (
                  <>
                    <tr>
                      <td className="text-muted">{t("dl.occupancy")}</td>
                      <td>{t("dl.occVal", { occ: b.occupancy, name: L.occ(b.occupancy) })}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">{t("dl.storeys")}</td>
                      <td>{t("dl.storeysVal", { storeys: `${b.basements ? `B${b.basements} + ` : ""}G+${b.storeys - 1}`, units: formatNumber(b.units, locale) })}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">{t("dl.tfa")}</td>
                      <td>{t("dl.sqm", { n: formatNumber(b.totalFloorAreaSqm, locale) })}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
            <p className="relative mt-4 font-sans text-sm font-semibold text-ink-strong">{t("dl.conditions")}</p>
            <ol className="relative mt-2 list-decimal space-y-1.5 pl-5">
              {isCp && <li className="rounded bg-amber-50 px-1">{t("dl.term")}</li>}
              <li>{t("dl.c1")}</li>
              <li>{t("dl.c2")}</li>
              {kind === "approval_fee" && <li>{t("dl.c3")}</li>}
            </ol>
          </>
        )}
        <footer className="relative mt-8 flex items-end justify-between gap-6">
          <div className="font-mono text-[0.6875rem] text-muted">
            {t("dl.verify")}
            <br />
            {t("dl.version", { v: version })}
          </div>
          <div className="text-right">
            <p className="font-sans text-sm font-semibold text-ink-strong">{signer?.name}</p>
            <p className="text-xs">{L.desig(signer?.designation)}, {L.zone(app.property.zone)}</p>
            <p className="mt-1 font-mono text-[0.625rem] text-teal-700">{t("dl.signed")}</p>
          </div>
        </footer>
      </article>
      <p className="no-print mt-3 text-xs text-muted">{t("dl.note")}</p>
    </div>
  );
}
