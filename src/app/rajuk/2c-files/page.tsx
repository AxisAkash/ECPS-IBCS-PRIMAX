"use client";

import { RequirePermission } from "@/components/layout/workspace-shell";
import { TwoCFiles } from "@/features/rajuk/records";

export default function Page() {
  return (
    <RequirePermission permission="twoc.manage">
      <TwoCFiles />
    </RequirePermission>
  );
}
