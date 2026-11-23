"use client";

import { Bell, ChevronDown, Languages, LogOut, Menu as MenuIcon, ShieldAlert, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { EmptyState, PageSkeleton } from "@/components/ui/feedback";
import { Dialog, DialogContent, Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger, Popover } from "@/components/ui/overlay";
import { DemoToggle } from "@/features/demo/demo-tools";
import { useDemoUi } from "@/lib/store/demo-ui";
import { ThemeToggle } from "./public-header";
import { can, roleMeta, type Permission } from "@/lib/domain/roles";
import type { RoleKey } from "@/lib/domain/types";
import { useI18n } from "@/lib/i18n";
import { notifBody, notifTitle } from "@/lib/i18n/notify";
import { ecps } from "@/lib/services";
import { useDemoStore } from "@/lib/store/demo-store";
import { cn, formatRelative } from "@/lib/utils";
import { RAJUK_NAV, WORKSPACE_NAV, type NavGroup, type NavItem } from "./nav-config";

/* ———————————————————————————— Badge counts ———————————————————————————— */

function useBadgeCounts() {
  const session = useDemoStore((s) => s.session);
  const notifications = useDemoStore((s) => s.notifications);
  const applications = useDemoStore((s) => s.applications);
  const signing = useDemoStore((s) => s.signing);
  const tickets = useDemoStore((s) => s.tickets);
  const inspections = useDemoStore((s) => s.inspections);
  return useMemo(() => {
    const me = session?.userId;
    return {
      notifications: notifications.filter((n) => n.userId === me && !n.read).length,
      invitations: applications.reduce((n, a) => n + a.professionals.filter((p) => p.userId === me && p.status === "invited").length, 0),
      inbox: applications.filter((a) => a.holderId === me && !["approved", "rejected", "draft"].includes(a.status)).length,
      signing: signing.filter((p) => p.status === "awaiting" && p.requiredSignerIds.includes(me ?? "") && !p.signatures.some((s) => s.signerId === me)).length,
      tickets: tickets.filter((t) => t.status === "open").length,
      inspections: inspections.filter((i) => i.inspectorId === me && i.status !== "submitted").length,
    };
  }, [session, notifications, applications, signing, tickets, inspections]);
}

/* ———————————————————————————— Idle timeout (TOR 1.9) ———————————————————————————— */

function IdleTimeout() {
  const { t } = useI18n();
  const router = useRouter();
  const { idleTimeoutMinutes, warnBeforeSeconds } = useDemoStore((s) => s.security);
  const signOut = useDemoStore((s) => s.signOut);
  const [warn, setWarn] = useState(false);
  const [remaining, setRemaining] = useState(warnBeforeSeconds);
  const last = useRef(0);

  useEffect(() => {
    last.current = Date.now();
    const bump = () => {
      if (!warn) last.current = Date.now();
    };
    const events = ["mousemove", "keydown", "pointerdown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const timer = setInterval(() => {
      const idle = (Date.now() - last.current) / 1000;
      const limit = idleTimeoutMinutes * 60;
      if (idle >= limit) {
        signOut();
        router.push("/session-expired");
      } else if (idle >= limit - warnBeforeSeconds) {
        setWarn(true);
        setRemaining(Math.ceil(limit - idle));
      }
    }, 1000);
    const preview = () => {
      last.current = Date.now() - (idleTimeoutMinutes * 60 - warnBeforeSeconds) * 1000;
    };
    window.addEventListener("ecps:preview-idle", preview);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      window.removeEventListener("ecps:preview-idle", preview);
      clearInterval(timer);
    };
  }, [idleTimeoutMinutes, warnBeforeSeconds, warn, router, signOut]);

  return (
    <Dialog open={warn} onOpenChange={() => undefined}>
      <DialogContent
        size="sm"
        hideClose
        eyebrow={t("shell.idle.eyebrow")}
        title={t("shell.idle.title")}
        description={t("shell.idle.desc", { n: idleTimeoutMinutes })}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                signOut();
                router.push("/");
              }}
            >
              {t("shell.idle.out")}
            </Button>
            <Button
              onClick={() => {
                last.current = Date.now();
                setWarn(false);
              }}
            >
              {t("shell.idle.stay")}
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-4">
          <span className="tabular grid size-16 shrink-0 place-items-center rounded-full border-4 border-amber-500/30 font-display text-xl font-semibold text-amber-700" aria-live="polite">
            {t("shell.idle.secs", { n: remaining })}
          </span>
          <p className="text-sm leading-relaxed text-muted">{t("shell.idle.body")}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ———————————————————————————— Notifications ———————————————————————————— */

