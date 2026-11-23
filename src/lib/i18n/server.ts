import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { Locale } from "@/lib/utils";
import { LOCALE_COOKIE } from "./constants";
import { translate } from "./core";
import type { MessageKey } from "./messages/en";

/** Locale for server components and metadata, from the same cookie the client switcher writes. */
export async function serverLocale(): Promise<Locale> {
  return (await cookies()).get(LOCALE_COOKIE)?.value === "bn" ? "bn" : "en";
}

/** Localised page title for `generateMetadata`. */
export async function pageTitle(key: MessageKey): Promise<Metadata> {
  return { title: translate(await serverLocale(), key) };
}
