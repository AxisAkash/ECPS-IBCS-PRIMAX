"use client";

import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toast";
import { I18nProvider } from "@/lib/i18n";
import { useDemoStore } from "@/lib/store/demo-store";
import type { Locale } from "@/lib/utils";

function StoreHydrator() {
  useEffect(() => {
    void useDemoStore.persist.rehydrate();
  }, []);
  return null;
}

export function Providers({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <I18nProvider initialLocale={locale}>
      <StoreHydrator />
      {children}
      <Toaster />
    </I18nProvider>
  );
}

/** True once persisted demo state has loaded on the client. Gate data-driven views on this. */
export function useHydrated() {
  return useDemoStore((s) => s.hydrated);
}
