/**
 * Original cadastral composition for the landing hero: a fictional Dhaka-like urban block plan
 * drawn as survey linework, with one plot highlighted, dimensioned and pinned.
 * Generated deterministically so it renders identically on server and client.
 */

type Rect = { x: number; y: number; w: number; h: number; built: boolean };

function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const H_ROADS = [
  { y: 60, w: 14 },
  { y: 250, w: 26 },
  { y: 440, w: 14 },
  { y: 620, w: 14 },
];
const V_ROADS = [
  { x: 20, w: 14 },
  { x: 250, w: 16 },
  { x: 480, w: 28 },
  { x: 700, w: 14 },
];

const HIGHLIGHT = { bx: 2, by: 1, row: 1, idx: 1 };

function buildPlots() {
  const rand = lcg(20261122);
  const plots: Rect[] = [];
  let highlight: Rect | undefined;
  for (let by = 0; by < H_ROADS.length - 1; by++) {
    for (let bx = 0; bx < V_ROADS.length - 1; bx++) {
      const top = H_ROADS[by]!.y + H_ROADS[by]!.w / 2;
      const bottom = H_ROADS[by + 1]!.y - H_ROADS[by + 1]!.w / 2;
      const left = V_ROADS[bx]!.x + V_ROADS[bx]!.w / 2;
      const right = V_ROADS[bx + 1]!.x - V_ROADS[bx + 1]!.w / 2;
      if (bx === 0 && by === 2) continue; // lake block
      const mid = top + (bottom - top) / 2;
      for (let row = 0; row < 2; row++) {
        const y0 = row === 0 ? top : mid;
        const y1 = row === 0 ? mid : bottom;
        let x = left;
        let idx = 0;
        while (x < right - 18) {
          const isHighlight = bx === HIGHLIGHT.bx && by === HIGHLIGHT.by && row === HIGHLIGHT.row && idx === HIGHLIGHT.idx;
          let w = isHighlight ? 56 : 30 + Math.floor(rand() * 30);
          if (right - (x + w) < 26) w = right - x;
          const r: Rect = { x, y: y0, w, h: y1 - y0, built: rand() > 0.35 };
          if (isHighlight) highlight = r;
          else plots.push(r);
          x += w;
          idx++;
        }
      }
    }
  }
  return { plots, highlight: highlight! };
}

const { plots, highlight } = buildPlots();

