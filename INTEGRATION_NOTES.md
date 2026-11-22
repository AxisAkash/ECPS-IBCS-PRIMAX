# Integration Notes

How a delivery team can connect this frontend to the live ECPS platform (DotGov framework, .NET / ASP.NET Core, SQL Server, IIS, Azure DevOps — TOR §3.4). **None of these integrations exist in the prototype.** This document describes a path, not completed work.

## 1. Architecture boundary

```
React components ──▶ ecps.* service contracts ──▶ adapter
                     (src/lib/services/types.ts)   ├─ mock  (in-browser demo store)
                                                   └─ http  (scaffold → .NET REST API)
```

- All state-changing UI actions already go through `ecps.applications`, `ecps.files`, `ecps.signing`, `ecps.inspections`, `ecps.helpdesk`, `ecps.auth`.
- Reads currently come from the demo store (`useDemoStore`). In production, replace them with query hooks (e.g. TanStack Query) that call the same API and keep `src/lib/domain/types.ts` as the client model.
- `NEXT_PUBLIC_ECPS_API_MODE=http` switches the adapter; the scaffold throws `NotConfiguredError` with the proposed endpoint so nothing can silently pretend to work.

### Suggested sequence

1. Agree the API contract (OpenAPI) from `types.ts` and `services/http/index.ts` endpoint list.
2. Implement read endpoints and a query layer; keep the mock adapter for UI tests.
3. Implement commands (submit, forward, decide, sign) with server-side validation and audit.
4. Remove `localStorage` persistence and the demo role selector from production builds.

## 2. Authentication & session (TOR 1.9)

- Use the platform's identity service (or an OIDC provider fronting it). Store tokens in **HttpOnly, Secure, SameSite** cookies via a Next.js route handler/BFF — never in `localStorage`.
- **MFA at approval:** the approval/signing endpoints must require a fresh step-up token; `MfaDialog` becomes the UI for the server challenge.
- **OTP on untrusted devices**, **first-login password change**, **password policy**: enforced server-side; the screens under `/(auth)` are ready to bind.
- **Inactivity logout:** keep the client warning (`IdleTimeout` in `workspace-shell.tsx`) but enforce expiry with server session lifetime; read the timeout from the admin configuration API.
- **RBAC:** server authorises every endpoint. The client `ROLE_PERMISSIONS` map is for navigation only; populate it from the user's claims.

## 3. Applications & workflow (TOR 1.3–1.5, 1.10)

| UI action | Proposed endpoint |
| --- | --- |
| Create / save draft | `POST /api/v1/applications`, `PATCH /api/v1/applications/{id}` |
| Submit | `POST /api/v1/applications/{id}/submit` (server assigns reference, sub-zone/block routing, file-number stamping) |
| Take / forward / route / correction | `POST /api/v1/files/{id}/take|forward|route|correction-request` (each with confirmation token from the Yes/No dialog) |
| Decide | `POST /api/v1/files/{id}/decision` (MFA step-up) |
| Committee listing & votes | `POST /api/v1/committees/agenda-items`, `POST /api/v1/committees/items/{id}/votes` |

Workflow stages, holding limits and routing must come from the DotGov BPMS configuration rather than `workflow.ts`.

## 4. Documents & storage

- Upload with pre-signed or chunked uploads to the document store; virus-scan and checksum on the server; keep versions (the UI already shows superseded versions).
- Serve previews as server-rendered page images or PDF.js; replace `DocumentPreview` sample renderers.
- File-number stamping on drawings (TOR 1.4) should be done server-side on ingest.

## 5. Digital signing (TOR 1.4, 1.5, 1.13)

- Integrate the approved signing middleware (dongle/HSM or remote signing) through a server endpoint; the browser never handles private keys.
- Server responsibilities: lock the approved version, compute placement per signable page using title-block coordinates, prevent overlaps by slot, sign all design pages, re-render and **count signatures after signing**, validate certificate chain/CRL/OCSP.
- The UI steps (version check → certificate validation → placement preview → MFA → progress → verification) map directly to these calls.

## 6. Payments (TOR 1.8, 2.6)

- Fee calculation must use the approved 2025 rule set served by the API (`fees.ts` is illustrative only).
- Payment initiation via the gateway (SSLCommerz per TOR stack) with server-side IPN/callback verification; never trust client confirmation.
- Reconciliation reads settlement files/API; the finance queue's “Match” becomes a server reconciliation action.

## 7. Maps & location (TOR 2.3)

- Google Maps JavaScript API **only if RAJUK provides a key** (`NEXT_PUBLIC_GOOGLE_MAPS_KEY`). Restrict the key by HTTP referrer.
- Replace `SiteMap` internals while keeping its props (`lat`, `lng`, `onChange`, `device`). DAP land-use should come from RAJUK's DAP layers (WMS/vector tiles) rather than the illustrative overlay.

## 8. External systems (TOR 1.7, 1.8, 2.2)

| System | Purpose | Notes |
| --- | --- | --- |
| NID (Election Commission) | Applicant identity verification | Server-to-server, data minimisation, no NID numbers stored in logs |
| IAB / IEB / BIP / IDEB | Professional verification | Membership lookup; cache results with expiry |
| BIDA OSS | Bidirectional application sync | Message contract, idempotency keys, error queues, notifications |
| NHA / PWD / private housing data | Plot identifiers (RS Dag, Mouza) | Import or API; feeds the private-housing PP selector |
| SMS gateway | OTP and status messages | Rate limiting and template approval |

Each requires a partner agreement, specification and test environment before development.

## 9. Legacy CP migration (TOR 2.11)

Batch ETL with profiling, mapping, trial migration, validation rules (e.g. missing RS dag, duplicate file numbers) and reconciliation reports. The migration monitor screen expects per-batch `records / migrated / failed / status`.

## 10. Hosting, security and operations

- Build: `next build` produces a Node server; host behind IIS/ARR or a reverse proxy, or containerise. CI/CD in Azure DevOps (TOR §3).
- Add CSP, HSTS and the existing security headers (`next.config.ts`); remove `robots: noindex` only for the real public site.
- Follow OWASP secure-coding guidance; log audit events server-side (the UI shows them, it does not create authoritative records).
- Accessibility and e2e tests (`tests/e2e`) should run in the pipeline against a seeded test environment.
