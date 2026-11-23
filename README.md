# ECPS — Electronic Construction Permitting System · Frontend Prototype

A proposed, modernised frontend experience for RAJUK's **Electronic Construction Permitting System (ECPS)**, built as a demonstration for the **IBCS-PRIMAX ECPS Upgradation, Operation & Maintenance** proposal.

> **Prototype / demonstration environment.** This is not an official RAJUK service. All people, application references, documents, permits and amounts are fictional. Steps marked **SIMULATED** (OTP, MFA, certificate validation, digital signing, payment gateway, GPS capture, integrations) do not connect to any real service.

The prototype covers three connected experiences that share one design system and one demo data layer:

| Experience | Audience | Entry |
| --- | --- | --- |
| **Public portal** | Citizens, owners, professionals exploring services, anyone verifying a permit | `/` |
| **Applicant & professional workspace** | Building owners, architects and engineers | `/workspace` |
| **RAJUK internal workspace** | Officers, inspectors, committee, Estate, Finance, management, administrators, helpdesk | `/rajuk` |

Actions in one role are visible in the others — e.g. an application submitted by the applicant appears in the officer's Front Desk queue; a committee approval creates a signing task; signing triggers a fee request; paying the fee publishes the permit to the Public Register.

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) · React 19 |
| Language | TypeScript 6, `strict` + `noUncheckedIndexedAccess` |
| Styling | Tailwind CSS v4 with custom design tokens (`src/app/globals.css`) |
| Primitives | Radix UI (`radix-ui`) — dialogs, tabs, menus, tooltips, checkbox, radio, switch, accordion |
| Icons | Lucide (used selectively) |
| Forms | React Hook Form + Zod (auth/registration), typed controlled steps (wizard) |
| Tables | TanStack Table v8 |
| Charts | Recharts 3 with a validated, colour-blind-safe palette |
| State | Zustand with `persist` (browser `localStorage`) for demo data |
| i18n | Typed EN/BN dictionaries (`src/lib/i18n`) with cookie-persisted locale |
| Fonts | Manrope, Inter, IBM Plex Mono, Noto Sans Bengali via `next/font` |
| Tests | Vitest + Testing Library (unit), Playwright + axe-core (end-to-end & accessibility) |
| Lint | ESLint 9 (`eslint-config-next`), Prettier |

Versions were taken from the npm registry at build time (November 2026). TanStack Table is pinned to v8 because v9 changed its API substantially.

## Getting started

Requirements: Node.js 22+, npm 10+.

```bash
npm install
npm run dev          # http://localhost:3000
```

