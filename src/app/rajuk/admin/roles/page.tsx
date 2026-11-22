"use client";

import { RequirePermission } from "@/components/layout/workspace-shell";
import { AdminRoles } from "@/features/admin/admin";

export default function Page() {
  return (
    <RequirePermission permission="admin.users">
      <AdminRoles />
    </RequirePermission>
  );
}
