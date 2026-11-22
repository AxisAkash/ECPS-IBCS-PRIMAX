"use client";

import { useDemoStore } from "@/lib/store/demo-store";
import { sleep } from "@/lib/utils";
import type { EcpsServices } from "../types";

/** Simulated network latency so loading states are visible and realistic. */
const LATENCY = { fast: 350, normal: 700, slow: 1400 };
const s = () => useDemoStore.getState();

async function run<T>(fn: () => T, ms = LATENCY.normal): Promise<T> {
  await sleep(ms);
  return fn();
}

export const mockServices: EcpsServices = {
  mode: "mock",
  auth: {
    demoSignIn: (role) => run(() => s().signInAs(role), LATENCY.normal),
    // Demo OTP: any 6-digit code is accepted EXCEPT 000000, which demonstrates the error state.
    verifyOtp: (code) => run(() => /^\d{6}$/.test(code) && code !== "000000", LATENCY.normal),
    signOut: () => run(() => s().signOut(), LATENCY.fast),
  },
  applications: {
    createDraft: (type) => run(() => s().createDraft(type), LATENCY.fast),
    saveDraft: (id, patch) => run(() => s().updateApplication(id, patch), LATENCY.fast),
    submit: (id) => run(() => s().submitApplication(id), LATENCY.slow),
    resubmitCorrection: (id, note) => run(() => s().resubmitCorrection(id, note)),
    inviteProfessional: (id, userId, role) => run(() => s().inviteProfessional(id, userId, role)),
    respondToInvitation: (id, userId, accept, note) => run(() => s().respondInvitation(id, userId, accept, note)),
    payFee: (id, channel) => run(() => s().payFee(id, channel), LATENCY.slow),
    fileAppeal: (id, grounds) => run(() => s().fileAppeal(id, grounds)),
    replaceProfessional: (id, oldUserId, newUserId, reason) => run(() => s().replaceProfessional(id, oldUserId, newUserId, reason)),
    endorseDrawings: (id) => run(() => s().endorseDrawings(id)),
    submitServiceDrawings: (id) => run(() => s().notifyServiceDrawings(id)),
  },
  files: {
    take: (id) => run(() => s().takeFile(id), LATENCY.fast),
    forward: (id, toStage, toUserId, note) => run(() => s().forwardFile(id, toStage, toUserId, note)),
    routeToDepartment: (id, dept, note) => run(() => s().routeToDepartment(id, dept, note)),
    requestCorrection: (id, note) => run(() => s().requestCorrection(id, note)),
    setChecklistItem: (id, item) => run(() => s().setChecklistItem(id, item), 0),
    addObservation: (id, text, visibility) => run(() => s().addObservation(id, text, visibility), LATENCY.fast),
    listForCommittee: (id) => run(() => s().listForCommittee(id)),
    decide: (id, decision, note) => run(() => s().decideFile(id, decision, note)),
  },
  signing: {
    validateCertificate: () =>
      run(() => {
        const userId = s().session?.userId ?? "user";
        const validTo = new Date(Date.now() + 200 * 86400000).toISOString();
        return {
          serial: `DEMO-CA-7F21-${userId.slice(-4).toUpperCase()}`,
          issuer: "Demo Certifying Authority (simulated)",
          validTo,
          simulated: true as const,
        };
      }, LATENCY.slow),
    sign: (packageId) => run(() => s().signPackage(packageId), LATENCY.slow),
  },
  inspections: {
    saveDraft: (id, patch) => run(() => s().updateInspection(id, patch), LATENCY.fast),
    submit: (id, outcome) => run(() => s().submitInspection(id, outcome), LATENCY.slow),
  },
  helpdesk: {
    create: (t) => run(() => s().createTicket(t)),
    reply: (id, text) => run(() => s().replyTicket(id, text), LATENCY.fast),
    setStatus: (id, status) => run(() => s().setTicketStatus(id, status), LATENCY.fast),
  },
};
