# TOR → UI Coverage

Mapping of the RAJUK ECPS TOR (Section 6, items 1.1–1.16 and 2.1–2.14, plus selected operational items) to this prototype.

**Legend**

| Mark | Meaning |
| --- | --- |
| ✅ **Demo** | Interactive frontend demonstration with state changes across roles |
| 🟡 **Partial** | UI representation exists; part of the requirement is only shown or simulated |
| 🔧 **Backend** | Real behaviour requires backend / infrastructure implementation |
| ❓ **Clarify** | Business rules or legal details need RAJUK confirmation |

Most items carry both a UI status and 🔧, because the prototype has no backend.

## 1. Upgradation of existing modules

| TOR | Requirement (summary) | Where in the prototype | Status |
| --- | --- | --- | --- |
| 1.1 | Consolidated report: current holder, holding time per officer, total elapsed, red highlight over limit; accurate monthly reports; Constructed / Under construction / Floor-wise / Usage-wise; Excel/PDF export | `/rajuk/inbox` (holder, held vs limit, red rows, CSV), `/rajuk/monitoring` (holding report, officer register, report categories, CSV/print), `/rajuk/admin/workflow` (limits), `/rajuk/admin/scheduler` (monthly report job) | ✅ Demo · 🔧 report accuracy depends on data · ❓ limits |
| 1.2 | Construction Start Notice improvements | Service page `/services/construction-start-notice`; seeded CSN file in officer queue; inspection type “construction start” | 🟡 Partial · ❓ requirements “as provided by RAJUK” |
| 1.3 | PP: 2025-rule payments, routing to Town Planning/Law/Management/Estate, MFA at approval, summary report, forms/letters, workflow | PP wizard; PP flow DTP → TP → CTP; route-to-department in review; Estate NOC; MFA dialog on approve/reject; illustrative fee | ✅ Demo · ❓ rules, letters |
| 1.4 | CP: automatic fee by occupancy & area, auto-stamped file number, Yes/No confirmation on file movement, sub-zone / 240-block routing, department routing, in-browser signing, professional replacement, certificate validation, MFA, verify DTP approvals from server, letters wording, BC minutes names, no “Correction” at 2nd presentation | Wizard fee preview (`fees.ts`); `DrawingSheet` stamps file number; `ConfirmDialog` on every move; sub-zone/block routing preview in wizard & key facts; signing workspace; **Request replacement** dialog on the Professionals tab (new professional + reason, recorded in history, new invitation sent); professionals upload revisions and **Endorse current drawings**; **Decision letter** preview with approval / approval-with-fee / rejection wording and the construction-term note; certificate check; MFA; Estate PP verification; committee members in minutes; 2nd-presentation rule enforced in UI and store | ✅ Demo · 🔧 signing/certificates · ❓ fee schedule, approved letter templates, replacement rules |
| 1.5 | RDC: same set as CP | RDC files in queues, CP-style flow, signing | 🟡 Partial (no RDC-specific wizard) |
| 1.6 | LSP option active for holders of 2008-rule approvals | LSP service page, LSP file in queue | 🟡 Partial · ❓ eligibility rule |
| 1.7 | Housing data integration (NHA, PWD, approved private projects) using RS Dag/Mouza | Private-housing PP: project lookup fills mouza; RS/CS dag fields; integration register | 🟡 Partial · 🔧 data source |
| 1.8 | Upgrade integrations: NID, IAB/IEB/BIP, SMS, payment | Registration flows (NID, membership), verification badges, simulated payment, integration register | 🟡 Partial · 🔧 |
| 1.9 | RBAC, MFA in PP/CP/RDC approvals, password policy, OTP on untrusted device, first-login password change, 15-min configurable auto-logout, certificate validation | Permission-aware nav + `RequirePermission`; MFA dialog; `/sign-in/verify`; `/sign-in/change-password` (policy from admin); idle-timeout warning and sign-out using `/rajuk/admin/security` setting; certificate step | ✅ Demo (frontend) · 🔧 server enforcement |
| 1.10 | File processing for PP/CP/RDC/LC/OC/Renewal/Appeal; RISE location data; PP up to TP & CTP; new BC committees with external experts | Flows in `workflow.ts`; PP to CTP; committee formation in admin with external expert flag; location data in wizard and review | 🟡 Partial · ❓ RISE/DCQR details |
| 1.11 | Structural & fire-safety checklists from DCQR | Review checklist sections “Structural design”, “Fire safety design” (representative) | 🟡 Partial · ❓ DCQR outputs |
| 1.12 | FRCM app & inspection: IoT data, DAP map integration, custom fields | Mobile inspector workflow with checklist, GPS, photos, DAP overlay on simulated map | 🟡 Partial · 🔧 IoT, FRCM app · ❓ fields |
| 1.13 | PDF signer: sign without download/upload, all pages, no partial/overlap/wrong-sheet, count after download, latest approved version, post-vote auto-sign → fee & drawing request | `/rajuk/signing/[id]`: page rail, slots, FAR sheet excluded, version lock, post-render count; committee “post-vote automation” toggle → fee request; applicant uploads separate **electrical** and **plumbing** drawings and submits them before the fee can be paid | ✅ Demo (simulated) · 🔧 signing service/dongle |
| 1.14 | Edit permissions for users | Draft editing for applicants; holder-only actions; admin role matrix (read-only in prototype) | 🟡 Partial · ❓ |
| 1.15 | Update FAR values and calculation | `/rajuk/admin/parameters` editable FAR table; FAR checks in wizard and review | ✅ Demo · ❓ official values |
| 1.16 | Gazette-driven updates; regenerate/correct letters; digital office code | Notices for regulatory updates; revert flow supports re-decision; officer **Regenerate letter** (reason required) issues a new letter version, recorded in history and shown to the applicant | 🟡 Partial · ❓ gazette feed, office code format |

