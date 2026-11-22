"use client";

import { RequirePermission } from "@/components/layout/workspace-shell";
import { AdminAudit } from "@/features/admin/admin";

export default function Page() {
  return (
    <RequirePermission permission="audit.view">
      <AdminAudit />
    </RequirePermission>
  );
}
