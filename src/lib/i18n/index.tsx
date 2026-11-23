"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toBnDigits, type Locale } from "@/lib/utils";
import { LOCALE_COOKIE } from "./constants";
import { bn } from "./messages/bn";
import { en, type MessageKey } from "./messages/en";

const DICTS: Record<Locale, Record<MessageKey, string>> = { en, bn };

type Vars = Record<string, string | number>;

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey, vars?: Vars) => string;
  /** Glossary lookup for data values (job titles, zones, departments…): `term("desig", "Town Planner")`. Falls back to the value. */
  term: (group: string, value: string | undefined) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function interpolate(template: string, vars?: Vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

export function translate(locale: Locale, key: MessageKey, vars?: Vars) {
  return interpolate(DICTS[locale][key] ?? en[key] ?? key, vars);
}

/** Look up a data value in the glossary keys (`<group>.<value>`); unknown values are shown as stored. */
export function translateTerm(locale: Locale, group: string, value: string | undefined) {
  if (!value) return "";
  const zone = group === "zone" ? /^Zone (\d+)$/.exec(value) : null;
  if (zone) return translate(locale, "term.zone", { n: locale === "bn" ? toBnDigits(zone[1]!) : zone[1]! });
  const key = `${group}.${value}` as MessageKey;
  return DICTS[locale][key] ?? value;
}

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
