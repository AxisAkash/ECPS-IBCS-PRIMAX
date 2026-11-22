# Demo Guide — 10–15 minute walkthrough

A presenter script for showing the ECPS prototype to company management alongside the implementation-strategy deck. Each stop follows **existing problem → proposed UI improvement → user action → expected benefit**.

## Before you start

1. `npm run build && npm start` (or `npm run dev`) and open `http://localhost:3000`.
2. Open `/demo` → **Reset demo data** so every record is in its starting state.
3. Use a 1440px-wide browser window. Keep a phone-sized window (or dev-tools device mode, 390px) ready for the inspector stop.
4. Mention once, at the start: *“Everything you'll see is fictional data; anything marked SIMULATED is a design demonstration, not a live integration.”*

## Sequence (≈ 14 minutes)

| # | Time | Screen | Say / do | TOR |
| --- | --- | --- | --- | --- |
| 1 | 1:30 | **Landing** `/` | Scroll the hero: one clear path “from plot to permit”, the sample status card shows *who holds the file and for how long*. Type “add floors” in **Find a service**. Point to **What is improving** (before → proposed). Click **বাংলা** in the top bar, then back. | 2.14, 1.1 |
| 2 | 1:00 | **Sign in** `/sign-in` | Split composition, validation, OTP/first-login screens exist (`/sign-in/verify`). Explain the amber **demo role** panel is separate from production authentication. Enter as **Applicant**. | 1.9 |
| 3 | 1:30 | **Applicant dashboard** | The most important action is first: a correction request, then fee due, then the draft. Open **Continue draft** (Dhanmondi PP). | — |
| 4 | 2:30 | **PP wizard** | Step through: per-owner tabs (NID, tax, photo); press **Save and continue** with missing docs to show the error summary; **Use sample file**; location step — click the map, **Confirm plot position**, add plot/road photos (mandatory); building step FAR check; review — fee breakdown with rule-set label marked *illustrative*; declaration; **Submit** → Yes/No → success with reference. | 2.9, 2.3, 1.4, 1.15 |
| 5 | 2:30 | **Officer** (Switch role → RAJUK Officer) | Overview: workload strip, red over-limit count, the new file in the **Front Desk queue** → **Take**. Show **File inbox**: holder, held vs limit, red rows, export. Open **CP-26-Z4-01491**: key facts, drawing viewer (auto-stamped file number), checklist, add an observation, **List for BC Committee** → Yes/No. | 1.1, 1.4, 2.10 |
| 6 | 2:00 | **Digital signing** `/rajuk/signing/sp-208` | Problem: signatures only on last page, overlapping, wrong sheet, version confusion. Show locked v3, **Validate certificate** (simulated), **Show placement** — slot 2 on pages 1–5, FAR sheet excluded, no overlap with slot 1. **Sign 5 pages** → MFA (any 6 digits) → per-page progress → verified count; applicant automatically asked for fee. | 1.13, 1.9 |
| 7 | 1:00 | **Committee** (Switch → Committee User) | The second-presentation case shows only **Approve / Reject**; members are named for the minutes; post-vote automation toggle. | 1.4, 1.13 |
| 8 | 1:00 | **Inspector, phone width** `/rajuk/inspections/i-01` | Capture GPS → distance to plot; large checklist buttons; sample photo; sticky Save draft / Submit. | 2.3, 1.12 |
| 9 | 1:00 | **Management & finance** (Switch → Management) | Over-limit %, workflow distribution, holding duration, officer monitoring. Toggle **Table** to show the accessible view. Finance: collections, reconciliation queue. | 2.5, 2.6 |
| 10 | 0:45 | **Admin** (Switch → Administrator) | Security: 15-minute inactivity logout configurable; **Preview inactivity warning**. Workflow: change a holding limit → inbox highlights change. Users: duplicate profile rejected. | 1.9, 2.8 |
| 11 | 0:45 | **Public Register** `/public-register` | Search, open a permit extract (owners, floor limit, units, setbacks; no NID/tax), **Verify a permit** with the sample. If you completed the Mohammadpur fee step as the applicant, that permit appears here. | 2.14 |

## Optional extras

- Applicant → **Mohammadpur** application → upload the **electrical** and **plumbing** drawings (**Use sample file**) → **Submit service drawings** → **Pay fee** (simulated gateway) → permit issued → appears in the Public Register. Payment stays disabled until the service drawings are submitted (TOR 1.13).
- Applicant → any decided application → **Decision letter**: approval / approval-with-fee / rejection wording with the construction-term note (TOR 1.4), watermarked DEMONSTRATION and “Digitally signed (simulated)”. As the officer, **Regenerate letter** with a reason creates a new version (TOR 1.16).
- Applicant → an application under review → **Professionals** tab → **Request replacement**: pick the new professional and give a reason; the history records it and the new professional is invited (TOR 1.4).
- Professional → an application they work on → upload a revised sheet or attachment and **Endorse current drawings**; the endorsement date shows to the applicant and RAJUK.
- Switch to **বাংলা** while signed in as the applicant: the dashboard, the whole wizard (including validation errors) and the application detail are in Bangla.
- Applicant → rejected **Khilgaon OC** → **File appeal** (OC appeal, TOR 2.4).
- Estate Officer → upload NOC for the Purbachal lease plot (TOR 2.13).
- Support → helpdesk queue; Applicant → raise a ticket and watch the status change.
- `/design-system` for the component library.

## Talking points

- **Transparency:** every file shows holder, days held against a configurable limit, and total elapsed time.
- **Accountability:** every move needs Yes/No confirmation; decisions require MFA; everything is audited.
- **Fewer errors:** fee and FAR checks are calculated, not typed; signatures land on every design page of the locked version.
- **Inclusion:** Bangla on public and applicant journeys; mobile-first inspector tooling; WCAG 2.2 AA target.
- **Honesty about scope:** fees, FAR values, checklists and workflows are illustrative and await RAJUK's approved rules; integrations need partner APIs (see TOR_UI_COVERAGE.md).
