"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageSkeleton } from "@/components/ui/feedback";
import { OfficerDashboard } from "@/features/rajuk/officer-dashboard";
import { roleMeta } from "@/lib/domain/roles";
import { useDemoStore } from "@/lib/store/demo-store";

export default function RajukHomePage() {
  const router = useRouter();
  const role = useDemoStore((s) => s.session?.role);
  useEffect(() => {
    if (role && role !== "officer") router.replace(roleMeta(role).home);
  }, [role, router]);
  if (role !== "officer") return <PageSkeleton />;
  return <OfficerDashboard />;
}
