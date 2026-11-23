"use client";

import { BookOpen, FlaskConical, RefreshCcw, Repeat2, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog, DialogContent } from "@/components/ui/overlay";
import { toast } from "@/components/ui/toast";
import { DemoRoleGrid } from "@/features/auth/demo-roles";
import { roleMeta } from "@/lib/domain/roles";
import { useI18n } from "@/lib/i18n";
import { useDemoStore } from "@/lib/store/demo-store";
import { useDemoUi } from "@/lib/store/demo-ui";
import { cn } from "@/lib/utils";

export const DEMO_PANEL_ID = "demo-tools";

/** The one trigger that reveals and hides the demo tools. */
/** `compact` shows only the icon below the `sm` breakpoint (the accessible name stays). */
export function DemoToggle({ onDark, compact, className }: { onDark?: boolean; compact?: boolean; className?: string }) {
  const { t } = useI18n();
  const visible = useDemoUi((s) => s.visible);
  const toggle = useDemoUi((s) => s.toggle);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={visible}
      aria-expanded={visible}
      aria-controls={DEMO_PANEL_ID}
      title={visible ? t("demo.hide") : t("demo.show")}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md border border-dashed px-2 text-xs font-medium transition-colors",
        onDark
          ? visible
            ? "border-amber-500 bg-amber-500/15 text-amber-200"
            : "border-white/25 text-on-dark-muted hover:border-amber-500/70 hover:text-amber-200"
          : visible
            ? "border-amber-600 bg-amber-50 text-amber-700"
            : "border-line-strong text-muted hover:border-amber-600/60 hover:text-amber-700",
        className,
      )}
    >
      <FlaskConical className="size-3.5" aria-hidden />
      <span className={cn(compact && "sr-only sm:not-sr-only")}>{t("demo.toggle")}</span>
      <span className="sr-only"> — {visible ? t("demo.hide") : t("demo.show")}</span>
    </button>
  );
}

/** Floating panel shown only while the demo is revealed. Esc or the close button hides it. */
export function DemoPanel() {
  const { t } = useI18n();
  const visible = useDemoUi((s) => s.visible);
  const hide = useDemoUi((s) => s.hide);
  const session = useDemoStore((s) => s.session);
  const hydrated = useDemoStore((s) => s.hydrated);
  const reset = useDemoStore((s) => s.resetDemo);
  const [roles, setRoles] = useState(false);
  const [resetting, setResetting] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  // The sign-in page shows its own inline role list when the demo is revealed.
  const inline = usePathname().startsWith("/sign-in");

  useEffect(() => {
    if (!visible || inline) return;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !roles && !resetting) hide();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, inline, hide, roles, resetting]);

  const meta = session ? roleMeta(session.role) : undefined;

  return (
    <>
      {visible && !inline && (
        <aside
          ref={panelRef}
          id={DEMO_PANEL_ID}
          tabIndex={-1}
          aria-labelledby="demo-tools-title"
          className="no-print fixed bottom-4 right-4 z-[60] w-[min(22rem,calc(100vw-2rem))] animate-scale-in rounded-xl border border-dashed border-amber-500/70 bg-surface p-4 text-sm shadow-lg focus:outline-none"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-amber-700 [:lang(bn)_&]:font-sans [:lang(bn)_&]:text-xs [:lang(bn)_&]:tracking-normal">{t("demo.kicker")}</p>
              <h2 id="demo-tools-title" className="mt-1 font-display text-base font-semibold text-ink-strong">
                {t("demo.title")}
              </h2>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={hide} aria-label={t("demo.close")}>
              <X />
            </Button>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">{t("demo.lead")}</p>
          {hydrated && meta && (
            <p className="mt-3 rounded-md bg-surface-2 px-3 py-2 text-xs text-muted">
              {t("demo.current")} <span className="font-semibold text-ink-strong">{t(`role.${meta.key}`)}</span>
            </p>
          )}
          <div className="mt-3 grid gap-2">
            <Button variant="secondary" className="justify-start" onClick={() => setRoles(true)}>
              <Repeat2 /> {session ? t("nav.switchrole") : t("demo.enter")}
            </Button>
            <Button variant="secondary" className="justify-start" onClick={() => setResetting(true)}>
              <RefreshCcw /> {t("nav.resetdemo")}
            </Button>
            <Button asChild variant="ghost" className="justify-start">
              <Link href="/demo" onClick={hide}>
                <BookOpen /> {t("demo.scenarios")}
              </Link>
            </Button>
          </div>
        </aside>
      )}
      <Dialog open={roles} onOpenChange={setRoles}>
        <DialogContent size="lg" eyebrow={t("demo.kicker")} title={session ? t("nav.switchrole") : t("demo.enter")} description={t("demo.roles.lead")}>
          <DemoRoleGrid columns={2} onDone={() => setRoles(false)} />
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={resetting}
        onOpenChange={setResetting}
        eyebrow={t("demo.kicker")}
        title={t("demo.reset.title")}
        description={t("demo.reset.body")}
        confirmLabel={t("demo.reset.confirm")}
        tone="danger"
        onConfirm={() => {
          reset();
          setResetting(false);
          toast.success(t("demo.reset.toast"), t("demo.reset.toastBody"));
        }}
      />
    </>
  );
}
