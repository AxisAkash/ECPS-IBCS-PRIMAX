"use client";

import { RequirePermission } from "@/components/layout/workspace-shell";
import { FinanceDashboard } from "@/features/rajuk/analytics";

export default function Page() {
  return (
    <RequirePermission permission="finance.view">
      <FinanceDashboard />
    </RequirePermission>
  );
}
