"use client";

import { useParams } from "next/navigation";
import { RequirePermission } from "@/components/layout/workspace-shell";
import { InspectionForm } from "@/features/rajuk/inspections";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return (
    <RequirePermission permission="inspection.perform">
      <InspectionForm key={id} id={id} />
    </RequirePermission>
  );
}
