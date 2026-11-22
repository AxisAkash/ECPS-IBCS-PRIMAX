"use client";

import { ArrowRight, Briefcase, Home } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function RegisterChooserPage() {
  const { t } = useI18n();
  const options = [
    { href: "/register/applicant", icon: Home, title: t("reg2.owner.title"), body: t("reg2.owner.body"), req: t("reg2.owner.req") },
    { href: "/register/professional", icon: Briefcase, title: t("reg2.pro.title"), body: t("reg2.pro.body"), req: t("reg2.pro.req") },
  ];
  return (
    <div className="animate-fade-up">
      <p className="kicker">{t("brand.full")}</p>
      <h1 className="mt-4 font-display text-[2rem] font-semibold tracking-[-0.02em] text-ink-strong">{t("reg2.title")}</h1>
      <p className="mt-2 text-[0.9375rem] text-muted">{t("reg2.lead")}</p>
      <ul className="mt-8 space-y-3">
        {options.map((o) => (
          <li key={o.href}>
            <Link href={o.href} className="group flex gap-4 rounded-xl border border-line bg-surface p-5 transition-[border-color,box-shadow] hover:border-teal-600/50 hover:shadow-md">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700">
                <o.icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="font-display text-base font-semibold text-ink-strong">{o.title}</span>
                  <ArrowRight className="size-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-teal-700" aria-hidden />
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">{o.body}</span>
                <span className="mt-3 inline-block rounded-full bg-surface-3 px-2.5 py-0.5 text-xs text-slate-ink">{o.req}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-center text-sm text-muted">
        {t("reg2.have")}{" "}
        <Link href="/sign-in" className="font-semibold text-teal-700 hover:underline">
          {t("nav.signin")}
        </Link>
      </p>
    </div>
  );
}
