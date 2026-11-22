"use client";

import { RequirePermission } from "@/components/layout/workspace-shell";
import { EstateWorkspace } from "@/features/rajuk/records";

export default function Page() {
  return (
    <RequirePermission permission="estate.noc">
      <EstateWorkspace />
    </RequirePermission>
  );
}
