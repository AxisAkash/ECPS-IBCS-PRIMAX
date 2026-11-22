"use client";

import { Suspense } from "react";
import { RequirePermission } from "@/components/layout/workspace-shell";
import { FileInbox } from "@/features/rajuk/inbox";

export default function InboxPage() {
  return (
    <RequirePermission permission={["file.view_zone", "file.process"]}>
      <Suspense>
        <FileInbox />
      </Suspense>
    </RequirePermission>
  );
}
