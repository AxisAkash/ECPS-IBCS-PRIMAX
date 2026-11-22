"use client";

import { useParams } from "next/navigation";
import { RequirePermission } from "@/components/layout/workspace-shell";
import { SigningWorkspace } from "@/features/rajuk/signing";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return (
    <RequirePermission permission="document.sign">
      <SigningWorkspace key={id} id={id} />
    </RequirePermission>
  );
}
