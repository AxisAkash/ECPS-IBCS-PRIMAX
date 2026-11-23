"use client";

import { Crosshair, Layers, MapPin } from "lucide-react";
import { useId, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { SimulatedTag } from "@/components/ui/feedback";

/**
 * SIMULATED plot map.
 * TOR 2.3: Google Maps integration is enabled only if RAJUK provides a key. Until then this
 * vector stand-in lets applicants and inspectors place / confirm a plot position and see an
 * illustrative DAP land-use overlay. Coordinates map linearly to a ~600 m window.
 */
interface Props {
  lat: number;
  lng: number;
  onChange?: (pos: { lat: number; lng: number }) => void;
  device?: { lat: number; lng: number; accuracyM: number };
  className?: string;
  height?: number;
  label?: string;
  showDap?: boolean;
}

const SPAN_LAT = 0.0054; // ≈ 600 m
const SPAN_LNG = 0.0058;
const ZONES = [
  { d: "M0 0 H260 V150 H0 Z", fill: "var(--map-res)", label: "Residential (urban)" },
  { d: "M260 0 H560 V110 H260 Z", fill: "var(--map-com)", label: "Commercial" },
  { d: "M0 150 H200 V360 H0 Z", fill: "var(--map-open)", label: "Open space" },
  { d: "M200 150 H560 V360 H200 Z", fill: "var(--map-res)", label: "Residential (urban)" },
];

export function SiteMap({ lat, lng, onChange, device, className, height = 320, label = "Plot location", showDap: showDapInitial = true }: Props) {
  const { t } = useI18n();
  const [center] = useState({ lat, lng });
  const [showDap, setShowDap] = useState(showDapInitial);
  const titleId = useId();
  const toXY = (p: { lat: number; lng: number }) => ({
    x: 280 + ((p.lng - center.lng) / SPAN_LNG) * 560,
    y: 180 - ((p.lat - center.lat) / SPAN_LAT) * 360,
  });
  const pin = toXY({ lat, lng });
  const dev = device ? toXY(device) : undefined;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 560;
    const y = ((e.clientY - rect.top) / rect.height) * 360;
    onChange({ lat: +(center.lat + ((180 - y) / 360) * SPAN_LAT).toFixed(6), lng: +(center.lng + ((x - 280) / 560) * SPAN_LNG).toFixed(6) });
  };

  const nudge = (dLat: number, dLng: number) => onChange?.({ lat: +(lat + dLat).toFixed(6), lng: +(lng + dLng).toFixed(6) });

  return (
    <figure className={cn("overflow-hidden rounded-lg border border-line bg-surface", className)} aria-labelledby={titleId}>
      <div className="relative" style={{ height }}>
        <svg
          viewBox="0 0 560 360"
          preserveAspectRatio="xMidYMid slice"
          className={cn("size-full", onChange && "cursor-crosshair")}
          onClick={handleClick}
          role="img"
          aria-label={`${label}: latitude ${lat.toFixed(5)}, longitude ${lng.toFixed(5)}${onChange ? ". Click to move the pin, or use the arrow buttons." : ""}`}
        >
          <rect width="560" height="360" fill="var(--map-ground)" />
          {showDap && ZONES.map((z, i) => <path key={i} d={z.d} fill={z.fill} opacity="0.75" />)}
          {/* Blocks */}
          {Array.from({ length: 7 }).map((_, c) =>
            Array.from({ length: 5 }).map((_, r) => (
              <rect key={`${c}-${r}`} x={14 + c * 80} y={14 + r * 72} width="64" height="56" rx="2" fill="var(--map-block)" fillOpacity={showDap ? 0.55 : 0.9} stroke="var(--map-block-line)" strokeWidth="0.6" />
            )),
          )}
          {/* Plot subdivisions */}
          {Array.from({ length: 7 }).map((_, c) =>
            Array.from({ length: 5 }).map((_, r) =>
              [1, 2, 3].map((k) => <line key={`${c}-${r}-${k}`} x1={14 + c * 80 + k * 16} x2={14 + c * 80 + k * 16} y1={14 + r * 72} y2={70 + r * 72} stroke="var(--map-hatch)" strokeWidth="0.5" />),
            ),
          )}
          {/* Roads */}
          <path d="M0 140 C 160 120, 360 160, 560 132" stroke="var(--map-road)" strokeWidth="14" fill="none" />
          <path d="M0 140 C 160 120, 360 160, 560 132" stroke="var(--map-road-line)" strokeWidth="0.6" fill="none" strokeDasharray="8 6" />
          <path d="M318 0 L 302 360" stroke="var(--map-road)" strokeWidth="11" />
          <text x="20" y="128" fontSize="8" fill="var(--map-label)" fontFamily="var(--font-plex-mono), monospace" letterSpacing="1.5">
            ROAD 11 (ILLUSTRATIVE)
          </text>
          {/* Device position (inspector) */}
          {dev && (
            <g>
              <circle cx={dev.x} cy={dev.y} r={Math.max(8, device!.accuracyM * 1.2)} fill="#167d8d" fillOpacity="0.12" stroke="#167d8d" strokeOpacity="0.4" />
              <circle cx={dev.x} cy={dev.y} r="4.5" fill="#167d8d" stroke="var(--map-halo)" strokeWidth="2" />
            </g>
          )}
          {/* Plot pin */}
          <g transform={`translate(${pin.x} ${pin.y})`}>
            <rect x="-14" y="-11" width="28" height="22" fill="#e7a23b" fillOpacity="0.22" stroke="#c4861f" strokeWidth="1.2" />
            <path d="M0 -6 C -7 -6 -10 -1 -10 3 C -10 10 0 18 0 18 C 0 18 10 10 10 3 C 10 -1 7 -6 0 -6 Z" transform="translate(0 -22)" fill="var(--map-pin)" />
            <circle cx="0" cy="-19" r="3.2" fill="#e7a23b" />
          </g>
        </svg>

        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
          <SimulatedTag className="bg-surface/90">{t("map.simulated")}</SimulatedTag>
        </div>
        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setShowDap((v) => !v)}
            aria-pressed={showDap}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface/95 px-2 py-1 text-xs font-medium text-ink shadow-sm hover:bg-surface"
          >
            <Layers className="size-3.5" /> {t("map.dap")}
          </button>
        </div>
        {onChange && (
          <div className="absolute bottom-3 right-3 grid grid-cols-3 gap-0.5 rounded-md border border-line bg-surface/95 p-0.5 shadow-sm">
            <span />
            <NudgeButton label={t("map.north")} onClick={() => nudge(0.00005, 0)}>↑</NudgeButton>
            <span />
            <NudgeButton label={t("map.west")} onClick={() => nudge(0, -0.00005)}>←</NudgeButton>
            <span className="grid place-items-center text-teal-700">
              <Crosshair className="size-3.5" aria-hidden />
            </span>
            <NudgeButton label={t("map.east")} onClick={() => nudge(0, 0.00005)}>→</NudgeButton>
            <span />
            <NudgeButton label={t("map.south")} onClick={() => nudge(-0.00005, 0)}>↓</NudgeButton>
            <span />
          </div>
        )}
      </div>
      <figcaption id={titleId} className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-surface-2 px-3 py-2 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3.5 text-amber-700" aria-hidden />
          <span className="ref text-ink">
            {lat.toFixed(6)}° N, {lng.toFixed(6)}° E
          </span>
        </span>
        <span>{t("map.keyNote")}</span>
      </figcaption>
    </figure>
  );
}

function NudgeButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="grid size-6 place-items-center rounded text-xs text-ink hover:bg-surface-3">
      {children}
    </button>
  );
}
