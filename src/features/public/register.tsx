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
import { OCCUPANCY, ZONES } from "@/lib/domain/catalog";
import type { PublicPermit } from "@/lib/domain/types";
import { useI18n } from "@/lib/i18n";
import { useDemoStore } from "@/lib/store/demo-store";
import { cn, formatDate, sleep } from "@/lib/utils";
import { Container, PageIntro } from "./page-intro";

export function usePermits(): PublicPermit[] {
  const issued = useDemoStore((s) => s.issuedPermits);
  return useMemo(() => [...(issued as PublicPermit[]), ...(PUBLIC_PERMITS as PublicPermit[])], [issued]);
}

export function PublicRegister() {
  const { t, locale } = useI18n();
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
      <PageIntro breadcrumbs={[{ label: "Home", href: "/" }, { label: t("nav.register") }]} kicker={`${t("reg.kicker")} · TOR 2.14`} title={t("reg.title")} lead={t("reg.lead")}>
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
          <Field label="Permit type" className="w-40">
            {(a) => (
              <Select {...a} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">All</option>
                <option value="PP">Planning Permit</option>
                <option value="CP">Construction Permit</option>
              </Select>
            )}
          </Field>
          <Field label="Zone" className="w-36">
            {(a) => (
              <Select {...a} value={zone} onChange={(e) => setZone(e.target.value)}>
                <option value="">All zones</option>
                {ZONES.map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Validity" className="w-36">
            {(a) => (
              <Select {...a} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Any</option>
                <option value="valid">Valid</option>
                <option value="expired">Expired</option>
              </Select>
            )}
          </Field>
          {(q || type || zone || status) && (
            <Button variant="ghost" onClick={() => { setQ(""); setType(""); setZone(""); setStatus(""); }}>
              {t("common.clear")}
            </Button>
          )}
          <p className="ml-auto text-sm text-muted" aria-live="polite">
            {results.length} {results.length === 1 ? "permit" : "permits"}
          </p>
        </div>

        {simulateError ? (
          <EmptyState icon={WifiOff} title="The register is temporarily unavailable" body="We could not reach the register service. Please try again in a few minutes. (Simulated error state.)" action={<Button asChild variant="secondary"><Link href="/public-register">{t("common.retry")}</Link></Button>} />
        ) : !hydrated ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState icon={Search} title="No approved permits match your search" body="Check the permit number, try the area name, or remove a filter." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full min-w-[54rem] text-left text-sm">
              <caption className="sr-only">Approved permits</caption>
              <thead className="bg-surface-2 text-[0.6875rem] uppercase tracking-[0.06em] text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Permit</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Owner(s)</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Location</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Use</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Floor limit</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Units</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Approved</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Validity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {results.map((p) => (
                  <tr key={p.permitNo} className="hover:bg-surface-2">
                    <td className="px-4 py-3.5">
                      <Link href={`/public-register/${p.permitNo}`} className="ref font-medium text-teal-700 hover:underline">
                        {p.permitNo}
                      </Link>
                      <span className="block text-xs text-muted">{p.type === "PP" ? "Planning Permit" : "Construction Permit"}</span>
                    </td>
                    <td className="max-w-[14rem] px-4 py-3.5 text-ink-strong">{p.owners.join(", ")}</td>
                    <td className="px-4 py-3.5">
                      {p.area}
                      <span className="block text-xs text-muted">
                        {p.zone} · {p.mouza}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">{p.landUse}</td>
                    <td className="ref px-4 py-3.5">{p.floorLimit}</td>
                    <td className="tabular px-4 py-3.5 text-right">{p.units}</td>
                    <td className="tabular px-4 py-3.5 text-muted">{formatDate(p.approvedOn, locale)}</td>
                    <td className="px-4 py-3.5">
                      <Badge tone={p.status === "valid" ? "success" : "neutral"}>{p.status === "valid" ? "Valid" : "Expired"}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Callout tone="info" title="What the register shows">
            Published fields follow TOR 2.14: owner names, floor limits, unit allocations and setbacks, with location and approval date. Identity numbers, tax records and contact details are never published.
          </Callout>
          <Callout tone="demo" title="Demonstration data">
            All permits are fictional. Permits issued during the demo (after a simulated fee payment) appear at the top. <Link href="/public-register?simulate=error">Preview the error state</Link>.
          </Callout>
        </div>
      </Container>
    </>
  );
}

export function PermitExtract({ permitNo }: { permitNo: string }) {
  const { locale } = useI18n();
  const hydrated = useDemoStore((s) => s.hydrated);
  const permits = usePermits();
  const p = permits.find((x) => x.permitNo === decodeURIComponent(permitNo));
  if (!hydrated) return <Container><Skeleton className="h-96" /></Container>;
  if (!p)
    return (
      <Container>
        <EmptyState icon={ShieldX} title="Permit not found in the register" body="Check the permit number. Only approved Planning and Construction Permits are published." action={<Button asChild><Link href="/public-register">Back to the register</Link></Button>} />
      </Container>
    );
  const s = p.setbacks;
  return (
    <>
      <PageIntro breadcrumbs={[{ label: "Home", href: "/" }, { label: "Public Register", href: "/public-register" }, { label: p.permitNo }]} kicker={p.type === "PP" ? "Planning Permit · public extract" : "Construction Permit · public extract"} title={p.permitNo} lead={`${p.area}, ${p.zone} · approved ${formatDate(p.approvedOn, locale)}`} />
      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <article className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm" aria-label="Permit extract">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-2 px-6 py-4">
              <div>
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted">ECPS Public Register · extract</p>
                <p className="mt-0.5 text-sm text-ink">Rajdhani Unnayan Kartripakkha (demonstration)</p>
              </div>
              <Badge tone={p.status === "valid" ? "success" : "neutral"} icon={p.status === "valid" ? CheckCircle2 : XCircle}>
                {p.status === "valid" ? `Valid until ${formatDate(p.validUntil, locale)}` : "Validity expired"}
              </Badge>
            </header>
            <div className="grid gap-8 p-6 md:grid-cols-[minmax(0,1fr)_15rem]">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
                {[
                  ["Owner(s)", p.owners.join(", ")],
                  ["Permit type", p.type === "PP" ? "Planning Permit" : "Construction Permit"],
                  ["Area · zone", `${p.area} · ${p.zone}`],
                  ["Mouza · plot", `${p.mouza} · ${p.plotRef}`],
                  ["Land use", p.landUse],
                  ["Occupancy", `Group ${p.occupancy} · ${OCCUPANCY[p.occupancy]}`],
                  ["Floor limit", p.floorLimit],
                  ["Unit allocation", `${p.units} units`],
                ].map(([k, v]) => (
                  <div key={k} className={k === "Owner(s)" ? "col-span-2" : ""}>
                    <dt className="text-xs text-muted">{k}</dt>
                    <dd className={cn("mt-0.5 font-medium text-ink-strong", k === "Floor limit" && "ref")}>{v}</dd>
                  </div>
                ))}
              </dl>
              <figure>
                <svg viewBox="0 0 200 220" className="w-full" role="img" aria-label={`Setbacks: front ${s.front} m, rear ${s.rear} m, left ${s.left} m, right ${s.right} m`}>
                  <rect x="20" y="20" width="160" height="170" fill="#f4f7fa" stroke="#253244" strokeDasharray="5 3" />
                  <rect x={20 + s.left * 14} y={20 + s.rear * 14} width={160 - (s.left + s.right) * 14} height={170 - (s.front + s.rear) * 14} fill="#dbeff2" stroke="#167d8d" strokeWidth="1.5" />
                  <g fontFamily="var(--font-plex-mono), monospace" fontSize="9" fill="#11697a" textAnchor="middle">
                    <text x="100" y="14">REAR {s.rear} m</text>
                    <text x="100" y="204">FRONT {s.front} m</text>
                    <text x="10" y="108" transform="rotate(-90 10 108)">L {s.left} m</text>
                    <text x="192" y="108" transform="rotate(90 192 108)">R {s.right} m</text>
                  </g>
                  <rect x="20" y="208" width="160" height="10" fill="#c9d4df" />
                </svg>
                <figcaption className="mt-2 text-center text-xs text-muted">Approved setbacks (schematic)</figcaption>
              </figure>
            </div>
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4 text-xs text-muted">
              <span>
                Verification code <span className="ref font-semibold text-ink-strong">{p.verificationCode}</span>
              </span>
              <Button variant="secondary" size="sm" onClick={() => window.print()} className="no-print">
                <Printer /> Print extract
              </Button>
            </footer>
          </article>
          <aside className="space-y-4">
            <div className="rounded-xl border border-success-600/25 bg-success-100/50 p-5">
              <p className="flex items-center gap-2 font-semibold text-success-700">
                <ShieldCheck className="size-5" aria-hidden /> Record found
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink">This extract matches a published record in the demonstration register. In production, verification would query the ECPS server directly (TOR 1.4).</p>
            </div>
            <Callout tone="info" icon={AlertTriangle} title="Not shown for privacy">
              NID numbers, tax returns, phone numbers and documents are never published.
            </Callout>
            <Button asChild variant="ghost">
              <Link href="/public-register">
                <ArrowLeft /> Back to the register
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
      <PageIntro breadcrumbs={[{ label: "Home", href: "/" }, { label: t("reg.verify") }]} kicker="Verification" title="Verify a permit" lead="Check that a permit printed or shared with you matches the published record. Enter the permit number and the verification code printed on it." />
      <Container>
        <div className="grid gap-10 lg:grid-cols-2">
          <form onSubmit={verify} noValidate className="space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
            <Field label="Permit number" required>
              {(a) => <Input {...a} value={no} onChange={(e) => setNo(e.target.value)} className="ref uppercase" placeholder="CP-26-Z4-01561" />}
            </Field>
            <Field label="Verification code" required hint="Printed beside the QR code on the permit.">
              {(a) => <Input {...a} value={code} onChange={(e) => setCode(e.target.value)} className="ref uppercase" placeholder="V000000X" />}
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={busy} disabled={!no || !code}>
              Verify
            </Button>
            {sample && (
              <p className="text-xs text-muted">
                Demo:{" "}
                <button type="button" className="font-medium text-teal-700 underline" onClick={() => { setNo(sample.permitNo); setCode(sample.verificationCode); }}>
                  fill a valid sample
                </button>
              </p>
            )}
          </form>
          <div aria-live="polite">
            {!result && !busy && <EmptyState icon={ShieldCheck} title="Result appears here" body="Verification compares your entry with the published register record." />}
            {busy && <Skeleton className="h-48" />}
            {result?.kind === "valid" && result.permit && (
              <div className="rounded-2xl border border-success-600/30 bg-success-100/50 p-6">
                <p className="flex items-center gap-2 font-display text-lg font-semibold text-success-700">
                  <CheckCircle2 className="size-6" aria-hidden /> Permit verified
                </p>
                <p className="mt-2 text-sm text-ink">
                  {result.permit.permitNo} · {result.permit.owners.join(", ")} · {result.permit.area} · approved {formatDate(result.permit.approvedOn, locale)} · floor limit <span className="ref">{result.permit.floorLimit}</span>
                </p>
                <Button asChild variant="secondary" size="sm" className="mt-4">
                  <Link href={`/public-register/${result.permit.permitNo}`}>Open public extract</Link>
                </Button>
                <p className="mt-4 text-xs text-muted">Demonstration verification against fictional records — not a legal confirmation.</p>
              </div>
            )}
            {result?.kind === "mismatch" && (
              <Callout tone="danger" title="The code does not match this permit">
                The permit number exists but the verification code is different. The document may have been altered — contact RAJUK before relying on it.
              </Callout>
            )}
            {result?.kind === "notfound" && (
              <Callout tone="warning" title="No permit with this number">
                Check the number. Only approved Planning and Construction Permits are published in the register.
              </Callout>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
