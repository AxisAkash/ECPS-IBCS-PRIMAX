"use client";

import { RequirePermission } from "@/components/layout/workspace-shell";
import { AdminSecurity } from "@/features/admin/admin";

export default function Page() {
  return (
    <RequirePermission permission="admin.security">
      <AdminSecurity />
    </RequirePermission>
  );
}
