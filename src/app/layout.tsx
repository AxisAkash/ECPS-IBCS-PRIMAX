import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter, Manrope, Noto_Sans_Bengali } from "next/font/google";
import { cookies } from "next/headers";
import { Providers } from "@/components/layout/providers";
import { LOCALE_COOKIE } from "@/lib/i18n/constants";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap", weight: ["500", "600", "700", "800"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-plex-mono", display: "swap", weight: ["400", "500", "600"] });
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-noto-bengali", display: "swap", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: "ECPS — Electronic Construction Permitting System (Prototype)", template: "%s · ECPS Prototype" },
  description:
    "Proposed modernised frontend for RAJUK's Electronic Construction Permitting System. Demonstration prototype by IBCS-PRIMAX — all records are fictional.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#14263d",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const locale = store.get(LOCALE_COOKIE)?.value === "bn" ? "bn" : "en";
  return (
    // suppressHydrationWarning: browser extensions (e.g. writing assistants) add attributes to <html>/<body>
    // before React hydrates. This only ignores those elements' own attributes, not their children.
    <html lang={locale} className={`${inter.variable} ${manrope.variable} ${plexMono.variable} ${bengali.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh" suppressHydrationWarning>
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
