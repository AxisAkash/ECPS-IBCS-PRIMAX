"use client";

import { useMemo } from "react";
import { useDemoStore } from "@/lib/store/demo-store";

export function useMe() {
  const session = useDemoStore((s) => s.session);
  const users = useDemoStore((s) => s.users);
  return useMemo(() => (session ? users.find((u) => u.id === session.userId) : undefined), [session, users]);
}

/** Applications visible to the signed-in applicant or professional. */
export function useMyApplications() {
  const session = useDemoStore((s) => s.session);
  const applications = useDemoStore((s) => s.applications);
  return useMemo(() => {
    if (!session) return [];
    if (session.role === "professional")
      return applications.filter((a) => a.professionals.some((p) => p.userId === session.userId && p.status === "accepted"));
    return applications.filter((a) => a.applicantId === session.userId);
  }, [session, applications]);
}

export function useInvitations() {
  const session = useDemoStore((s) => s.session);
  const applications = useDemoStore((s) => s.applications);
  return useMemo(() => {
    if (!session) return [];
    return applications.flatMap((a) =>
      a.professionals.filter((p) => p.userId === session.userId).map((p) => ({ app: a, participation: p })),
    );
  }, [session, applications]);
}

export function useUsers() {
  return useDemoStore((s) => s.users);
}

export function useApplication(id: string) {
  const applications = useDemoStore((s) => s.applications);
  return useMemo(() => applications.find((a) => a.id === id), [applications, id]);
}
