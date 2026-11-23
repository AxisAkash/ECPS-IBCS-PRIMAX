import type { LocalMessage, Notification, NotificationMessage } from "@/lib/domain/types";
import type { Locale } from "@/lib/utils";
import { translate, translateTerm } from "./index";
import type { MessageKey } from "./messages/en";

type Vars = Record<string, string | number>;

function resolve(locale: Locale, m: Omit<LocalMessage, "key">): Vars {
  const v: Vars = { ...(m.vars ?? {}) };
  for (const [name, key] of Object.entries(m.keys ?? {})) v[name] = translate(locale, key as MessageKey);
  for (const [name, list] of Object.entries(m.lists ?? {})) v[name] = list.map((key) => translate(locale, key as MessageKey)).join(", ");
  for (const [name, [group, value]] of Object.entries(m.terms ?? {})) v[name] = translateTerm(locale, group, value);
  return v;
}

/** Build a notification payload: localisable message plus English fallback text. */
export function notifMsg(title: MessageKey, body: MessageKey, extra: Omit<NotificationMessage, "title" | "body"> = {}) {
  const msg: NotificationMessage = { title, body, ...extra };
  const v = resolve("en", msg);
  return { title: translate("en", title, v), body: translate("en", body, v), msg };
}

export function notifTitle(n: Notification, locale: Locale) {
  return n.msg ? translate(locale, n.msg.title as MessageKey, resolve(locale, n.msg)) : n.title;
}

export function notifBody(n: Notification, locale: Locale) {
  return n.msg ? translate(locale, n.msg.body as MessageKey, resolve(locale, n.msg)) : n.body;
}

/** Build a generated log line: English `text` plus a localisable `msg`. */
export function localText(key: MessageKey, extra: Omit<LocalMessage, "key"> = {}) {
  const msg: LocalMessage = { key, ...extra };
  return { text: translate("en", key, resolve("en", msg)), msg };
}

/** Render a generated line in the reader's language, falling back to the stored English text. */
export function msgText(entry: { text: string; msg?: LocalMessage }, locale: Locale) {
  return entry.msg ? translate(locale, entry.msg.key as MessageKey, resolve(locale, entry.msg)) : entry.text;
}
