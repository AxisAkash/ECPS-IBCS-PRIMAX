"use client";

import type { Application, DocumentRecord } from "@/lib/domain/types";
import { useI18n } from "@/lib/i18n";
import { useLabels } from "@/lib/i18n/labels";
import { cn } from "@/lib/utils";
import { DrawingSheet } from "./drawing-sheet";


/** Renders a fictional preview for any sample document type. */
export function DocumentPreview({ doc, app, className }: { doc: DocumentRecord; app: Application; className?: string }) {
  const { t } = useI18n();
  const L = useLabels();
  if (doc.previewKind === "drawing" && doc.drawingSheet) {
    const sheets = app.documents.filter((d) => d.category === "drawing" && d.status !== "superseded");
    return (
      <div className={cn("overflow-hidden rounded-lg border border-line shadow-sm", className)}>
        <DrawingSheet
          kind={doc.drawingSheet}
          title={L.sheet(doc.drawingSheet)}
          page={Math.max(1, sheets.findIndex((s) => s.id === doc.id) + 1)}
          total={Math.max(1, sheets.length)}
          appRef={app.ref}
          project={app.title}
          version={doc.version}
          storeys={app.building?.storeys ?? 6}
          signable={doc.drawingSheet !== "far"}
        />
      </div>
    );
  }
  if (doc.previewKind === "photo") return <PhotoPlaceholder label={doc.name} kind={doc.category === "road_photo" ? "road" : doc.category === "plot_photo" ? "plot" : "portrait"} className={className} />;
  return (
    <div data-theme="light" className={cn("mx-auto aspect-[1/1.414] w-full max-w-md rounded-md border border-line bg-white p-8 shadow-sm", className)} role="img" aria-label={t("ui.docPreview", { name: doc.name })}>
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="h-2 w-28 rounded bg-navy-900/80" />
          <div className="h-1.5 w-20 rounded bg-line-strong" />
        </div>
        <div className="grid size-10 place-items-center rounded-full border border-line-strong font-mono text-[0.5rem] text-subtle">{t("ui.seal")}</div>
      </div>
      <p className="mt-6 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-teal-700">{L.doc(doc.category)}</p>
      <p className="mt-1 text-xs font-semibold text-ink-strong">{doc.name}</p>
      <div className="mt-5 space-y-2">
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} className="h-1.5 rounded bg-surface-3" style={{ width: `${70 + ((i * 37) % 30)}%` }} />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="h-10 rounded border border-dashed border-line-strong" />
        <div className="h-10 rounded border border-dashed border-line-strong" />
      </div>
      <p className="mt-6 border-t border-line pt-3 text-center font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-danger-700">{t("ui.fictionalDoc")}</p>
    </div>
  );
}

export function PhotoPlaceholder({ label, kind, className }: { label: string; kind: "plot" | "road" | "portrait" | "site"; className?: string }) {
  const { t } = useI18n();
  return (
    <figure className={cn("overflow-hidden rounded-lg border border-line", className)}>
      <svg viewBox="0 0 400 260" className="h-auto w-full" role="img" aria-label={t("ui.photoPreview", { name: label })}>
        <rect width="400" height="260" fill="#dfe8ef" />
        <rect y="150" width="400" height="110" fill={kind === "road" ? "#9aa8b8" : "#c8d6c3"} />
        {kind === "road" && (
          <>
            <path d="M0 260 L170 150 L230 150 L400 260 Z" fill="#7c8a9c" />
            <path d="M200 160 L200 175 M200 190 L200 210 M200 228 L200 255" stroke="#f4f7fa" strokeWidth="4" />
          </>
        )}
        {kind !== "portrait" && (
          <>
            <rect x="30" y="80" width="70" height="72" fill="#b5c3d1" />
            <rect x="300" y="60" width="80" height="92" fill="#aab9c8" />
            {kind === "plot" && <rect x="130" y="135" width="150" height="40" fill="none" stroke="#c4861f" strokeWidth="3" strokeDasharray="8 6" />}
            {kind === "site" && <rect x="140" y="70" width="110" height="82" fill="#c9d4df" stroke="#7c8a9c" />}
          </>
        )}
        {kind === "portrait" && (
          <>
            <rect width="400" height="260" fill="#e8eef5" />
            <circle cx="200" cy="105" r="42" fill="#c9d4df" />
            <path d="M120 240 C 130 175, 270 175, 280 240 Z" fill="#c9d4df" />
          </>
        )}
        <rect x="10" y="10" width="138" height="20" rx="3" fill="#14263d" opacity="0.75" />
        <text x="18" y="24" fontSize="10" fill="#fff" fontFamily="var(--font-plex-mono), monospace">SAMPLE · FICTIONAL</text>
      </svg>
      <figcaption className="truncate border-t border-line bg-surface-2 px-3 py-1.5 text-xs text-muted">{label}</figcaption>
    </figure>
  );
}
