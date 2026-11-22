import type { DrawingSheetKind } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export interface SheetSignature {
  slot: number;
  name: string;
  designation: string;
  date: string;
  serial: string;
}

interface Props {
  kind: DrawingSheetKind;
  title: string;
  page: number;
  total: number;
  appRef: string;
  project: string;
  version: number;
  storeys?: number;
  signatures?: SheetSignature[];
  previewSlot?: number;
  previewName?: string;
  signable?: boolean;
  className?: string;
}

const INK = "#253244";
const LIGHT = "#9aa8b8";
const MONO = "var(--font-plex-mono), monospace";

/**
 * Renders a fictional architectural drawing sheet as SVG. Used by the document viewer and the
 * digital-signing workspace to show page-accurate signature placement in the title block.
 */
export function DrawingSheet({ kind, title, page, total, appRef, project, version, storeys = 7, signatures = [], previewSlot, previewName, signable = true, className }: Props) {
  return (
    <svg viewBox="0 0 420 297" className={cn("h-auto w-full bg-white", className)} role="img" aria-label={`${title}, sheet ${page} of ${total}, version ${version}`}>
      {/* Sheet frame */}
      <rect x="0" y="0" width="420" height="297" fill="#fff" />
      <rect x="8" y="8" width="404" height="281" fill="none" stroke={INK} strokeWidth="0.8" />
      <rect x="10.5" y="10.5" width="399" height="276" fill="none" stroke={INK} strokeWidth="0.3" />

      {/* Auto-stamped file number (TOR 1.4) */}
      <g transform="translate(18 18)">
        <rect width="104" height="16" fill="none" stroke="#167d8d" strokeWidth="0.6" />
        <text x="5" y="7" fontSize="4" fill="#167d8d" fontFamily={MONO} letterSpacing="0.4">FILE NO. (AUTO-STAMPED)</text>
        <text x="5" y="13" fontSize="5.4" fill="#0d5965" fontFamily={MONO} fontWeight="600">{appRef}</text>
      </g>

      {/* Drawing field */}
      <g transform="translate(18 40)">{renderDrawing(kind, storeys)}</g>

      {/* Title block */}
      <g transform="translate(316 10.5)">
        <rect width="93.5" height="276" fill="#fbfcfd" stroke={INK} strokeWidth="0.3" />
        <text x="6" y="12" fontSize="4" fill={LIGHT} fontFamily={MONO} letterSpacing="0.5">PROJECT</text>
        <foreignObject x="6" y="14" width="82" height="22">
          <div style={{ fontSize: "5.2px", lineHeight: 1.3, color: INK, fontFamily: "var(--font-inter), sans-serif", fontWeight: 600 }}>{project}</div>
        </foreignObject>
        <line x1="0" x2="93.5" y1="40" y2="40" stroke={INK} strokeWidth="0.3" />
        <text x="6" y="49" fontSize="4" fill={LIGHT} fontFamily={MONO} letterSpacing="0.5">SHEET TITLE</text>
        <text x="6" y="57" fontSize="6" fill={INK} fontFamily="var(--font-manrope), sans-serif" fontWeight="700">{title}</text>
        <line x1="0" x2="93.5" y1="63" y2="63" stroke={INK} strokeWidth="0.3" />
        <g fontFamily={MONO} fontSize="4" fill={LIGHT}>
          <text x="6" y="71">SHEET</text>
          <text x="36" y="71">VERSION</text>
          <text x="66" y="71">SCALE</text>
        </g>
        <g fontFamily={MONO} fontSize="5.4" fill={INK} fontWeight="600">
          <text x="6" y="79">{String(page).padStart(2, "0")} / {String(total).padStart(2, "0")}</text>
          <text x="36" y="79">v{version}</text>
          <text x="66" y="79">{kind === "far" ? "—" : kind === "site" ? "1:200" : "1:100"}</text>
        </g>
        <line x1="0" x2="93.5" y1="85" y2="85" stroke={INK} strokeWidth="0.3" />
        <text x="6" y="94" fontSize="4" fill={LIGHT} fontFamily={MONO} letterSpacing="0.5">APPROVAL SIGNATURES</text>
        {[0, 1, 2].map((i) => {
          const slot = i + 1;
          const y = 99 + i * 44;
          const sig = signatures.find((s) => s.slot === slot);
          const preview = previewSlot === slot && !sig && signable;
          return (
            <g key={slot} transform={`translate(6 ${y})`}>
              <rect width="81.5" height="40" fill={preview ? "#fdf7ec" : "none"} stroke={preview ? "#e7a23b" : "#c9d4df"} strokeWidth={preview ? 0.8 : 0.4} strokeDasharray={sig ? undefined : "2 1.5"} />
              <text x="3" y="5.5" fontSize="3.4" fill={LIGHT} fontFamily={MONO}>SLOT {slot}</text>
              {sig && <SignatureStamp sig={sig} />}
              {preview && (
                <g>
                  <text x="40.75" y="20" textAnchor="middle" fontSize="4.4" fill="#8a5a10" fontFamily="var(--font-inter), sans-serif" fontWeight="600">Signature will be placed here</text>
                  <text x="40.75" y="27" textAnchor="middle" fontSize="3.6" fill="#8a5a10" fontFamily={MONO}>{previewName}</text>
                </g>
              )}
            </g>
          );
        })}
        {!signable && (
          <g transform="translate(6 99)">
            <rect width="81.5" height="128" fill="#f4f7fa" opacity="0.92" />
            <foreignObject x="4" y="44" width="74" height="44">
              <div style={{ fontSize: "4.4px", lineHeight: 1.4, color: "#5a6a7e", textAlign: "center", fontFamily: "var(--font-inter), sans-serif" }}>
                Calculation annex — excluded from drawing-signature placement by configured rule.
              </div>
            </foreignObject>
          </g>
        )}
        <line x1="0" x2="93.5" y1="236" y2="236" stroke={INK} strokeWidth="0.3" />
        <text x="6" y="245" fontSize="3.8" fill={LIGHT} fontFamily={MONO}>AUTHORITY</text>
        <text x="6" y="252" fontSize="4.6" fill={INK} fontFamily="var(--font-inter), sans-serif" fontWeight="600">RAJUK · Development Control</text>
        <text x="6" y="264" fontSize="3.6" fill={LIGHT} fontFamily={MONO}>FICTIONAL DEMONSTRATION DRAWING</text>
        <text x="6" y="270" fontSize="3.6" fill={LIGHT} fontFamily={MONO}>NOT FOR CONSTRUCTION</text>
      </g>
    </svg>
  );
}

