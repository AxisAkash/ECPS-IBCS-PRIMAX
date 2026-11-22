import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * ECPS mark — an original symbol (not the RAJUK emblem): a surveyed plot boundary,
 * a building footprint set back within it, and an amber survey point.
 */
export function LogoMark({ className, onDark }: { className?: string; onDark?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect x="1.5" y="1.5" width="29" height="29" rx="6" fill={onDark ? "#1b3250" : "#14263d"} />
      <rect x="6.5" y="6.5" width="19" height="19" rx="1" fill="none" stroke={onDark ? "#7cc6d1" : "#2196a8"} strokeWidth="1.2" strokeDasharray="2.2 1.6" />
      <rect x="9.5" y="12" width="10.5" height="10.5" fill="#ffffff" />
      <path d="M9.5 15.5h10.5M13 12v10.5" stroke="#14263d" strokeWidth="0.9" opacity="0.35" />
      <circle cx="25.5" cy="6.5" r="2.2" fill="#e7a23b" />
    </svg>
  );
}

export function Logo({ onDark, compact, href = "/", subtitle }: { onDark?: boolean; compact?: boolean; href?: string; subtitle?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5 rounded-md" aria-label="ECPS home">
      <LogoMark onDark={onDark} />
      {!compact && (
        <span className="leading-none">
          <span className={cn("block font-display text-[1.0625rem] font-extrabold tracking-[-0.01em]", onDark ? "text-white" : "text-navy-900")}>ECPS</span>
          <span className={cn("mt-1 block font-mono text-[0.5625rem] uppercase tracking-[0.16em]", onDark ? "text-on-dark-muted" : "text-muted")}>
            {subtitle ?? "RAJUK · Building permission"}
          </span>
        </span>
      )}
    </Link>
  );
}
