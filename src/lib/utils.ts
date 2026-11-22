import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** tailwind-merge aware of ECPS custom utilities (pattern backgrounds, extra type sizes, shadows). */
const twMerge = extendTailwindMerge({
  extend: {
    theme: { text: ["2xs", "display"], shadow: ["focus"] },
    classGroups: { "bg-image": ["bg-blueprint", "bg-drafting"] },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DAY = 86_400_000;
const HOUR = 3_600_000;

export function daysAgo(n: number, now = Date.now(), hour = 10): string {
  const d = new Date(now - n * DAY);
  d.setHours(hour, (n * 37) % 60, 0, 0);
  return d.toISOString();
}

export function hoursAgo(n: number, now = Date.now()): string {
  return new Date(now - n * HOUR).toISOString();
}

export function daysBetween(fromIso: string, to = Date.now()): number {
  return Math.max(0, (to - new Date(fromIso).getTime()) / DAY);
}

/** Working days between two instants (Fri/Sat treated as the Bangladesh weekend). */
export function workingDaysBetween(fromIso: string, to = Date.now()): number {
  const start = new Date(fromIso);
  const end = new Date(to);
  if (end <= start) return 0;
  let count = 0;
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  while (cursor < last) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day !== 5 && day !== 6) count++;
  }
  return count;
}

export type Locale = "en" | "bn";

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
export function toBnDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d);
}

export function formatDate(iso: string | undefined, locale: Locale = "en", opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return "—";
  const fmt = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...opts,
  });
  return fmt.format(new Date(iso));
}

export function formatDateTime(iso: string | undefined, locale: Locale = "en") {
  return formatDate(iso, locale, { hour: "2-digit", minute: "2-digit" });
}

export function formatRelative(iso: string, now = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} d ago`;
  return formatDate(iso);
}

/** Formats an amount in Bangladeshi Taka with South-Asian digit grouping. */
export function formatBDT(amount: number, locale: Locale = "en") {
  const s = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-IN", { maximumFractionDigits: 0 }).format(amount);
  return `৳ ${s}`;
}

export function formatNumber(n: number, locale: Locale = "en", digits = 0) {
  return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

export function initials(name: string) {
  return name
    .replace(/^(Md\.|Ar\.|Engr\.|Dr\.|Mrs\.|Mr\.)\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

export function pad(n: number, size = 5) {
  return String(n).padStart(size, "0");
}

export function downloadText(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob(["\ufeff" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function toCsv(rows: Array<Record<string, string | number | undefined>>): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const esc = (v: unknown) => {
    const s = v === undefined || v === null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
