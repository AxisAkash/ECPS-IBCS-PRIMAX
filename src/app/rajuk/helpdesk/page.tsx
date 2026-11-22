"use client";

import { RequirePermission } from "@/components/layout/workspace-shell";
import { HelpdeskConsole } from "@/features/rajuk/platform";

export default function Page() {
  return (
    <RequirePermission permission="helpdesk.manage">
      <HelpdeskConsole />
    </RequirePermission>
  );
}
