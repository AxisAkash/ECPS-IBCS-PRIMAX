"use client";

import { RequirePermission } from "@/components/layout/workspace-shell";
import { InspectionList } from "@/features/rajuk/inspections";

export default function Page() {
  return (
    <RequirePermission permission="inspection.perform">
      <InspectionList />
    </RequirePermission>
  );
}
