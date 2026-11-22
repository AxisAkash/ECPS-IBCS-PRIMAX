"use client";

import { RequirePermission } from "@/components/layout/workspace-shell";
import { CommitteeWorkspace } from "@/features/rajuk/committee";

export default function Page() {
  return (
    <RequirePermission permission={["committee.vote", "file.route"]}>
      <CommitteeWorkspace />
    </RequirePermission>
  );
}
