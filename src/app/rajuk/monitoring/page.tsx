"use client";

import { RequirePermission } from "@/components/layout/workspace-shell";
import { RecordMonitoring } from "@/features/rajuk/records";

export default function Page() {
  return (
    <RequirePermission permission="monitoring.view">
      <RecordMonitoring />
    </RequirePermission>
  );
}