## 2. New modules and functions

| TOR | Requirement | Where | Status |
| --- | --- | --- | --- |
| 2.1 | PP for plots in RAJUK-approved private housing projects (Town Planning HQ) | Service + wizard type “PP — Approved Private Housing”, housing project selector, seeded file at Town Planner | ✅ Demo · ❓ process |
| 2.2 | BIDA and other integrations (IDEB), bidirectional sync | `/rajuk/integrations` register (BIDA, IDEB…) with mock checks | 🟡 Partial · 🔧 |
| 2.3 | Mandatory GPS, plot & road photos; Google Maps if key provided; DAP link | Wizard location step (blocking validation), `SiteMap` simulated with DAP overlay, inspector GPS distance check | ✅ Demo · 🔧 Maps key |
| 2.4 | Occupancy Certificate appeal | Rejected OC → “File appeal” creates linked OC appeal at Front Desk | ✅ Demo · ❓ procedure |
| 2.5 | Management dashboards | `/rajuk/management` | ✅ Demo (illustrative series) · 🔧 data |
| 2.6 | Finance dashboard and reports | `/rajuk/finance` with filters, reports, reconciliation | ✅ Demo · 🔧 gateway settlement |
| 2.7 | 2C file management (Building Construction Act 1952) | `/rajuk/2c-files` register, documents, movement log | 🟡 Partial · ❓ legal fields |
| 2.8 | Admin panel: single user profile, DAP/FAR data, parameters, scheduler, reports, roles, mobile/email login, committee formation | `/rajuk/admin/*` | ✅ Demo · 🔧 |
| 2.9 | All applicants with NID, tax return, photo in separate tabs; GPS & photos mandatory | Wizard owners step (per-owner tabs), validation; review checklist item | ✅ Demo |
| 2.10 | Monitoring to Building Inspector level, performance tracking, “Register” of disposals | `/rajuk/monitoring` officer register with hierarchy filter | ✅ Demo |
| 2.11 | Migrate data from legacy CP system | `/rajuk/integrations` migration batches; legacy record visible in inbox (“LEGACY”) | 🟡 Partial · 🔧 |
| 2.12 | File revert (on-process/archive/approved/rejected) | `/rajuk/reverts` request + approval, file returns to desk | ✅ Demo · ❓ authority |
| 2.13 | Estate access: upload NOC, verify PP | `/rajuk/estate` | ✅ Demo |
| 2.14 | Public Register of approved PP/CP (owners, floor limits, units, setbacks) | `/public-register`, `/public-register/[permitNo]`, `/verify`; demo-issued permits appear automatically | ✅ Demo · 🔧 publication rules |

## Operational items

| TOR | Item | Where | Status |
| --- | --- | --- | --- |
| §4 | Notify users of maintenance via portal | Admin → System notifications → landing “Notices” | ✅ Demo |
| §6 | Helpdesk: ticket with tracking number, logging, categories, status, user can log & follow | `/workspace/support`, `/support`, `/rajuk/helpdesk` | ✅ Demo · ❓ SLA (Annex-2) |
| §3.5 | Audit trail of user actions | `/rajuk/admin/audit`, per-file audit tab | ✅ Demo · 🔧 |
| §3.4 | Google Maps, SSLCommerz, SSL Wireless in stack | Integration register, simulated map/payment/OTP | 🔧 |

## Items needing RAJUK clarification (summary)

Official 2025 fee schedule; FAR values; stage sequences and holding limits; letter templates and wording; professional replacement rules; DCQR structural/fire checklists; FRCM fields; 2C legal record structure; revert approval authority; LSP eligibility; Public Register publication rules; SLA targets (Annex-2); BCC findings (Annex-3).