function NotificationsButton({ workspace }: { workspace: "workspace" | "rajuk" }) {
  const { t, locale } = useI18n();
  const session = useDemoStore((s) => s.session);
  const all = useDemoStore((s) => s.notifications);
  const markRead = useDemoStore((s) => s.markNotificationRead);
  const markAll = useDemoStore((s) => s.markAllNotificationsRead);
  const mine = useMemo(() => all.filter((n) => n.userId === session?.userId), [all, session]);
  const unread = mine.filter((n) => !n.read).length;
  return (
    <Popover
      className="w-[min(24rem,calc(100vw-1.5rem))]"
      trigger={
        <Button variant="ghost" size="icon" aria-label={unread ? t("shell.notif.unread", { n: unread }) : t("shell.notif")} className="relative">
          <Bell />
          {unread > 0 && <span className="tabular absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger-600 px-1 text-[0.625rem] font-semibold text-white">{unread}</span>}
        </Button>
      }
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-sm font-semibold text-ink-strong">{t("shell.notif")}</p>
        {unread > 0 && (
          <button type="button" onClick={markAll} className="text-xs font-medium text-teal-700 hover:underline">
            {t("shell.notif.markAll")}
          </button>
        )}
      </div>
      {mine.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted">{t("shell.notif.empty")}</p>
      ) : (
        <ul className="scrollbar-thin max-h-96 divide-y divide-line overflow-y-auto">
          {mine.slice(0, 8).map((n) => (
            <li key={n.id}>
              <Link href={n.href ?? "#"} onClick={() => markRead(n.id)} className={cn("flex gap-3 px-4 py-3 hover:bg-surface-2", !n.read && "bg-teal-50/40")}>
                <span
                  aria-hidden
                  className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : n.kind === "warning" ? "bg-amber-500" : n.kind === "action" ? "bg-danger-600" : n.kind === "success" ? "bg-success-600" : "bg-teal-600")}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink-strong">{notifTitle(n, locale)}</span>
                  <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted">{notifBody(n, locale)}</span>
                  <span className="mt-1 block text-[0.6875rem] text-subtle">{formatRelative(n.at, undefined, locale)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {workspace === "workspace" && (
        <div className="border-t border-line px-4 py-2.5 text-center">
          <Link href="/workspace/notifications" className="text-xs font-medium text-teal-700 hover:underline">
            {t("shell.notif.all")}
          </Link>
        </div>
      )}
    </Popover>
  );
}

/* ———————————————————————————— User menu ———————————————————————————— */

function UserMenu() {
  const router = useRouter();
  const { t, setLocale, locale, term } = useI18n();
  const session = useDemoStore((s) => s.session);
  const user = useDemoStore((s) => s.users.find((u) => u.id === s.session?.userId));
  if (!session || !user) return null;
  const meta = roleMeta(session.role);
  return (
    <>
      <Menu>
        <MenuTrigger asChild>
          <button type="button" className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 text-left transition-colors hover:bg-surface-3">
            <Avatar name={user.name} size="sm" />
            <span className="hidden min-w-0 md:block">
              <span className="block max-w-40 truncate text-[0.8125rem] font-semibold leading-tight text-ink-strong">{user.name}</span>
              <span className="block max-w-40 truncate text-[0.6875rem] leading-tight text-muted">{term("desig", user.designation)}</span>
            </span>
            <ChevronDown className="hidden size-4 text-subtle md:block" aria-hidden />
          </button>
        </MenuTrigger>
        <MenuContent className="w-64">
          <MenuLabel>{t("nav.signedin")}</MenuLabel>
          <div className="px-2.5 pb-2">
            <p className="text-sm font-semibold text-ink-strong">{user.name}</p>
            <p className="text-xs text-muted">
              {t(`role.${meta.key}`)} · {user.zone ? term("zone", user.zone) : term("desig", user.designation)}
            </p>
          </div>
          <MenuSeparator />
          <MenuItem onSelect={() => setLocale(locale === "en" ? "bn" : "en")}>
            <Languages /> {t("lang.switch")}
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            destructive
            onSelect={async () => {
              await ecps.auth.signOut();
              router.push("/");
            }}
          >
            <LogOut /> {t("nav.signout")}
          </MenuItem>
        </MenuContent>
      </Menu>
    </>
  );
}

/* ———————————————————————————— Shell ———————————————————————————— */

function NavLinks({ groups, counts, dark, onNavigate }: { groups: NavGroup[]; counts: ReturnType<typeof useBadgeCounts>; dark: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const active = (it: NavItem) => (it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(`${it.href}/`));
  return (
    <nav aria-label={t("shell.nav.workspace")} className="space-y-6">
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.labelKey && <p className={cn("mb-2 px-3 font-mono text-[0.625rem] uppercase tracking-[0.14em] [:lang(bn)_&]:font-sans [:lang(bn)_&]:text-xs [:lang(bn)_&]:tracking-normal", dark ? "text-on-dark-muted" : "text-subtle")}>{t(g.labelKey)}</p>}
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const on = active(it);
              const count = it.badge ? counts[it.badge] : 0;
              return (
                <li key={it.href + it.labelKey}>
                  <Link
                    href={it.href}
                    onClick={onNavigate}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      "group relative flex h-9 items-center gap-3 rounded-md px-3 text-[0.8125rem] font-medium transition-colors",
                      dark
                        ? on
                          ? "bg-white/10 text-white"
                          : "text-on-dark-muted hover:bg-white/5 hover:text-white"
                        : on
                          ? "bg-teal-50 text-teal-800"
                          : "text-ink hover:bg-surface-3 hover:text-ink-strong",
                    )}
                  >
                    {on && <span aria-hidden className={cn("absolute inset-y-1.5 left-0 w-[3px] rounded-r", dark ? "bg-amber-500" : "bg-teal-600")} />}
                    <it.icon className={cn("size-[17px] shrink-0", on ? (dark ? "text-amber-200" : "text-teal-700") : dark ? "text-on-dark-muted" : "text-subtle group-hover:text-ink")} aria-hidden />
                    <span className="flex-1 truncate">{t(it.labelKey)}</span>
                    {count > 0 && (
                      <span className={cn("tabular rounded-full px-1.5 text-[0.6875rem] font-semibold", dark ? "bg-amber-500 text-navy-950" : "bg-teal-600 text-white")}>
                        {count}
                        <span className="sr-only"> {t("shell.pending")}</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function WorkspaceShell({ workspace, children }: { workspace: "workspace" | "rajuk"; children: ReactNode }) {
  const { t } = useI18n();
  const demoVisible = useDemoUi((s) => s.visible);
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useDemoStore((s) => s.hydrated);
  const session = useDemoStore((s) => s.session);
  const counts = useBadgeCounts();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !session) router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, session, router, pathname]);

  const role = session?.role;
  const dark = workspace === "rajuk";
  const groups: NavGroup[] = !role
    ? []
    : workspace === "workspace"
      ? role === "professional"
        ? WORKSPACE_NAV.professional
        : WORKSPACE_NAV.applicant
      : role === "applicant" || role === "professional"
        ? []
        : RAJUK_NAV[role];
  const mismatch = role && roleMeta(role).workspace !== workspace;

  const sidebar = (
    <div className={cn("flex h-full flex-col", dark ? "on-dark bg-navy-900" : "bg-surface")}>
      <div className={cn("flex h-16 shrink-0 items-center justify-between border-b px-5", dark ? "border-white/10" : "border-line")}>
        <Logo onDark={dark} href={role ? roleMeta(role).home : "/"} subtitle={dark ? t("shell.sub.rajuk") : t("shell.sub.applicant")} />
      </div>
      <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-5">{hydrated && role && <NavLinks groups={groups} counts={counts} dark={dark} onNavigate={() => setMobileOpen(false)} />}</div>
      {demoVisible && (
      <div className={cn("border-t p-4", dark ? "border-white/10" : "border-line")}>
        <div className={cn("rounded-lg border border-dashed p-3 text-[0.6875rem] leading-relaxed", dark ? "border-amber-500/40 text-amber-200/90" : "border-amber-500/50 bg-amber-50/60 text-amber-700")}>
          <p className="font-mono uppercase tracking-[0.12em]">{t("proto.badge")}</p>
          <p className="mt-1">{t("shell.proto")}</p>
          <Link href="/" className={cn("mt-2 inline-block font-medium underline", dark ? "text-white" : "text-amber-700")}>
            {t("shell.portal")}
          </Link>
        </div>
      </div>
      )}
    </div>
  );

  return (
    <div className={cn("min-h-dvh", dark ? "bg-canvas" : "bg-canvas")}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lg">
        {t("shell.skip")}
      </a>
      <aside className={cn("fixed inset-y-0 left-0 z-30 hidden w-64 border-r lg:block", dark ? "border-navy-950" : "border-line")}>{sidebar}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t("shell.nav")}>
          <button type="button" className="absolute inset-0 bg-navy-950/50" aria-label={t("shell.nav.close")} onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-72 max-w-[85vw] animate-slide-in-right shadow-lg">
            {sidebar}
            <Button variant="ghost" size="icon-sm" className={cn("absolute right-3 top-4", dark && "text-white hover:bg-white/10 hover:text-white")} onClick={() => setMobileOpen(false)} aria-label={t("shell.nav.close")}>
              <X />
            </Button>
          </div>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label={t("shell.nav.open")}>
            <MenuIcon />
          </Button>
          <div className="min-w-0 flex-1">
            {role && (
              <p className="flex items-center gap-2 truncate text-xs text-muted">
                <span className="truncate">{dark ? <ShellUserLabel /> : <RoleLabel role={role} />}</span>
              </p>
            )}
          </div>
          {hydrated && session && (
            <div className="flex items-center gap-1.5">
              <DemoToggle compact />
              <ThemeToggle className="size-9" />
              <NotificationsButton workspace={workspace} />
              <UserMenu />
            </div>
          )}
        </header>
        {workspace === "rajuk" && hydrated && session && <IdleTimeout />}
        {workspace === "workspace" && hydrated && session && <IdleTimeout />}
        <main id="main" tabIndex={-1} className="mx-auto max-w-[96rem] px-4 py-6 focus:outline-none sm:px-6 lg:px-8 lg:py-8">
          {!hydrated || !session ? (
            <PageSkeleton />
          ) : mismatch ? (
            <WrongWorkspace role={role!} />
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

function RoleLabel({ role }: { role: RoleKey }) {
  const { t } = useI18n();
  return <>{t(`role.${role}`)}</>;
}

function ShellUserLabel() {
  const { t, term } = useI18n();
  const user = useDemoStore((s) => s.users.find((u) => u.id === s.session?.userId));
  return <>{user ? `${t("shell.rajuk")} · ${term("desig", user.designation)}${user.zone ? `, ${term("zone", user.zone)}` : ""}` : t("shell.rajuk")}</>;
}

function WrongWorkspace({ role }: { role: RoleKey }) {
  const { t } = useI18n();
  const meta = roleMeta(role);
  return (
    <EmptyState
      icon={ShieldAlert}
      title={t("shell.wrong.title", { role: t(`role.${role}`) })}
      body={t("shell.wrong.body")}
      action={
        <Button asChild>
          <Link href={meta.home}>{t("shell.wrong.go")}</Link>
        </Button>
      }
    />
  );
}

/** Wrap a page to show a permission notice instead of content the current role cannot use. */
export function RequirePermission({ permission, children }: { permission: Permission | Permission[]; children: ReactNode }) {
  const { t } = useI18n();
  const role = useDemoStore((s) => s.session?.role);
  const perms = Array.isArray(permission) ? permission : [permission];
  if (!perms.some((p) => can(role, p))) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title={t("shell.perm.title")}
        body={t("shell.perm.body", { perm: perms.join(t("shell.perm.or")) })}
        action={
          role ? (
            <Button asChild variant="secondary">
              <Link href={roleMeta(role).home}>{t("shell.perm.back")}</Link>
            </Button>
          ) : undefined
        }
      />
    );
  }
  return <>{children}</>;
}
