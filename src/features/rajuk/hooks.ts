"use client";

import { useMemo } from "react";
import type { Application, StageKey, User } from "@/lib/domain/types";
import { holdingInfo } from "@/lib/domain/workflow";
import { useDemoStore } from "@/lib/store/demo-store";

export const ACTIVE = (a: Application) => !["draft", "approved", "rejected", "appealed"].includes(a.status);

export function useRajukData() {
  const session = useDemoStore((s) => s.session);
  const users = useDemoStore((s) => s.users);
  const applications = useDemoStore((s) => s.applications);
  const limits = useDemoStore((s) => s.holdingLimits);
  const me = useMemo(() => users.find((u) => u.id === session?.userId), [users, session]);
  const enriched = useMemo(
    () =>
      applications
        .filter((a) => a.status !== "draft")
        .map((a) => ({ ...a, holding: holdingInfo(a, limits), holderName: users.find((u) => u.id === a.holderId)?.name })),
    [applications, limits, users],
  );
  return { me, users, applications: enriched, limits };
}

export type EnrichedApplication = ReturnType<typeof useRajukData>["applications"][number];

/** Officers eligible to receive a file at a given stage (illustrative designation mapping). */
export function candidatesFor(stage: StageKey, users: User[], zone?: string): User[] {
  const by = (designation: string) => users.filter((u) => u.designation === designation && u.status === "active" && (!zone || !u.zone || u.zone === zone));
  switch (stage) {
    case "building_inspector":
      return users.filter((u) => u.role === "inspector" && u.status === "active");
    case "chief_building_inspector":
      return by("Chief Building Inspector");
    case "assistant_authorized_officer":
      return by("Assistant Authorized Officer");
    case "authorized_officer":
      return by("Authorized Officer");
    case "deputy_town_planner":
      return by("Deputy Town Planner");
    case "town_planner":
      return by("Town Planner");
    case "chief_town_planner":
      return by("Chief Town Planner");
    case "signing":
      return by("Authorized Officer");
    default:
      return [];
  }
}