No environment variables or credentials are needed. Optional settings are documented in `.env.example`.

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npx playwright install chromium` | One-off browser install for e2e |
| `npm run test:e2e` | Builds must exist first (`npm run build`); runs Playwright scenarios + axe scans against `npm start` on port 3100 |
| `npm run check` | Typecheck + lint + unit tests |

## Theme, language and branding

- **Logo:** the supplied RAJUK emblem (`public/brand/rajuk-logo.png`, unmodified) appears in every header, the sign-in panel, the footer and as the favicon. Its white areas are transparent, so it always sits on a white disc to stay correct on navy and dark surfaces.
- **Theme:** light by default. The sun/moon button switches to a designed dark theme; the choice is stored in the `ecps-theme` cookie and rendered on the server, so there is no flash on load.
- **Language:** the বাংলা / English button switches the entire interface; the choice is stored in the `ecps-locale` cookie. All text comes from one typed dictionary (`src/lib/i18n/messages/`).

## Demo roles

Demo tools are **hidden by default**. Click the dashed **Demo** button (top utility bar, sign-in page, or workspace header) to reveal them: on `/sign-in` the role list appears; elsewhere a **Demo tools** panel opens. Click **Demo** again, the close button or Esc to hide them. Every fresh page load starts hidden. No credentials are checked.

| Role | Persona (fictional) | Lands on |
| --- | --- | --- |
| Applicant | Nusrat Jahan Chowdhury, building owner | `/workspace` |
| Professional | Ar. Tanvir Hossain, architect | `/workspace` |
| RAJUK Officer | Md. Rafiqul Islam, Authorized Officer, Zone 4 | `/rajuk` |
| Inspector | Shahidul Alam, Building Inspector | `/rajuk/inspections` |
| Committee User | Dr. Farzana Haque, BC Committee external expert | `/rajuk/committee` |
| Estate Officer | Kamrul Hasan | `/rajuk/estate` |
| Finance Officer | Mahmuda Akter | `/rajuk/finance` |
| Management | Ahsan Habib, Director (demo) | `/rajuk/management` |
| Administrator | Imran Kabir | `/rajuk/admin` |
| Support | Rumana Sultana, Technical Support Engineer | `/rajuk/helpdesk` |

Switch roles at any time with **Demo → Switch demo role**; **Demo → Reset demo data** restores every record. Choosing a role closes the demo tools so they never cover the workspace. See **[DEMO_GUIDE.md](DEMO_GUIDE.md)** for a 10–15 minute presentation script.

## Mock data and the service boundary

- `src/lib/data/seed.ts` — fictional, cross-linked records (users, applications, documents, signing packages, committee meetings, inspections, payments, tickets, permits, integrations, migration batches). Dates are generated relative to the first load so holding-time indicators stay meaningful.
- `src/lib/store/demo-store.ts` — the demo state store and all state transitions (submit, forward, route, decide, sign, vote, inspect, pay, revert…). Persisted to `localStorage` under `ecps-demo-state-v1`; versioned so stale data is replaced when the seed changes.
- `src/lib/services/` — **the integration boundary**. UI components perform actions only through `ecps.*` service contracts (`types.ts`). The `mock` adapter adds realistic latency and calls the store; the `http` adapter is a non-functional scaffold documenting proposed REST endpoints and throws if used. See **[INTEGRATION_NOTES.md](INTEGRATION_NOTES.md)**.
- Rules that RAJUK must confirm are isolated and labelled: `src/lib/domain/fees.ts` (illustrative fee rule set), `workflow.ts` (stage sequences and holding limits), `checklists.ts` (representative review/inspection items).

## Repository structure

```
src/
  app/
    (public)/          Landing, services, track, verify, public register, help, guides, demo
    (auth)/            Sign-in, OTP, password change/reset, session expired, registration
    workspace/         Applicant & professional workspace (dashboard, wizard, detail, …)
    rajuk/             Internal workspace (inbox, review, signing, committee, inspections,
                       estate, monitoring, reverts, 2C, management, finance, admin, helpdesk)
    design-system/     Component and token showcase
  components/
    ui/                Design-system primitives
    brand/             RAJUK emblem (supplied asset) and hero cadastral composition
    domain/            Drawing sheets, document preview, site map, MFA dialog, status
    charts/            Chart frame, palette and chart components
    layout/            Public header/footer, workspace shell, navigation config
  features/            Screen-level features grouped by area
  lib/
    domain/            Types, catalogue, roles/RBAC, workflow, fees, checklists
    data/              Fictional seed
    store/             Demo state
    services/          Service contracts, mock adapter, HTTP scaffold
    i18n/              EN/BN dictionaries and provider
tests/
  unit/                Vitest
  e2e/                 Playwright (scenarios, public pages, mobile, axe)
```

## Documentation

- **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** — tokens, typography, components, responsive and accessibility decisions.
- **[TOR_UI_COVERAGE.md](TOR_UI_COVERAGE.md)** — mapping of TOR groups 1.1–1.16 and 2.1–2.14 to screens.
- **[DEMO_GUIDE.md](DEMO_GUIDE.md)** — presentation sequence for management.
- **[INTEGRATION_NOTES.md](INTEGRATION_NOTES.md)** — how a delivery team connects this frontend to the .NET / DotGov platform.

## Known limitations

- No backend, authentication, persistence beyond the browser, file storage, payments, signing, SMS, maps or partner integrations — all are simulated or scaffolded.
- Fees, FAR values, holding limits, workflow sequences and checklist items are **illustrative** and must be replaced with RAJUK-approved rules.
- The whole interface is available in English and Bangla (public portal, authentication, applicant and professional workspaces, every RAJUK internal screen, administration, dialogs, notifications and page titles). Kept as recorded: names, addresses, project titles and notes people typed, references and codes, audit-log details, CSV exports and engineering drawing title blocks. The developer-facing `/design-system` page is English only. Bangla copy needs review by RAJUK's language team.
- Light theme is the default; a dark theme is available from the sun/moon switch and remembered in a cookie.
- The official ECPS portal could not be fetched while building this prototype (TLS certificate error on the site), so service terminology follows the TOR rather than the live site.
