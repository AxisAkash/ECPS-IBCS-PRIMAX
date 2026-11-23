"use client";

import { AlertTriangle, ArrowLeft, CheckCircle2, Printer, Search, ShieldCheck, ShieldX, WifiOff, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/display";
import { Callout, EmptyState, Skeleton } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/form";
import { PUBLIC_PERMITS } from "@/lib/data/seed";
import { ZONES } from "@/lib/domain/catalog";
import type { PublicPermit } from "@/lib/domain/types";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { useLabels } from "@/lib/i18n/labels";
import { useDemoStore } from "@/lib/store/demo-store";
import { cn, formatDate, formatNumber, sleep } from "@/lib/utils";
import { Container, PageIntro } from "./page-intro";

export function usePermits(): PublicPermit[] {
  const issued = useDemoStore((s) => s.issuedPermits);
  return useMemo(() => [...(issued as PublicPermit[]), ...(PUBLIC_PERMITS as PublicPermit[])], [issued]);
}

export function PublicRegister() {
  const { t, term, locale } = useI18n();
  const params = useSearchParams();
  const router = useRouter();
  const hydrated = useDemoStore((s) => s.hydrated);
  const permits = usePermits();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [type, setType] = useState("");
  const [zone, setZone] = useState("");
  const [status, setStatus] = useState("");
  const simulateError = params.get("simulate") === "error";

  const results = permits.filter((p) => {
    const term = q.trim().toLowerCase();
    if (term && !`${p.permitNo} ${p.owners.join(" ")} ${p.area} ${p.mouza} ${p.plotRef}`.toLowerCase().includes(term)) return false;
    if (type && p.type !== type) return false;
    if (zone && p.zone !== zone) return false;
    if (status && p.status !== status) return false;
    return true;
  });

  return (
    <>
      <PageIntro breadcrumbs={[{ label: t("pub.home"), href: "/" }, { label: t("nav.register") }]} kicker={`${t("reg.kicker")} · TOR 2.14`} title={t("reg.title")} lead={t("reg.lead")}>
        <form
          role="search"
          className="flex max-w-2xl flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            router.replace(`/public-register${q ? `?q=${encodeURIComponent(q)}` : ""}`);
          }}
        >
          <label htmlFor="reg-search" className="sr-only">
            {t("reg.search")}
          </label>
          <Input id="reg-search" leading={<Search />} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("reg.search")} className="h-12 text-base" />
          <Button type="submit" size="lg">
            {t("common.search")}
          </Button>
        </form>
      </PageIntro>
      <Container className="lg:py-12">
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <Field label={t("pr.type")} className="w-40">
            {(a) => (
              <Select {...a} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">{t("pr.all")}</option>
                <option value="PP">{t("pr.pp")}</option>
                <option value="CP">{t("pr.cp")}</option>
              </Select>
            )}
          </Field>
          <Field label={t("pr.zone")} className="w-36">
            {(a) => (
              <Select {...a} value={zone} onChange={(e) => setZone(e.target.value)}>
                <option value="">{t("pr.allZones")}</option>
                {ZONES.map((z) => (
                  <option key={z} value={z}>
                    {term("zone", z)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t("pr.validity")} className="w-36">
            {(a) => (
              <Select {...a} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">{t("pr.any")}</option>
                <option value="valid">{t("pr.valid")}</option>
                <option value="expired">{t("pr.expired")}</option>
              </Select>
            )}
          </Field>
          {(q || type || zone || status) && (
            <Button variant="ghost" onClick={() => { setQ(""); setType(""); setZone(""); setStatus(""); }}>
              {t("common.clear")}
            </Button>
          )}
          <p className="ml-auto text-sm text-muted" aria-live="polite">
            {results.length === 1 ? t("pr.count1") : t("pr.count", { n: formatNumber(results.length, locale) })}
          </p>
        </div>

        {simulateError ? (
          <EmptyState icon={WifiOff} title={t("pr.errTitle")} body={t("pr.errBody")} action={<Button asChild variant="secondary"><Link href="/public-register">{t("common.retry")}</Link></Button>} />
        ) : !hydrated ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState icon={Search} title={t("pr.none")} body={t("pr.noneBody")} />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full min-w-[54rem] text-left text-sm">
              <caption className="sr-only">{t("pr.caption")}</caption>
              <thead className="bg-surface-2 text-[0.6875rem] uppercase tracking-[0.06em] text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">{t("pr.col.permit")}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t("pr.col.owners")}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t("pr.col.location")}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t("pr.col.use")}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t("pr.col.floor")}</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">{t("pr.col.units")}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t("pr.col.approved")}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t("pr.col.validity")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {results.map((p) => (
                  <tr key={p.permitNo} className="hover:bg-surface-2">
                    <td className="px-4 py-3.5">
                      <Link href={`/public-register/${p.permitNo}`} className="ref font-medium text-teal-700 hover:underline">
                        {p.permitNo}
                      </Link>
                      <span className="block text-xs text-muted">{p.type === "PP" ? t("pr.pp") : t("pr.cp")}</span>
                    </td>
                    <td className="max-w-[14rem] px-4 py-3.5 text-ink-strong">{p.owners.join(", ")}</td>
                    <td className="px-4 py-3.5">
                      {p.area}
                      <span className="block text-xs text-muted">
                        {term("zone", p.zone)} · {p.mouza}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">{term("landuse", p.landUse)}</td>
                    <td className="ref px-4 py-3.5">{p.floorLimit}</td>
                    <td className="tabular px-4 py-3.5 text-right">{formatNumber(p.units, locale)}</td>
                    <td className="tabular px-4 py-3.5 text-muted">{formatDate(p.approvedOn, locale)}</td>
                    <td className="px-4 py-3.5">
                      <Badge tone={p.status === "valid" ? "success" : "neutral"}>{p.status === "valid" ? t("pr.valid") : t("pr.expired")}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Callout tone="info" title={t("pr.shows")}>
            {t("pr.showsBody")}
          </Callout>
          <Callout tone="demo" title={t("pr.demo")}>
            {t("pr.demoBody")} <Link href="/public-register?simulate=error">{t("pr.previewErr")}</Link>
          </Callout>
        </div>
      </Container>
    </>
  );
}