export function HeroPlan({ className }: { className?: string }) {
  const hl = highlight;
  const inset = 7;
  const fp = { x: hl.x + inset, y: hl.y + inset + 4, w: hl.w - inset * 2, h: hl.h - inset * 2 - 4 };
  const cx = hl.x + hl.w / 2;
  const cy = hl.y + hl.h / 2;
  return (
    <svg viewBox="0 0 720 640" className={className} role="img" aria-labelledby="hero-plan-title">
      <title id="hero-plan-title">Illustrative cadastral plan with a highlighted plot, dimensions and GPS position</title>
      <defs>
        <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="white" strokeOpacity="0.07" strokeWidth="1" />
        </pattern>
        <pattern id="hatch-amber" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="#e7a23b" strokeOpacity="0.35" strokeWidth="1" />
        </pattern>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e7a23b" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#e7a23b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#14263d" stopOpacity="1" />
          <stop offset="0.18" stopColor="#14263d" stopOpacity="0" />
        </linearGradient>
        <clipPath id="frame">
          <rect x="0" y="0" width="720" height="640" />
        </clipPath>
      </defs>

      <g clipPath="url(#frame)">
        <g transform="rotate(-9 360 320) translate(-10 -10) scale(1.04)">
          {/* Lake */}
          <path
            d="M24 462 C 70 470, 112 498, 142 536 S 204 598, 262 610 L 266 628 C 196 622, 146 588, 116 552 S 62 492, 20 482 Z"
            fill="#2196a8"
            fillOpacity="0.13"
            stroke="#7cc6d1"
            strokeOpacity="0.32"
            strokeWidth="1"
          />
          <path d="M40 476 C 90 490, 120 520, 140 548 S 200 604, 250 618" stroke="#7cc6d1" strokeOpacity="0.18" fill="none" strokeDasharray="2 5" />

          {/* Plots */}
          {plots.map((p, i) => (
            <g key={i}>
              <rect x={p.x} y={p.y} width={p.w} height={p.h} fill="none" stroke="white" strokeOpacity="0.13" strokeWidth="0.8" />
              {p.built && <rect x={p.x + 4} y={p.y + 4} width={Math.max(4, p.w - 8)} height={Math.max(4, p.h - 8)} fill="url(#hatch)" stroke="white" strokeOpacity="0.06" strokeWidth="0.6" />}
            </g>
          ))}

          {/* Road centre lines */}
          {H_ROADS.map((r) => (
            <line key={`h${r.y}`} x1="-120" x2="860" y1={r.y} y2={r.y} stroke="white" strokeOpacity={r.w > 20 ? 0.22 : 0.1} strokeDasharray={r.w > 20 ? "14 10" : "4 8"} strokeWidth="0.8" />
          ))}
          {V_ROADS.map((r) => (
            <line key={`v${r.x}`} y1="-120" y2="760" x1={r.x} x2={r.x} stroke="white" strokeOpacity={r.w > 20 ? 0.22 : 0.1} strokeDasharray={r.w > 20 ? "14 10" : "4 8"} strokeWidth="0.8" />
          ))}
          <text x="560" y="246" fill="white" fillOpacity="0.32" fontSize="8.5" fontFamily="var(--font-plex-mono), monospace" letterSpacing="2.5">
            AVENUE · 18 M ROW
          </text>
          <text x="476" y="560" fill="white" fillOpacity="0.28" fontSize="8" fontFamily="var(--font-plex-mono), monospace" letterSpacing="2" transform="rotate(-90 476 560)">
            ROAD 07 · 9 M
          </text>

          {/* Highlighted plot */}
          <circle cx={cx} cy={cy} r="110" fill="url(#glow)" />
          <rect x={hl.x} y={hl.y} width={hl.w} height={hl.h} fill="url(#hatch-amber)" />
          <rect className="draw-line" style={{ ["--dash" as string]: 520 }} x={hl.x} y={hl.y} width={hl.w} height={hl.h} fill="#e7a23b" fillOpacity="0.07" stroke="#e7a23b" strokeWidth="1.6" />
          {/* Setback line */}
          <rect x={fp.x} y={fp.y} width={fp.w} height={fp.h} fill="none" stroke="#f6d9a6" strokeOpacity="0.85" strokeWidth="0.9" strokeDasharray="3 3" />
          <rect x={fp.x + 3} y={fp.y + 3} width={fp.w - 6} height={fp.h - 6} fill="#e7a23b" fillOpacity="0.16" />

          {/* Dimensions */}
          <g stroke="#f6d9a6" strokeOpacity="0.85" strokeWidth="0.8" fill="none">
            <line x1={hl.x} y1={hl.y - 14} x2={hl.x + hl.w} y2={hl.y - 14} />
            <line x1={hl.x} y1={hl.y - 19} x2={hl.x} y2={hl.y - 9} />
            <line x1={hl.x + hl.w} y1={hl.y - 19} x2={hl.x + hl.w} y2={hl.y - 9} />
            <line x1={hl.x + hl.w + 14} y1={hl.y} x2={hl.x + hl.w + 14} y2={hl.y + hl.h} />
            <line x1={hl.x + hl.w + 9} y1={hl.y} x2={hl.x + hl.w + 19} y2={hl.y} />
            <line x1={hl.x + hl.w + 9} y1={hl.y + hl.h} x2={hl.x + hl.w + 19} y2={hl.y + hl.h} />
          </g>
          <text x={cx} y={hl.y - 19} textAnchor="middle" fill="#f6d9a6" fontSize="9" fontFamily="var(--font-plex-mono), monospace">
            18.3 m
          </text>
          <text x={hl.x + hl.w + 24} y={cy} fill="#f6d9a6" fontSize="9" fontFamily="var(--font-plex-mono), monospace" transform={`rotate(90 ${hl.x + hl.w + 24} ${cy})`} textAnchor="middle">
            21.0 m
          </text>
        </g>

        {/* Left fade to give the headline a calm field */}
        <rect x="0" y="0" width="720" height="640" fill="url(#fade)" />
      </g>

      {/* Frame furniture (unrotated) */}
      <g fontFamily="var(--font-plex-mono), monospace" fill="white" fillOpacity="0.4" fontSize="9" letterSpacing="1.5">
        <text x="696" y="26" textAnchor="end">23°45′N</text>
        <text x="696" y="626" textAnchor="end">90°22′E</text>
        {[120, 240, 360, 480, 600].map((x) => (
          <line key={x} x1={x} x2={x} y1="0" y2="8" stroke="white" strokeOpacity="0.25" />
        ))}
        {[120, 240, 360, 480].map((y) => (
          <line key={y} y1={y} y2={y} x1="712" x2="720" stroke="white" strokeOpacity="0.25" />
        ))}
      </g>
      {/* North arrow & scale */}
      <g transform="translate(640 520)">
        <g transform="rotate(-9)">
          <path d="M0 -26 L7 6 L0 0 L-7 6 Z" fill="white" fillOpacity="0.75" />
          <path d="M0 -26 L0 0 L-7 6 Z" fill="white" fillOpacity="0.35" />
          <text y="-32" textAnchor="middle" fill="white" fillOpacity="0.7" fontSize="10" fontFamily="var(--font-plex-mono), monospace">N</text>
        </g>
      </g>
      <g transform="translate(560 590)" fontFamily="var(--font-plex-mono), monospace" fontSize="8" fill="white" fillOpacity="0.45">
        <rect x="0" y="0" width="30" height="4" fill="white" fillOpacity="0.6" />
        <rect x="30" y="0" width="30" height="4" fill="none" stroke="white" strokeOpacity="0.6" strokeWidth="0.8" />
        <rect x="60" y="0" width="30" height="4" fill="white" fillOpacity="0.6" />
        <text x="0" y="16">0</text>
        <text x="90" y="16" textAnchor="end">50 m</text>
      </g>
    </svg>
  );
}
