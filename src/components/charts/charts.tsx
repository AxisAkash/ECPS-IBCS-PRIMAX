"use client";

import { BarChart3, Table2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

/**
 * Chart palette — validated with the dataviz six-check validator (light surface):
 * lightness band, chroma floor, CVD separation ≥ 8, normal-vision floor ≥ 15, contrast ≥ 3:1.
 * Assigned in this fixed order, never cycled. Status red is reserved for over-limit states.
 */
export const SERIES = ["#008aa8", "#b97000", "#5157c4", "#b23f7d"] as const;
export const SEQUENTIAL = ["#cfe9ee", "#8fcbd8", "#3fa4ba", "#008aa8", "#005f73"] as const;
export const STATUS = { critical: "#b8322a", warning: "#c4861f", good: "#1f7f50" } as const;
const GRID = "#e6ebf0";
const AXIS = "#7c8a9c";

export interface SeriesDef {
  key: string;
  label: string;
  color?: string;
}

interface TipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ dataKey?: unknown; name?: unknown; value?: unknown; color?: string }>;
  label?: unknown;
  format?: (v: number) => string;
}

function ChartTooltip({ active, payload, label, format }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-ink-strong">{String(label ?? "")}</p>
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={String(p.dataKey)} className="flex items-center gap-2 text-ink">
            <span className="size-2 rounded-full" style={{ background: p.color }} aria-hidden />
            <span className="text-muted">{String(p.name ?? "")}</span>
            <span className="tabular ml-auto pl-3 font-medium text-ink-strong">{format ? format(Number(p.value)) : Number(p.value).toLocaleString("en-IN")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Frame with title, legend and an accessible table alternative. */
export function ChartFrame({
  title,
  description,
  series,
  table,
  children,
  actions,
  className,
  height = 260,
}: {
  title: string;
  description?: string;
  series?: SeriesDef[];
  table: { columns: string[]; rows: Array<Array<string | number>> };
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  height?: number;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <figure className={cn("rounded-xl border border-line bg-surface shadow-xs", className)}>
      <figcaption className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="font-display text-[0.9375rem] font-semibold text-ink-strong">{title}</p>
          {description && <p className="mt-0.5 text-[0.8125rem] text-muted">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <button
            type="button"
            onClick={() => setAsTable((v) => !v)}
            aria-pressed={asTable}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-line px-2 text-xs text-muted hover:text-ink-strong"
          >
            {asTable ? <BarChart3 className="size-3.5" /> : <Table2 className="size-3.5" />}
            {asTable ? "Chart" : "Table"}
          </button>
        </div>
      </figcaption>
      <div className="px-3 pb-4 pt-3">
        {series && series.length > 1 && !asTable && (
          <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 px-2 text-xs text-muted" aria-label="Legend">
            {series.map((s, i) => (
              <li key={s.key} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ background: s.color ?? SERIES[i] }} aria-hidden />
                {s.label}
              </li>
            ))}
          </ul>
        )}
        {asTable ? (
          <div className="scrollbar-thin overflow-auto px-2" style={{ maxHeight: height + 24 }}>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-muted">
                  {table.columns.map((c, i) => (
                    <th key={c} scope="col" className={cn("py-2 font-medium", i > 0 && "text-right")}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, i) => (
                  <tr key={i} className="border-b border-line/60 last:border-0">
                    {r.map((cell, j) => (
                      <td key={j} className={cn("py-1.5", j > 0 ? "tabular text-right text-ink-strong" : "text-ink")}>
                        {typeof cell === "number" ? cell.toLocaleString("en-IN") : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ height }} aria-hidden>
            {children}
          </div>
        )}
        {!asTable && <p className="sr-only">Chart. Use the Table button for the underlying values.</p>}
      </div>
    </figure>
  );
}

const axisProps = { stroke: AXIS, fontSize: 11, tickLine: false, axisLine: false } as const;

export function VBarChart<T extends Record<string, string | number>>({
  data,
  xKey,
  series,
  stacked,
  format,
  colorFor,
}: {
  data: T[];
  xKey: keyof T & string;
  series: SeriesDef[];
  stacked?: boolean;
  format?: (v: number) => string;
  colorFor?: (row: T, seriesKey: string) => string | undefined;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey={xKey as never} {...axisProps} interval={0} tick={{ fill: AXIS, fontSize: 11 }} />
        <YAxis {...axisProps} width={44} allowDecimals={false} tickFormatter={(v: number) => (format ? format(v) : v.toLocaleString("en-IN"))} />
        <Tooltip cursor={{ fill: "rgb(20 38 61 / 0.04)" }} content={(p) => <ChartTooltip active={p.active} payload={p.payload as TipProps["payload"]} label={p.label} format={format} />} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            stackId={stacked ? "a" : undefined}
            fill={s.color ?? SERIES[i]}
            stroke="#fff"
            strokeWidth={stacked ? 1 : 0}
            radius={stacked ? (i === series.length - 1 ? [4, 4, 0, 0] : 0) : [4, 4, 0, 0]}
            maxBarSize={36}
            shape={
              colorFor
                ? (props: unknown) => {
                    const p = props as { x: number; y: number; width: number; height: number; payload: T };
                    const c = colorFor(p.payload, s.key) ?? s.color ?? SERIES[i];
                    return <rect x={p.x} y={p.y} width={p.width} height={Math.max(0, p.height)} rx={3} fill={c} />;
                  }
                : undefined
            }
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function HBarChart<T extends Record<string, string | number>>({ data, yKey, series, format, stacked }: { data: T[]; yKey: keyof T & string; series: SeriesDef[]; format?: (v: number) => string; stacked?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis type="number" {...axisProps} allowDecimals={false} tickFormatter={(v: number) => (format ? format(v) : v.toLocaleString("en-IN"))} />
        <YAxis type="category" dataKey={yKey as never} {...axisProps} width={128} interval={0} tick={{ fill: "#253244", fontSize: 11.5 }} />
        <Tooltip cursor={{ fill: "rgb(20 38 61 / 0.04)" }} content={(p) => <ChartTooltip active={p.active} payload={p.payload as TipProps["payload"]} label={p.label} format={format} />} />
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} stackId={stacked ? "a" : undefined} fill={s.color ?? SERIES[i]} stroke="#fff" strokeWidth={stacked ? 1 : 0} radius={stacked ? (i === series.length - 1 ? [0, 4, 4, 0] : 0) : [0, 4, 4, 0]} maxBarSize={18} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendChart<T extends Record<string, string | number>>({ data, xKey, series, format }: { data: T[]; xKey: keyof T & string; series: SeriesDef[]; format?: (v: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey={xKey as never} {...axisProps} tick={{ fill: AXIS, fontSize: 11 }} />
        <YAxis {...axisProps} width={48} tickFormatter={(v: number) => (format ? format(v) : v.toLocaleString("en-IN"))} />
        <Tooltip cursor={{ stroke: "#9aa8b8", strokeDasharray: "3 3" }} content={(p) => <ChartTooltip active={p.active} payload={p.payload as TipProps["payload"]} label={p.label} format={format} />} />
        {series.map((s, i) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color ?? SERIES[i]} strokeWidth={2} dot={false} activeDot={{ r: 4.5, stroke: "#fff", strokeWidth: 2 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
