"use client";

import { RequirePermission } from "@/components/layout/workspace-shell";
import { AdminCommittees } from "@/features/admin/admin";

export default function Page() {
  return (
    <RequirePermission permission="admin.config">
      <AdminCommittees />
    </RequirePermission>
  );
}