function SignatureStamp({ sig }: { sig: SheetSignature }) {
  return (
    <g>
      <path d="M8 24 C 14 12, 20 30, 27 17 S 38 26, 45 15 S 56 25, 62 18" fill="none" stroke="#11697a" strokeWidth="0.9" strokeLinecap="round" />
      <text x="3" y="31" fontSize="3.8" fill="#0d5965" fontFamily="var(--font-inter), sans-serif" fontWeight="600">{sig.name}</text>
      <text x="3" y="35.5" fontSize="3" fill="#5a6a7e" fontFamily={MONO}>{sig.designation} · {sig.date}</text>
      <rect x="57" y="27" width="22" height="10" rx="1" fill="none" stroke="#11697a" strokeWidth="0.5" />
      <text x="68" y="31" textAnchor="middle" fontSize="2.6" fill="#11697a" fontFamily={MONO}>SIMULATED</text>
      <text x="68" y="35" textAnchor="middle" fontSize="2.6" fill="#11697a" fontFamily={MONO}>{sig.serial.slice(-4)}</text>
    </g>
  );
}

function renderDrawing(kind: DrawingSheetKind, storeys: number) {
  const s = { stroke: INK, fill: "none" } as const;
  switch (kind) {
    case "site":
      return (
        <g>
          <rect x="30" y="20" width="210" height="170" {...s} strokeWidth="1.2" strokeDasharray="6 2 1 2" />
          <rect x="52" y="36" width="166" height="132" fill="#eef2f6" stroke={INK} strokeWidth="1" />
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1={52 + i * 14} y1="36" x2={52 + i * 14 - 20} y2="168" stroke={LIGHT} strokeWidth="0.25" />
          ))}
          <rect x="0" y="198" width="290" height="24" fill="#f4f7fa" stroke={LIGHT} strokeWidth="0.4" />
          <line x1="0" x2="290" y1="210" y2="210" stroke={LIGHT} strokeDasharray="6 4" strokeWidth="0.5" />
          <text x="145" y="218" textAnchor="middle" fontSize="5" fill={LIGHT} fontFamily={MONO}>EXISTING ROAD · 7.5 M</text>
          <g stroke="#167d8d" strokeWidth="0.5" fill="#167d8d" fontFamily={MONO} fontSize="4.2">
            <line x1="135" x2="135" y1="168" y2="190" />
            <text x="138" y="182" stroke="none">FRONT SETBACK 2.5 M</text>
            <line x1="218" x2="240" y1="100" y2="100" />
            <text x="221" y="96" stroke="none">1.5 M</text>
          </g>
          <text x="135" y="104" textAnchor="middle" fontSize="7" fill={INK} fontFamily="var(--font-manrope), sans-serif" fontWeight="700">PROPOSED BUILDING</text>
          <text x="135" y="113" textAnchor="middle" fontSize="4.6" fill={LIGHT} fontFamily={MONO}>{`G+${storeys - 1} · RESIDENTIAL (A)`}</text>
          <g transform="translate(268 34)">
            <path d="M0 -14 L5 8 L0 3 L-5 8 Z" fill={INK} />
            <text y="-17" textAnchor="middle" fontSize="6" fontFamily={MONO} fill={INK}>N</text>
          </g>
        </g>
      );
    case "ground":
    case "typical": {
      const ground = kind === "ground";
      return (
        <g>
          <rect x="20" y="10" width="250" height="200" {...s} strokeWidth="2.2" />
          <line x1="145" y1="10" x2="145" y2="210" stroke={INK} strokeWidth="1.2" />
          {ground ? (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <g key={i}>
                  <rect x={28 + (i % 3) * 38} y={i < 3 ? 22 : 120} width="32" height="70" fill="none" stroke={LIGHT} strokeWidth="0.6" />
                  <text x={44 + (i % 3) * 38} y={i < 3 ? 60 : 158} textAnchor="middle" fontSize="4.2" fill={LIGHT} fontFamily={MONO}>P{i + 1}</text>
                </g>
              ))}
              <text x="82" y="112" textAnchor="middle" fontSize="5" fill={INK} fontFamily={MONO}>CAR PARKING</text>
              <rect x="160" y="22" width="96" height="60" fill="#eef2f6" stroke={INK} strokeWidth="0.6" />
              <text x="208" y="55" textAnchor="middle" fontSize="5" fill={INK} fontFamily={MONO}>LOBBY / GUARD</text>
            </>
          ) : (
            <>
              {[0, 1].map((u) => (
                <g key={u} transform={`translate(${u === 0 ? 20 : 145} 10)`}>
                  <line x1="0" x2="125" y1="80" y2="80" stroke={INK} strokeWidth="0.9" />
                  <line x1="62" x2="62" y1="0" y2="80" stroke={INK} strokeWidth="0.9" />
                  <line x1="0" x2="125" y1="140" y2="140" stroke={INK} strokeWidth="0.9" />
                  <text x="31" y="44" textAnchor="middle" fontSize="4.6" fill={LIGHT} fontFamily={MONO}>BED</text>
                  <text x="93" y="44" textAnchor="middle" fontSize="4.6" fill={LIGHT} fontFamily={MONO}>BED</text>
                  <text x="62" y="114" textAnchor="middle" fontSize="4.6" fill={LIGHT} fontFamily={MONO}>LIVING / DINING</text>
                  <text x="62" y="174" textAnchor="middle" fontSize="4.6" fill={LIGHT} fontFamily={MONO}>{`UNIT ${u === 0 ? "A" : "B"}`}</text>
                </g>
              ))}
            </>
          )}
          <g transform="translate(128 150)">
            <rect width="34" height="56" fill="#fff" stroke={INK} strokeWidth="0.8" />
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={i} x1="0" x2="34" y1={6 + i * 5.5} y2={6 + i * 5.5} stroke={INK} strokeWidth="0.3" />
            ))}
            <text x="17" y="-3" textAnchor="middle" fontSize="4" fill={INK} fontFamily={MONO}>STAIR · LIFT</text>
          </g>
          {[20, 82, 145, 207, 270].map((x) => (
            <g key={x}>
              <circle cx={x} cy="228" r="4" fill="none" stroke={LIGHT} strokeWidth="0.5" />
              <line x1={x} x2={x} y1="210" y2="224" stroke={LIGHT} strokeWidth="0.3" strokeDasharray="2 1" />
            </g>
          ))}
        </g>
      );
    }
    case "elevation":
    case "section": {
      const n = Math.min(storeys, 12);
      const h = 200 / (n + 1);
      return (
        <g>
          <line x1="0" x2="290" y1="225" y2="225" stroke={INK} strokeWidth="1.4" />
          {kind === "section" && <rect x="50" y="225" width="190" height="10" fill="#eef2f6" stroke={INK} strokeWidth="0.5" />}
          <rect x="60" y={225 - n * h} width="170" height={n * h} {...s} strokeWidth="1.2" />
          {Array.from({ length: n }).map((_, i) => (
            <g key={i}>
              <line x1="60" x2="230" y1={225 - i * h} y2={225 - i * h} stroke={INK} strokeWidth={kind === "section" ? 1.4 : 0.4} />
              {kind === "elevation" &&
                [0, 1, 2, 3].map((w) => <rect key={w} x={72 + w * 40} y={225 - (i + 1) * h + h * 0.25} width="26" height={h * 0.5} fill="#eef2f6" stroke={LIGHT} strokeWidth="0.5" />)}
              <text x="238" y={225 - i * h - h / 2 + 2} fontSize="4" fill={LIGHT} fontFamily={MONO}>{i === 0 ? "GF" : `L${i}`}</text>
            </g>
          ))}
          {kind === "section" && (
            <path d={`M120 225 ${Array.from({ length: n }).map((_, i) => `L150 ${225 - (i + 0.5) * h} L120 ${225 - (i + 1) * h}`).join(" ")}`} fill="none" stroke={INK} strokeWidth="0.5" />
          )}
          <line x1="30" x2="30" y1={225 - n * h} y2="225" stroke="#167d8d" strokeWidth="0.5" />
          <text x="26" y={225 - (n * h) / 2} fontSize="4.4" fill="#167d8d" fontFamily={MONO} transform={`rotate(-90 26 ${225 - (n * h) / 2})`} textAnchor="middle">
            {`${(n * 3.2 + 1.5).toFixed(1)} M`}
          </text>
        </g>
      );
    }
    case "far":
      return (
        <g fontFamily={MONO} fontSize="5" fill={INK}>
          <text x="0" y="8" fontSize="7" fontFamily="var(--font-manrope), sans-serif" fontWeight="700">FAR calculation (illustrative)</text>
          {[
            ["Plot area", "402 m²"],
            ["Permitted FAR (configured)", "4.0"],
            ["Permissible floor area", "1,608 m²"],
            ["Proposed total floor area", "1,447 m²"],
            ["Proposed FAR", "3.60"],
            ["Ground coverage", "60.0 %"],
            ["Result", "Within limit"],
          ].map(([k, v], i) => (
            <g key={k} transform={`translate(0 ${24 + i * 22})`}>
              <rect width="280" height="18" fill={i % 2 ? "#fff" : "#f4f7fa"} stroke="#dfe6ed" strokeWidth="0.4" />
              <text x="6" y="12">{k}</text>
              <text x="272" y="12" textAnchor="end" fontWeight="600" fill={i === 6 ? "#1f7f50" : INK}>{v}</text>
            </g>
          ))}
        </g>
      );
  }
}
