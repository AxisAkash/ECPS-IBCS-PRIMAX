"use client";

import { ArrowRight, Languages, Menu as MenuIcon, Moon, Sun, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { roleMeta } from "@/lib/domain/roles";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { useDemoStore } from "@/lib/store/demo-store";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const NAV: Array<{ href: string; key: MessageKey }> = [
  { href: "/services", key: "nav.services" },
  { href: "/#how", key: "nav.how" },
  { href: "/track", key: "nav.track" },
  { href: "/public-register", key: "nav.register" },
  { href: "/support", key: "nav.help" },
];

export function LanguageToggle({ onDark, className }: { onDark?: boolean; className?: string }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "en" ? "bn" : "en")}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[0.8125rem] font-medium transition-colors",
        onDark ? "text-on-dark hover:bg-white/10" : "text-ink hover:bg-surface-3",
        className,
      )}
    >
      <Languages className="size-4" aria-hidden />
      <span lang={locale === "en" ? "bn" : "en"}>{t("lang.switch")}</span>
      <span className="sr-only"> ({t("lang.switchTo")})</span>
    </button>
  );
}

/** Light/dark switch. Light is the default; the choice is saved in a cookie and applied instantly. */
export function ThemeToggle({ onDark, className }: { onDark?: boolean; className?: string }) {
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  const label = theme === "dark" ? t("theme.toLight") : t("theme.toDark");
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "inline-grid size-8 place-items-center rounded-md transition-colors",
        onDark ? "text-on-dark hover:bg-white/10" : "text-ink hover:bg-surface-3",
        className,
      )}
    >
      {theme === "dark" ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
    </button>
  );
}

export function UtilityBar() {
  const { t } = useI18n();
  return (
    <div className="on-dark bg-navy-950 text-on-dark-muted">
      <div className="mx-auto flex h-9 max-w-[88rem] items-center justify-between gap-4 px-4 text-xs sm:px-6 lg:px-10">
        <p className="truncate">
          <span className="hidden sm:inline">{t("gov.country")}</span>
          <span className="hidden sm:inline" aria-hidden>
            {" "}
            ·{" "}
          </span>
          <span className="text-on-dark">{t("gov.agency")}</span>
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <Link href="/demo" className="hidden items-center gap-1.5 rounded px-1 text-amber-200 hover:text-amber-100 md:inline-flex">
            <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
            {t("proto.badge")} · {t("proto.label")}
          </Link>
          <Link href="/demo" className="inline-flex items-center gap-1.5 rounded px-1 text-amber-200 md:hidden">
            <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
            {t("proto.badge")}
          </Link>
          <ThemeToggle onDark className="size-7" />
          <LanguageToggle onDark className="h-7" />
        </div>
      </div>
    </div>
  );
}

export function PublicHeader() {
  const { t } = useI18n();
  const pathname = usePathname();
  const transparent = pathname === "/";
  const session = useDemoStore((s) => s.session);
  const hydrated = useDemoStore((s) => s.hydrated);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu after navigation (adjusting state during render, per React guidance).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  const dark = transparent && !scrolled && !open;
  const isActive = (href: string) => (href.startsWith("/#") ? false : pathname === href || pathname.startsWith(`${href}/`));
  const workspaceHref = session ? roleMeta(session.role).home : undefined;

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lg">
        {t("skip")}
      </a>
      <UtilityBar />
      <header
        className={cn(
          "sticky top-0 z-40 transition-[background-color,box-shadow,border-color] duration-200",
          dark ? "on-dark border-b border-white/10 bg-navy-900" : "border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85",
          scrolled && "shadow-sm",
        )}
      >
        <div className="mx-auto flex h-16 max-w-[88rem] items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
          <Logo onDark={dark} />
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={isActive(n.href) ? "page" : undefined}
                    className={cn(
                      "relative inline-flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors",
                      dark ? "text-on-dark hover:bg-white/10 hover:text-white" : "text-ink hover:bg-surface-3 hover:text-ink-strong",
                      isActive(n.href) && (dark ? "text-white" : "text-ink-strong"),
                      isActive(n.href) && "after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:bg-teal-600",
                    )}
                  >
                    {t(n.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            {hydrated && workspaceHref ? (
              <Button asChild variant={dark ? "outline-dark" : "secondary"} size="sm" className="hidden sm:inline-flex">
                <Link href={workspaceHref}>{t("nav.workspace")}</Link>
              </Button>
            ) : (
              <Button asChild variant={dark ? "outline-dark" : "ghost"} size="sm" className="hidden sm:inline-flex">
                <Link href="/sign-in">{t("nav.signin")}</Link>
              </Button>
            )}
            <Button asChild variant={dark ? "accent" : "primary"} size="sm" className="hidden md:inline-flex">
              <Link href="/services">
                {t("nav.apply")}
                <ArrowRight />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("lg:hidden", dark && "text-white hover:bg-white/10 hover:text-white")}
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? t("nav.close") : t("nav.menu")}
            >
              {open ? <X /> : <MenuIcon />}
            </Button>
          </div>
        </div>
        {open && (
          <nav id="mobile-nav" aria-label="Main" className="animate-fade-in border-t border-line bg-surface lg:hidden">
            <ul className="mx-auto max-w-[88rem] space-y-0.5 px-4 py-3 sm:px-6">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-md px-3 py-3 text-[0.9375rem] font-medium text-ink-strong hover:bg-surface-3">
                    {t(n.key)}
                    <ArrowRight className="size-4 text-subtle" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mx-auto grid max-w-[88rem] grid-cols-2 gap-2 border-t border-line px-4 py-4 sm:px-6">
              <Button asChild variant="secondary">
                <Link href={workspaceHref ?? "/sign-in"}>{workspaceHref ? t("nav.workspace") : t("nav.signin")}</Link>
              </Button>
              <Button asChild>
                <Link href="/services">{t("nav.apply")}</Link>
              </Button>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