export function PermitExtract({ permitNo }: { permitNo: string }) {
  const { t, term, locale } = useI18n();
  const L = useLabels();
  const hydrated = useDemoStore((s) => s.hydrated);
  const permits = usePermits();
  const p = permits.find((x) => x.permitNo === decodeURIComponent(permitNo));
  if (!hydrated) return <Container><Skeleton className="h-96" /></Container>;
  if (!p)
    return (
      <Container>
        <EmptyState icon={ShieldX} title={t("pr.notFound")} body={t("pr.notFoundBody")} action={<Button asChild><Link href="/public-register">{t("pr.back")}</Link></Button>} />
      </Container>
    );
  const s = p.setbacks;
  return (
    <>
      <PageIntro breadcrumbs={[{ label: t("pub.home"), href: "/" }, { label: t("nav.register"), href: "/public-register" }, { label: p.permitNo }]} kicker={p.type === "PP" ? t("pr.kickerPP") : t("pr.kickerCP")} title={p.permitNo} lead={t("pr.lead", { area: p.area, zone: term("zone", p.zone), date: formatDate(p.approvedOn, locale) })} />
      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <article className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm" aria-label={t("pr.extract")}>
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-2 px-6 py-4">
              <div>
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted [:lang(bn)_&]:font-sans [:lang(bn)_&]:normal-case [:lang(bn)_&]:tracking-normal">{t("pr.extractKicker")}</p>
                <p className="mt-0.5 text-sm text-ink">{t("pr.authority")}</p>
              </div>
              <Badge tone={p.status === "valid" ? "success" : "neutral"} icon={p.status === "valid" ? CheckCircle2 : XCircle}>
                {p.status === "valid" ? t("pr.validUntil", { date: formatDate(p.validUntil, locale) }) : t("pr.validityExpired")}
              </Badge>
            </header>
            <div className="grid gap-8 p-6 md:grid-cols-[minmax(0,1fr)_15rem]">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
                {[
                  ["pr.f.owners", p.owners.join(", ")],
                  ["pr.f.type", p.type === "PP" ? t("pr.pp") : t("pr.cp")],
                  ["pr.f.areaZone", `${p.area} · ${term("zone", p.zone)}`],
                  ["pr.f.mouzaPlot", `${p.mouza} · ${p.plotRef}`],
                  ["pr.f.landUse", term("landuse", p.landUse)],
                  ["pr.f.occupancy", t("pr.f.occVal", { occ: p.occupancy, name: L.occ(p.occupancy) })],
                  ["pr.f.floor", p.floorLimit],
                  ["pr.f.units", t("pr.f.unitsVal", { n: formatNumber(p.units, locale) })],
                ].map(([k, v]) => (
                  <div key={k} className={k === "pr.f.owners" ? "col-span-2" : ""}>
                    <dt className="text-xs text-muted">{t(k as MessageKey)}</dt>
                    <dd className={cn("mt-0.5 font-medium text-ink-strong", k === "pr.f.floor" && "ref")}>{v}</dd>
                  </div>
                ))}
              </dl>
              <figure>
                <svg viewBox="0 0 200 220" className="w-full" role="img" aria-label={t("pr.setbacksAria", { front: s.front, rear: s.rear, left: s.left, right: s.right })}>
                  <rect x="20" y="20" width="160" height="170" fill="#f4f7fa" stroke="#253244" strokeDasharray="5 3" />
                  <rect x={20 + s.left * 14} y={20 + s.rear * 14} width={160 - (s.left + s.right) * 14} height={170 - (s.front + s.rear) * 14} fill="#dbeff2" stroke="#167d8d" strokeWidth="1.5" />
                  <g fontFamily="var(--font-plex-mono), var(--font-noto-bengali), monospace" fontSize="9" fill="#11697a" textAnchor="middle">
                    <text x="100" y="14">{t("pr.rear", { n: s.rear })}</text>
                    <text x="100" y="204">{t("pr.front", { n: s.front })}</text>
                    <text x="10" y="108" transform="rotate(-90 10 108)">{t("pr.left", { n: s.left })}</text>
                    <text x="192" y="108" transform="rotate(90 192 108)">{t("pr.right", { n: s.right })}</text>
                  </g>
                  <rect x="20" y="208" width="160" height="10" fill="#c9d4df" />
                </svg>
                <figcaption className="mt-2 text-center text-xs text-muted">{t("pr.setbacks")}</figcaption>
              </figure>
            </div>
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4 text-xs text-muted">
              <span>
                {t("pr.code")} <span className="ref font-semibold text-ink-strong">{p.verificationCode}</span>
              </span>
              <Button variant="secondary" size="sm" onClick={() => window.print()} className="no-print">
                <Printer /> {t("pr.print")}
              </Button>
            </footer>
          </article>
          <aside className="space-y-4">
            <div className="rounded-xl border border-success-600/25 bg-success-100/50 p-5">
              <p className="flex items-center gap-2 font-semibold text-success-700">
                <ShieldCheck className="size-5" aria-hidden /> {t("pr.found")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink">{t("pr.foundBody")}</p>
            </div>
            <Callout tone="info" icon={AlertTriangle} title={t("pr.privacy")}>
              {t("pr.privacyBody")}
            </Callout>
            <Button asChild variant="ghost">
              <Link href="/public-register">
                <ArrowLeft /> {t("pr.back")}
              </Link>
            </Button>
          </aside>
        </div>
      </Container>
    </>
  );
}

export function VerifyPermit() {
  const { t, locale } = useI18n();
  const permits = usePermits();
  const [no, setNo] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<null | { kind: "valid" | "mismatch" | "notfound"; permit?: PublicPermit }>(null);
  const sample = permits[0];

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    await sleep(800);
    const p = permits.find((x) => x.permitNo.toLowerCase() === no.trim().toLowerCase());
    setBusy(false);
    if (!p) return setResult({ kind: "notfound" });
    if (code.trim().toUpperCase() !== p.verificationCode) return setResult({ kind: "mismatch", permit: p });
    setResult({ kind: "valid", permit: p });
  };

  return (
    <>
      <PageIntro breadcrumbs={[{ label: t("pub.home"), href: "/" }, { label: t("reg.verify") }]} kicker={t("vf.kicker")} title={t("vf.title")} lead={t("vf.lead")} />
      <Container>
        <div className="grid gap-10 lg:grid-cols-2">
          <form onSubmit={verify} noValidate className="space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
            <Field label={t("vf.number")} required>
              {(a) => <Input {...a} value={no} onChange={(e) => setNo(e.target.value)} className="ref uppercase" placeholder="CP-26-Z4-01561" />}
            </Field>
            <Field label={t("vf.code")} required hint={t("vf.codeHint")}>
              {(a) => <Input {...a} value={code} onChange={(e) => setCode(e.target.value)} className="ref uppercase" placeholder="V000000X" />}
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={busy} disabled={!no || !code}>
              {t("vf.verify")}
            </Button>
            {sample && (
              <p className="text-xs text-muted">
                {t("vf.demo")}{" "}
                <button type="button" className="font-medium text-teal-700 underline" onClick={() => { setNo(sample.permitNo); setCode(sample.verificationCode); }}>
                  {t("vf.fill")}
                </button>
              </p>
            )}
          </form>
          <div aria-live="polite">
            {!result && !busy && <EmptyState icon={ShieldCheck} title={t("vf.resultHere")} body={t("vf.resultBody")} />}
            {busy && <Skeleton className="h-48" />}
            {result?.kind === "valid" && result.permit && (
              <div className="rounded-2xl border border-success-600/30 bg-success-100/50 p-6">
                <p className="flex items-center gap-2 font-display text-lg font-semibold text-success-700">
                  <CheckCircle2 className="size-6" aria-hidden /> {t("vf.verified")}
                </p>
                <p className="mt-2 text-sm text-ink">
                  {t("vf.summary", { no: result.permit.permitNo, owners: result.permit.owners.join(", "), area: result.permit.area, date: formatDate(result.permit.approvedOn, locale) })} <span className="ref">{result.permit.floorLimit}</span>
                </p>
                <Button asChild variant="secondary" size="sm" className="mt-4">
                  <Link href={`/public-register/${result.permit.permitNo}`}>{t("vf.open")}</Link>
                </Button>
                <p className="mt-4 text-xs text-muted">{t("vf.disclaimer")}</p>
              </div>
            )}
            {result?.kind === "mismatch" && (
              <Callout tone="danger" title={t("vf.mismatch")}>
                {t("vf.mismatchBody")}
              </Callout>
            )}
            {result?.kind === "notfound" && (
              <Callout tone="warning" title={t("vf.notFound")}>
                {t("vf.notFoundBody")}
              </Callout>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
