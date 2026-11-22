"use client";

import { RequirePermission } from "@/components/layout/workspace-shell";
import { AdminScheduler } from "@/features/admin/admin";

export default function Page() {
  return (
    <RequirePermission permission="admin.config">
      <AdminScheduler />
    </RequirePermission>
  );
}
