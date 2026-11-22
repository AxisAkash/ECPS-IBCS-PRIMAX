"use client";

import { useParams } from "next/navigation";
import { ApplicationWizard } from "@/features/wizard/wizard";

export default function EditApplicationPage() {
  const { id } = useParams<{ id: string }>();
  return <ApplicationWizard key={id} id={id} />;
}
