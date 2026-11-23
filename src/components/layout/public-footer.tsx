"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { useDemoUi } from "@/lib/store/demo-ui";
import { useI18n, type MessageKey } from "@/lib/i18n";

const COLS: Array<{ title: MessageKey; links: Array<{ href: string; key: MessageKey }> }> = [
  {
    title: "foot.services",
    links: [
      { href: "/services/planning-permit", key: "service.PP.name" },
      { href: "/services/construction-permit", key: "service.CP.name" },
      { href: "/services/occupancy-certificate", key: "service.OC.name" },
      { href: "/services/appeal", key: "service.APPEAL.name" },
      { href: "/services", key: "svc.all" },
    ],
  },
  {
    title: "foot.citizens",
    links: [
      { href: "/track", key: "nav.track" },
      { href: "/public-register", key: "nav.register" },
      { href: "/verify", key: "reg.verify" },
      { href: "/support", key: "nav.help" },
    ],
  },
  {
    title: "foot.professionals",
    links: [
      { href: "/register/professional", key: "reg2.pro.title" },
      { href: "/guides", key: "sup.manuals" },
      { href: "/sign-in", key: "nav.signin" },
    ],
  },
];

export function PublicFooter() {
  const { t } = useI18n();
  const demoVisible = useDemoUi((s) => s.visible);
  return (
    <footer className="on-dark relative overflow-hidden bg-navy-950 text-on-dark-muted">
      <div className="bg-blueprint absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-[88rem] px-4 pb-10 pt-16 sm:px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div className="max-w-sm space-y-5">
            <Logo onDark />
            <p className="text-sm leading-relaxed">{t("foot.about")}</p>
            <p className="text-xs leading-relaxed text-on-dark-muted/80">{t("gov.agency")}</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLS.map((c) => (
              <div key={c.title}>
                <h2 className="mb-4 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-white/90">{t(c.title)}</h2>
                <ul className="space-y-2.5 text-sm">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="rounded transition-colors hover:text-white">
                        {t(l.key)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-2 flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-amber-200">
            <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
            {t("foot.about.title")}
          </h2>
          <p className="max-w-4xl text-[0.8125rem] leading-relaxed">{t("foot.disclaimer")}</p>
        </div>
        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>{t("foot.rights", { year: 2026 })}</p>
          <div className="flex gap-5">
            <Link href="/design-system" className="hover:text-white">
              {t("foot.design")}
            </Link>
            {demoVisible && (
              <Link href="/demo" className="hover:text-white">
                {t("foot.demo")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
