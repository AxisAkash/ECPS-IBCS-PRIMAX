"use client";

import type { Application, DocumentCategory, DrawingSheetKind, FeeLine, OccupancyKey, ProfessionalRole, ServiceType } from "@/lib/domain/types";
import { ROLES } from "@/lib/domain/roles";
import { nextActionKey } from "@/lib/domain/workflow";
import { useI18n } from "./index";
import type { MessageKey } from "./messages/en";

/**
 * Localised labels for domain values, shared by every screen so a stage, status or service
 * reads the same everywhere. Everything resolves through the single message dictionary.
 */
export function useLabels() {
  const { t, term, locale } = useI18n();
  const k = (key: string) => t(key as MessageKey);
  return {
    locale,
    stage: (s: string) => k(`stage.${s}`),
    status: (s: string) => k(`status.${s}`),
    service: (type: ServiceType) => k(`svcs.${type}`),
    serviceName: (type: ServiceType) => k(`service.${type}.name`),
    occ: (o: OccupancyKey) => k(`occ.${o}`),
    pro: (r: ProfessionalRole) => k(`pro.${r}`),
    doc: (c: DocumentCategory) => k(`doc.${c}`),
    sheet: (s: DrawingSheetKind) => k(`sheet.${s}`),
    dept: (d: string) => k(`dept.${d}`),
    role: (r: string) => k(`role.${r}`),
    outcome: (o: string) => k(`outcome.${o}`),
    ticket: (s: string) => k(`tkst.${s}`),
    next: (app: Application) => k(nextActionKey(app)),
    zone: (z: string | undefined) => term("zone", z),
    desig: (d: string | undefined) => term("desig", d),
    act: (a: string) => k(`act.${a}`),
    /** Readable label for an audit action code; unknown codes are shown as recorded. */
    audit: (code: string) => term("auditact", code),
    /** Audit targets that are role names are shown in the reader's language. */
    auditTarget: (target: string) => {
      const role = ROLES.find((r) => r.label === target);
      return role ? k(`role.${role.key}`) : target;
    },
    chkSection: (id: string) => k(`chk.sec.${id}`),
    chkSource: (id: string) => k(`chk.src.${id}`),
    chkItem: (id: string) => k(`chk.${id}`),
    chkHint: (id: string) => k(`chk.${id}.hint`),
    feeLine: (l: FeeLine) => t(l.key === "application" ? "fee.application" : l.label.startsWith("Planning") ? "fee.scrutiny" : "fee.area"),
  };
}
