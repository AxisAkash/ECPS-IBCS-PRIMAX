"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimulatedTag } from "@/components/ui/feedback";
import { OCCUPANCY, SERVICE_SHORT_LABEL } from "@/lib/domain/catalog";
import type { Application, User } from "@/lib/domain/types";
import { formatDate } from "@/lib/utils";

/** Construction-term wording required by TOR 1.4 for PP/CP/RDC approval letters. */
export const CONSTRUCTION_TERM =
  "The construction approval shall be valid for 03 (three) years, and construction must be completed at least up to the plinth level within this period.";

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
  const owner = app.owners[0]?.name ?? "Applicant";
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
        <SimulatedTag>Draft template · wording to be approved by RAJUK</SimulatedTag>
        <Button size="sm" variant="secondary" onClick={() => window.print()}>
          <Printer /> Print
        </Button>
      </div>
      <article className="relative mx-auto max-w-2xl overflow-hidden rounded-md border border-line bg-white px-10 py-10 font-serif text-[0.9375rem] leading-relaxed text-ink shadow-sm" aria-label="Decision letter">
        <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="-rotate-[24deg] font-mono text-5xl font-semibold tracking-[0.2em] text-line">DEMONSTRATION</span>
        </div>
        <header className="relative border-b border-ink-strong/70 pb-4 text-center">
          <p className="text-xs tracking-wide">Government of the People&apos;s Republic of Bangladesh</p>
          <p className="mt-1 font-sans text-base font-semibold text-ink-strong">Rajdhani Unnayan Kartripakkha (RAJUK)</p>
          <p className="text-xs">Development Control · {app.property.zone} (demonstration letterhead)</p>
        </header>
        <div className="relative mt-5 flex flex-wrap justify-between gap-2 font-mono text-xs">
          <span>Memo: {memo}</span>
          <span>Date: {formatDate(decided)}</span>
        </div>
        <p className="relative mt-5">
          To
          <br />
          {owner}
          <br />
          {app.property.address}
        </p>
        <p className="relative mt-5 font-sans font-semibold text-ink-strong">
          Subject:{" "}
          {kind === "rejection"
            ? `Decision on ${SERVICE_SHORT_LABEL[app.type]} application ${app.ref}`
            : kind === "approval_fee"
              ? `Approval of ${SERVICE_SHORT_LABEL[app.type]} ${app.ref} — subject to payment of fees and submission of service drawings`
              : `Approval of ${SERVICE_SHORT_LABEL[app.type]} ${app.permitNo ?? app.ref}`}
        </p>
        {kind === "rejection" ? (
          <>
            <p className="relative mt-4">
              With reference to the above application, you are informed that the application could not be approved for the following reason(s):
            </p>
            <p className="relative mt-3 rounded border border-line bg-surface-2 px-4 py-3 font-sans text-sm">{reason ?? "Reason recorded in the file."}</p>
            <p className="relative mt-4">You may file an appeal through ECPS within the period allowed under the applicable rules.</p>
          </>
        ) : (
          <>
            <p className="relative mt-4">
              With reference to the above application, approval is accorded for the following, as per the approved drawings bearing the file number <span className="font-mono text-sm">{app.ref}</span>:
            </p>
            <table className="relative mt-4 w-full font-sans text-sm">
              <tbody className="[&_td]:border [&_td]:border-line [&_td]:px-3 [&_td]:py-1.5">
                <tr>
                  <td className="w-44 text-muted">Plot</td>
                  <td>
                    Mouza {app.property.mouza}, RS Dag {app.property.rsDag}, {app.property.plotAreaSqm} m²
                  </td>
                </tr>
                {b && (
                  <>
                    <tr>
                      <td className="text-muted">Occupancy</td>
                      <td>
                        Group {b.occupancy} ({OCCUPANCY[b.occupancy]})
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Storeys · units</td>
                      <td>
                        {b.basements ? `B${b.basements} + ` : ""}G+{b.storeys - 1} · {b.units} units
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Total floor area</td>
                      <td>{b.totalFloorAreaSqm.toLocaleString("en-IN")} m²</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
            <p className="relative mt-4 font-sans text-sm font-semibold text-ink-strong">Conditions</p>
            <ol className="relative mt-2 list-decimal space-y-1.5 pl-5">
              {isCp && <li className="rounded bg-amber-50 px-1">{CONSTRUCTION_TERM}</li>}
              <li>Construction shall follow the approved drawings; any change requires a revised permit.</li>
              <li>A Construction Start Notice shall be submitted through ECPS before construction begins.</li>
              {kind === "approval_fee" && <li>This approval takes effect on payment of the permit fee and submission of the electrical and plumbing drawings through ECPS.</li>}
            </ol>
          </>
        )}
        <footer className="relative mt-8 flex items-end justify-between gap-6">
          <div className="font-mono text-[0.6875rem] text-muted">
            Verify at /verify
            <br />
            Letter version {version}
          </div>
          <div className="text-right">
            <p className="font-sans text-sm font-semibold text-ink-strong">{signer?.name}</p>
            <p className="text-xs">{signer?.designation}, {app.property.zone}</p>
            <p className="mt-1 font-mono text-[0.625rem] text-teal-700">Digitally signed (simulated)</p>
          </div>
        </footer>
      </article>
      <p className="no-print mt-3 text-xs text-muted">Only the construction-term condition reproduces TOR 1.4 wording; all other text is illustrative.</p>
    </div>
  );
}
