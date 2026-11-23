"use client";

import { TimerOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import { useI18n } from "@/lib/i18n";
import { useDemoStore } from "@/lib/store/demo-store";

export default function SessionExpiredPage() {
  const { t } = useI18n();
  const minutes = useDemoStore((s) => s.security.idleTimeoutMinutes);
  return (
    <div className="animate-fade-up">
      <span className="grid size-12 place-items-center rounded-xl bg-surface-3 text-slate-ink">
        <TimerOff className="size-6" aria-hidden />
      </span>
      <h1 className="mt-6 font-display text-[1.75rem] font-semibold tracking-[-0.02em] text-ink-strong">{t("exp.title")}</h1>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{t("exp.body")}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/sign-in">{t("exp.again")}</Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/">{t("exp.home")}</Link>
        </Button>
      </div>
      <Callout tone="demo" className="mt-8">
        {t("se.demo", { n: minutes })}
      </Callout>
    </div>
  );
}
