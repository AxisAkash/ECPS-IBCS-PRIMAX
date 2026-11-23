"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@/lib/utils";
import { LOCALE_COOKIE } from "./constants";
import { translate, translateTerm, type Vars } from "./core";
import type { MessageKey } from "./messages/en";

export { interpolate, translate, translateTerm } from "./core";

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey, vars?: Vars) => string;
  /** Glossary lookup for data values (job titles, zones, departments…): `term("desig", "Town Planner")`. Falls back to the value. */
  term: (group: string, value: string | undefined) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "bn" ? "bn" : "en";
  }, [locale]);

  const t = useCallback((key: MessageKey, vars?: Vars) => translate(locale, key, vars), [locale]);
  const term = useCallback((group: string, v: string | undefined) => translateTerm(locale, group, v), [locale]);
  const value = useMemo(() => ({ locale, setLocale, t, term }), [locale, setLocale, t, term]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

export type { MessageKey };
export { LOCALE_COOKIE };
