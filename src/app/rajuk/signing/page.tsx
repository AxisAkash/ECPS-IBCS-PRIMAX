"use client";

import { RequirePermission } from "@/components/layout/workspace-shell";
import { SigningQueue } from "@/features/rajuk/signing";

export default function Page() {
  return (
    <RequirePermission permission="document.sign">
      <SigningQueue />
    </RequirePermission>
  );
}
