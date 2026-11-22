/**
 * REST adapter SCAFFOLD for a future ECPS .NET / DotGov API.
 *
 * Nothing here is connected. Each method documents the endpoint shape a backend team could expose;
 * calling any method throws so the prototype can never imply that a live integration exists.
 * Endpoint paths are proposals and must be agreed with RAJUK and the backend team.
 */
import type { EcpsServices } from "../types";

class NotConfiguredError extends Error {
  constructor(endpoint: string) {
    super(`ECPS HTTP adapter is not configured (would call ${endpoint}). Use NEXT_PUBLIC_ECPS_API_MODE=mock.`);
    this.name = "NotConfiguredError";
  }
}

const notConfigured =
  (endpoint: string) =>
  async (..._args: unknown[]): Promise<never> => {
    throw new NotConfiguredError(endpoint);
  };

export const httpServices: EcpsServices = {
  mode: "http",
  auth: {
    demoSignIn: notConfigured("POST /api/v1/auth/sign-in (+ /mfa/challenge, /otp/verify)"),
    verifyOtp: notConfigured("POST /api/v1/auth/otp/verify"),
    signOut: notConfigured("POST /api/v1/auth/sign-out"),
  },
  applications: {
    createDraft: notConfigured("POST /api/v1/applications"),
    saveDraft: notConfigured("PATCH /api/v1/applications/{id}"),
    submit: notConfigured("POST /api/v1/applications/{id}/submit"),
    resubmitCorrection: notConfigured("POST /api/v1/applications/{id}/corrections"),
    inviteProfessional: notConfigured("POST /api/v1/applications/{id}/professionals"),
    respondToInvitation: notConfigured("POST /api/v1/invitations/{id}/response"),
    payFee: notConfigured("POST /api/v1/payments/{id}/initiate (payment gateway redirect)"),
    fileAppeal: notConfigured("POST /api/v1/applications/{id}/appeals"),
  },
  files: {
    take: notConfigured("POST /api/v1/files/{id}/take"),
    forward: notConfigured("POST /api/v1/files/{id}/forward"),
    routeToDepartment: notConfigured("POST /api/v1/files/{id}/route"),
    requestCorrection: notConfigured("POST /api/v1/files/{id}/correction-request"),
    setChecklistItem: notConfigured("PUT /api/v1/files/{id}/checklist/{itemId}"),
    addObservation: notConfigured("POST /api/v1/files/{id}/observations"),
    listForCommittee: notConfigured("POST /api/v1/committees/agenda-items"),
    decide: notConfigured("POST /api/v1/files/{id}/decision (MFA token required)"),
  },
  signing: {
    validateCertificate: notConfigured("POST /api/v1/signing/certificate/validate"),
    sign: notConfigured("POST /api/v1/signing/packages/{id}/sign"),
  },
  inspections: {
    saveDraft: notConfigured("PATCH /api/v1/inspections/{id}"),
    submit: notConfigured("POST /api/v1/inspections/{id}/submit"),
  },
  helpdesk: {
    create: notConfigured("POST /api/v1/helpdesk/tickets"),
    reply: notConfigured("POST /api/v1/helpdesk/tickets/{id}/messages"),
    setStatus: notConfigured("PATCH /api/v1/helpdesk/tickets/{id}"),
  },
};
