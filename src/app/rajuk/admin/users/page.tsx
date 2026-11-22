"use client";

import { RequirePermission } from "@/components/layout/workspace-shell";
import { AdminUsers } from "@/features/admin/admin";

export default function Page() {
  return (
    <RequirePermission permission="admin.users">
      <AdminUsers />
    </RequirePermission>
  );
}
