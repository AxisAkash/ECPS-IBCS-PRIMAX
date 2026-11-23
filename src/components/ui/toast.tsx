"use client";

import { CheckCircle2, Info, OctagonAlert, X } from "lucide-react";
import { create } from "zustand";
import { useI18n } from "@/lib/i18n";
import { cn, uid } from "@/lib/utils";

interface Toast {
  id: string;
  title: string;
  body?: string;
  tone: "success" | "info" | "error";
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = uid("toast");
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 5200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = {
  success: (title: string, body?: string) => useToasts.getState().push({ title, body, tone: "success" }),
  info: (title: string, body?: string) => useToasts.getState().push({ title, body, tone: "info" }),
  error: (title: string, body?: string) => useToasts.getState().push({ title, body, tone: "error" }),
};

export function Toaster() {
  const { t: tr } = useI18n();
  const { toasts, dismiss } = useToasts();
  return (
    <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((t) => {
        const Icon = t.tone === "success" ? CheckCircle2 : t.tone === "error" ? OctagonAlert : Info;
        return (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className="pointer-events-auto flex animate-scale-in gap-3 rounded-lg border border-line bg-surface p-3.5 pr-2.5 shadow-lg"
          >
            <Icon
              aria-hidden
              className={cn("mt-0.5 size-[18px] shrink-0", t.tone === "success" ? "text-success-700" : t.tone === "error" ? "text-danger-700" : "text-teal-700")}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-strong">{t.title}</p>
              {t.body && <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-muted">{t.body}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="grid size-6 place-items-center rounded text-subtle hover:bg-surface-3 hover:text-ink" aria-label={tr("ui.dismiss")}>
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
