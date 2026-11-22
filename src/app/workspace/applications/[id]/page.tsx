"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { ApplicationDetail } from "@/features/workspace/application-detail";

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <Suspense>
      <ApplicationDetail key={id} id={id} />
    </Suspense>
  );
}
