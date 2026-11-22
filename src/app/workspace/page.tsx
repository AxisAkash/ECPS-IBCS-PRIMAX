"use client";

import { ApplicantDashboard } from "@/features/workspace/applicant-dashboard";
import { ProfessionalDashboard } from "@/features/workspace/professional";
import { useDemoStore } from "@/lib/store/demo-store";

export default function WorkspaceHomePage() {
  const role = useDemoStore((s) => s.session?.role);
  return role === "professional" ? <ProfessionalDashboard /> : <ApplicantDashboard />;
}
