"use client";

import { RequirePermission } from "@/components/layout/workspace-shell";
import { ManagementDashboard } from "@/features/rajuk/analytics";

export default function Page() {
  return (
    <RequirePermission permission="management.view">
      <ManagementDashboard />
    </RequirePermission>
  );
}
