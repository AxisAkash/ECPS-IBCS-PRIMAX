import { toBnDigits, type Locale } from "@/lib/utils";
import { bn } from "./messages/bn";
import { en, type MessageKey } from "./messages/en";

/**
 * The single translation core, usable from client components, the demo store and server code
 * (page metadata). React bindings live in ./index.tsx.
 */
const DICTS: Record<Locale, Record<MessageKey, string>> = { en, bn };

export type Vars = Record<string, string | number>;

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
