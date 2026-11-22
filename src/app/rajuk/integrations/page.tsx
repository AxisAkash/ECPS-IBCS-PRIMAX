"use client";

import { RequirePermission } from "@/components/layout/workspace-shell";
import { IntegrationsPage } from "@/features/rajuk/platform";

export default function Page() {
  return (
    <RequirePermission permission="integration.view">
      <IntegrationsPage />
    </RequirePermission>
  );
}
