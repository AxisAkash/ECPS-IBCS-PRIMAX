"use client";

import { CheckCircle2, FileText, ImageIcon, RotateCcw, Trash2, UploadCloud } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

export interface UploadedFile {
  name: string;
  sizeKb: number;
  previewUrl?: string;
}

/**
 * Upload control with simulated transfer progress.
 * Files never leave the browser: only name and size are kept, plus an object URL for image
 * previews that lives for the session. "Use sample file" lets presenters demo without files.
 */
export function FileDrop({
  label,
  hint,
  accept = ".pdf,.jpg,.jpeg,.png",
  sampleName,
  onUploaded,
  maxMb = 20,
  compact,
  className,
  invalid,
}: {
  label: string;
  hint?: string;
  accept?: string;
  sampleName: string;
  onUploaded: (f: UploadedFile) => void;
  maxMb?: number;
  compact?: boolean;
  className?: string;
  invalid?: boolean;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState<string>("");

  const simulate = (f: UploadedFile) => {
    setError("");
    setCurrent(f.name);
    setProgress(0);
    let p = 0;
    const timer = setInterval(() => {
      p += 0.12 + Math.random() * 0.14;
      if (p >= 1) {
        clearInterval(timer);
        setProgress(null);
        setCurrent("");
        onUploaded(f);
      } else setProgress(p);
    }, 110);
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (file.size > maxMb * 1024 * 1024) {
      setError(`“${file.name}” is ${(file.size / 1048576).toFixed(1)} MB. The limit is ${maxMb} MB — compress the PDF or split the drawing set.`);
      return;
    }
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    simulate({ name: file.name, sizeKb: Math.max(1, Math.round(file.size / 1024)), previewUrl });
  };

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "relative rounded-lg border border-dashed bg-surface-2 transition-colors",
          compact ? "px-4 py-3" : "px-5 py-6",
          drag ? "border-teal-600 bg-teal-50" : invalid ? "border-danger-600/60 bg-danger-100/30" : "border-line-strong",
        )}
      >
        {progress !== null ? (
          <div className="space-y-2" aria-live="polite">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium text-ink-strong">{current}</span>
              <span className="tabular text-xs text-muted">{Math.round(progress * 100)}%</span>
            </div>
            <ProgressBar value={progress} label={`Uploading ${current}`} />
            <p className="text-xs text-muted">Uploading (simulated)…</p>
          </div>
        ) : (
          <div className={cn("flex items-center gap-4", compact ? "flex-row" : "flex-col text-center sm:flex-row sm:text-left")}>
            <span className={cn("grid shrink-0 place-items-center rounded-full bg-surface text-teal-700 ring-1 ring-line", compact ? "size-9" : "size-11")}>
              <UploadCloud className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink-strong">{label}</p>
              <p className="mt-0.5 text-xs text-muted">{hint ?? `PDF, JPG or PNG up to ${maxMb} MB · drag and drop or browse`}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => input.current?.click()}>
                Browse
              </Button>
              <Button type="button" size="sm" variant="subtle" onClick={() => simulate({ name: sampleName, sizeKb: 180 + Math.round(Math.random() * 900) })}>
                Use sample file
              </Button>
            </div>
          </div>
        )}
        <input ref={input} id={id} type="file" accept={accept} className="sr-only" tabIndex={-1} aria-label={label} onChange={(e) => handleFiles(e.target.files)} />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function FileRow({
  name,
  sizeKb,
  meta,
  status,
  onRemove,
  onReplace,
  onPreview,
  kind = "document",
}: {
  name: string;
  sizeKb: number;
  meta?: string;
  status?: "uploaded" | "verified" | "rejected" | "superseded";
  onRemove?: () => void;
  onReplace?: () => void;
  onPreview?: () => void;
  kind?: "document" | "photo" | "drawing";
}) {
  const Icon = kind === "photo" ? ImageIcon : FileText;
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5", status === "superseded" && "opacity-60")}>
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-surface-3 text-slate-ink">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        {onPreview ? (
          <button type="button" onClick={onPreview} className="block max-w-full truncate text-left text-sm font-medium text-ink-strong hover:text-teal-700 hover:underline">
            {name}
          </button>
        ) : (
          <p className="truncate text-sm font-medium text-ink-strong">{name}</p>
        )}
        <p className="text-xs text-muted">
          {sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`}
          {meta && ` · ${meta}`}
          {status === "superseded" && " · superseded"}
        </p>
      </div>
      {status === "verified" && <CheckCircle2 className="size-4 text-success-600" aria-label="Verified" />}
      {onReplace && (
        <Button type="button" variant="ghost" size="icon-sm" onClick={onReplace} aria-label={`Replace ${name}`}>
          <RotateCcw />
        </Button>
      )}
      {onRemove && (
        <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label={`Remove ${name}`}>
          <Trash2 />
        </Button>
      )}
    </div>
  );
}
