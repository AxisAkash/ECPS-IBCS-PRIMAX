import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter, Manrope, Noto_Sans_Bengali } from "next/font/google";
import { cookies } from "next/headers";
import { Providers } from "@/components/layout/providers";
import { LOCALE_COOKIE } from "@/lib/i18n/constants";
import { translate } from "@/lib/i18n/core";
import { serverLocale } from "@/lib/i18n/server";
import { parseTheme, THEME_COOKIE } from "@/lib/theme/constants";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap", weight: ["500", "600", "700", "800"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-plex-mono", display: "swap", weight: ["400", "500", "600"] });
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-noto-bengali", display: "swap", weight: ["400", "500", "600", "700"] });

export async function generateMetadata(): Promise<Metadata> {
  const locale = await serverLocale();
  return {
    title: { default: translate(locale, "meta.default"), template: translate(locale, "meta.template") },
    description: translate(locale, "meta.description"),
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#14263d",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const locale = store.get(LOCALE_COOKIE)?.value === "bn" ? "bn" : "en";
  const theme = parseTheme(store.get(THEME_COOKIE)?.value);
  return (
    // suppressHydrationWarning: browser extensions (e.g. writing assistants) add attributes to <html>/<body>
    // before React hydrates. This only ignores those elements' own attributes, not their children.
    <html lang={locale} className={`${inter.variable} ${manrope.variable} ${plexMono.variable} ${bengali.variable}`} data-theme={theme} style={{ colorScheme: theme }} suppressHydrationWarning>
      <body className="min-h-dvh" suppressHydrationWarning>
        <Providers locale={locale} theme={theme}>{children}</Providers>
      </body>
    </html>
  );
}
