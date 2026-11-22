"use client";

import {
  ArrowRight,
  Briefcase,
  Building2,
  ClipboardCheck,
  Coins,
  Gavel,
  HardHat,
  Headset,
  LineChart,
  Settings2,
  User,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/ui/feedback";
import { DEMO_PERSONAS, USERS } from "@/lib/data/seed";
import { ROLES } from "@/lib/domain/roles";
import type { RoleKey } from "@/lib/domain/types";
import { useI18n } from "@/lib/i18n";
import { ecps } from "@/lib/services";
import { cn } from "@/lib/utils";

export const ROLE_ICON: Record<RoleKey, LucideIcon> = {
  applicant: User,
  professional: Briefcase,
  officer: Building2,
  inspector: HardHat,
  committee: Gavel,
  estate: ClipboardCheck,
  finance: Coins,
  management: LineChart,
  admin: Settings2,
  support: Headset,
};

export function DemoRoleGrid({ columns = 2, next }: { columns?: 1 | 2 | 3; next?: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [pending, setPending] = useState<RoleKey | null>(null);

  const enter = async (role: RoleKey) => {
    setPending(role);
    await ecps.auth.demoSignIn(role);
    const meta = ROLES.find((r) => r.key === role)!;
    router.push(next && (next.startsWith(meta.workspace === "rajuk" ? "/rajuk" : "/workspace")) ? next : meta.home);
  };

  return (
    <ul className={cn("grid grid-cols-[minmax(0,1fr)] gap-2", columns === 2 && "sm:grid-cols-[repeat(2,minmax(0,1fr))]", columns === 3 && "sm:grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-cols-[repeat(3,minmax(0,1fr))]")}>
      {ROLES.map((r) => {
        const Icon = ROLE_ICON[r.key];
        const persona = USERS.find((u) => u.id === DEMO_PERSONAS[r.key])!;
        const busy = pending === r.key;
        return (
          <li key={r.key} className="min-w-0">
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => enter(r.key)}
              aria-label={t("auth.demo.enter", { role: locale === "bn" ? r.labelBn : r.label })}
              className="group flex w-full items-center gap-3 rounded-lg border border-line bg-surface px-3.5 py-3 text-left transition-[border-color,box-shadow,background-color] hover:border-teal-600/50 hover:shadow-sm disabled:cursor-wait disabled:opacity-60"
            >
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-md", r.workspace === "rajuk" ? "bg-navy-900 text-white" : "bg-teal-50 text-teal-700")}>
                {busy ? <Spinner className="size-4" /> : <Icon className="size-4" aria-hidden />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink-strong">{locale === "bn" ? r.labelBn : r.label}</span>
                <span className="block truncate text-xs text-muted">
                  {persona.name} · {persona.designation}
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-teal-700" aria-hidden />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
