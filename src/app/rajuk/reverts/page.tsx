"use client";

import { RequirePermission } from "@/components/layout/workspace-shell";
import { FileReverts } from "@/features/rajuk/records";

export default function Page() {
  return (
    <RequirePermission permission="file.revert">
      <FileReverts />
    </RequirePermission>
  );
}
