"use client";

import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toast";
import { I18nProvider } from "@/lib/i18n";
import { useDemoStore } from "@/lib/store/demo-store";
import { ThemeProvider } from "@/lib/theme";
import type { Theme } from "@/lib/theme/constants";
import type { Locale } from "@/lib/utils";

function StoreHydrator() {
  useEffect(() => {
    void useDemoStore.persist.rehydrate();
  }, []);
  return null;
}

export function Providers({ locale, theme, children }: { locale: Locale; theme: Theme; children: ReactNode }) {
  return (
    <ThemeProvider initialTheme={theme}>
      <I18nProvider initialLocale={locale}>
        <StoreHydrator />
        {children}
        <Toaster />
      </I18nProvider>
    </ThemeProvider>
  );
}

/** True once persisted demo state has loaded on the client. Gate data-driven views on this. */
export function useHydrated() {
  return useDemoStore((s) => s.hydrated);
}
