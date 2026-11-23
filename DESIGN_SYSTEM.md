# ECPS Design System

**Direction:** government trust + architectural precision + modern product craft.
The interface borrows quietly from construction drawings and cadastral maps — hairline frames, mono reference labels, title-block metadata, survey linework — but every decorative choice is subordinate to legibility and task completion.

Live showcase: **`/design-system`**. Tokens live in `src/app/globals.css` (`@theme`), primitives in `src/components/ui`.

---

## 1. Colour

A deliberately narrow palette. Structure is navy/slate; **teal** means *action and progress*; **amber** means *attention* and is also the “your plot / demo” highlight. Semantic colours are reserved for state.

| Token | Hex | Use |
| --- | --- | --- |
| `navy-900` | `#14263D` | Primary dark surfaces, RAJUK sidebar, decision headers |
| `navy-950` | `#0C1828` | Utility bar, footer |
| `slate-ink` | `#304A68` | Secondary structure, icons |
| `teal-600` | `#167D8D` | Primary buttons, links, focus ring, completed progress |
| `teal-700/800` | `#11697A` / `#0D5965` | Teal text on light surfaces (AA) |
| `amber-500` | `#E7A23B` | Accent CTA on navy, attention, signature placement preview |
| `amber-700` | `#8A5A10` | Amber text on light surfaces (AA) |
| `canvas` | `#F4F7FA` | Page background |
| `surface` | `#FFFFFF` | Panels, forms |
| `line` / `line-strong` | `#DFE6ED` / `#C9D4DF` | Hairlines, control borders |
| `ink` | `#253244` | Body text (≈12.6:1 on white) |
| `ink-strong` | `#14263D` | Headings |
| `muted` | `#5A6A7E` | Secondary text (≈5.6:1 on white) |
| `success-*`, `warning-*`, `danger-*` | | State only — never decoration or a chart series |

Amber is never used for body text (fails contrast); `amber-700` is used instead.

### Chart palette

Validated with the dataviz six-check validator on the light surface (lightness band, chroma floor, CVD ΔE ≥ 8, normal-vision ΔE ≥ 15, contrast ≥ 3:1): **`#008AA8`, `#B97000`, `#5157C4`, `#B23F7D`**, assigned in fixed order. Red `#B8322A` is reserved for “over holding limit”. Every multi-series chart has a legend; every chart has tooltips and a **Table** toggle (`ChartFrame`).

### Dark theme

Light is the default. Dark mode is a designed set of values, not an inversion: tokens are redefined under `[data-theme="dark"]` in `globals.css` (deep navy canvas `#0B1521`, lifted surfaces `#111E2E`/`#142335`/`#1A2B40`, text `#D3DCE7`/`#F0F4F9`, muted `#9AABBF`, tints re-stepped so every text pair meets WCAG AA). Brand fills that carry white text keep their values. An `emphasis` token (navy in light, steel blue `#42628C` in dark) marks selected/current states. Letters, document previews and drawing sheets are "paper" islands (`data-theme="light"`). Charts read CSS variables; the dark series `#1A9AB6 #C4861F #787EE4 #CC6399` passes the palette validator on the dark surface. The theme is chosen with the sun/moon switch, stored in the `ecps-theme` cookie and rendered server-side (no flash). `tests/e2e/theme.spec.ts` covers persistence and runs axe colour-contrast in dark mode.

## 2. Typography

| Role | Face | Notes |
| --- | --- | --- |
| Display & headings | **Manrope** 600–800 | Tight tracking at large sizes (−0.02 to −0.03em) |
| Interface & body | **Inter** | 15px body / 13px dense UI; `text-wrap: pretty` |
| References & codes | **IBM Plex Mono** | File refs, dag numbers, serials (`.ref`), section kickers (`.kicker`) |
| Bangla | **Noto Sans Bengali** | Preferred automatically under `:lang(bn)`; line-height raised to 1.75 for conjuncts; letter-spacing reset |

Scale: 56/60 hero · 40 section · 28 page title · 18–20 panel/section titles · 15 body · 13 table/meta · 11 mono labels.

The **kicker** (mono, uppercase, with a short leading rule) is the system's signature section label, echoing drawing-sheet titles.

## 3. Space, radius, elevation, motion

- 4px base grid; sections breathe at 80–112px vertical on public pages, 24px gaps in workspaces.
- Radii: 3 / 5 / 7 / 10 / 14 / 20px — controls 7px, panels 14px, hero cards 20px.
- Shadows are navy-tinted (`shadow-xs` … `shadow-lg`), used sparingly; borders carry most separation.
- Motion: 150–220ms ease-out for state, 420ms `fade-up` for page entry, a one-time line-draw on the hero plot. All motion is disabled under `prefers-reduced-motion`.

## 4. Components

| Group | Components |
| --- | --- |
| Actions | `Button` (primary, navy, accent, secondary, ghost, subtle, danger, danger-outline, outline-dark, link; xs–lg; loading) |
| Forms | `Field` (label/hint/error with aria wiring), `Input` (leading/trailing slots), `Select` (native, styled), `Textarea`, `Checkbox`, `RadioGroup`/`RadioItem`, `ChoiceCard`, `Switch`, `SegmentedControl`, `FileDrop`/`FileRow` |
| Overlays | `Dialog`/`DialogContent`, `ConfirmDialog` (Yes/No — TOR 1.4), `Sheet`, `Tooltip`, `Popover`, `Menu`, `Tabs`, `Accordion`, `Toaster` |
| Display | `Badge` (tone + distinct dot shape), `Tag`, `Panel`, `PageHeader`, `Breadcrumbs`, `Avatar`, `KeyValues`, `Metric`, `Timeline`, `Stepper`, `DataTable` |
| Feedback | `Callout` (info/success/warning/danger/**demo**), `SimulatedTag`, `EmptyState`, `Skeleton`, `PageSkeleton`, `Spinner`, `ProgressBar` |
| Domain | `DrawingSheet` (title block with signature slots and auto-stamped file number), `DocumentPreview`, `SiteMap` (simulated, DAP overlay), `MfaDialog`, `StatusBadge`, `StageTrack`, `HoldingIndicator` |
| Charts | `ChartFrame`, `VBarChart`, `HBarChart`, `TrendChart` |
| Brand | `LogoMark`/`Logo` (the supplied RAJUK emblem on a white disc, with a localised wordmark), `HeroPlan` (deterministic cadastral composition) |

shadcn/ui conventions (Radix + Tailwind + `cva`) are used as a foundation only; every visual is custom.

## 5. Layout & responsive decisions

| Surface | Approach |
| --- | --- |
| Public portal | Max width 88rem; editorial asymmetric grids; distinct layout per landing section; mobile nav collapses to a full-width sheet |
| Applicant workspace | Sidebar ≥ 1024px, drawer below; dashboard leads with one primary action; wizard uses a sticky stepper on desktop and a progress header + sticky action bar on mobile |
| Officer workspace | Dense but calm; key-facts strip, document viewer and review tools side by side ≥ 1280px; tables switch to cards below 768px |
| Inspector | Phone-first single column, 44px touch targets, thumb-reachable sticky actions |
| Management/finance | Desktop-first two-column charts that stack on narrow screens; every chart has a table alternative |

Tested at 1440, 1024, 768, 390 and 360px wide. An e2e guard (`tests/e2e/responsive.spec.ts`) fails if any of 17 key pages scrolls horizontally at 1024, 768 or 360px.

Layout safety net in `globals.css`: direct children of any `.grid` get `min-width: 0` (so long references and tables shrink instead of pushing the page wider), and scroll containers are `position: relative` (so absolutely positioned `sr-only` text stays inside them). The wizard's step sidebar appears from 1280px; below that the compact progress header is used.

## 6. Accessibility (target WCAG 2.2 AA)

- Visible 2px teal focus ring everywhere (amber on dark surfaces); skip links on every layout.
- Semantic landmarks, headings in order, `aria-current` for navigation and steps, labelled regions for panels.
- Every field has a programmatic label; hints and errors are linked with `aria-describedby`; errors use `role="alert"`.
- Status never relies on colour alone: badges pair colour with a distinctly shaped dot, over-limit files add an alarm icon and screen-reader text, checklist results have icons and labels.
- Tables have captions and `scope` headers; sortable headers expose `aria-sort`; rows that open a file are keyboard operable.
- Dialogs trap focus (Radix) and confirm destructive or file-moving actions.
- Charts are `aria-hidden` visuals with an accessible table toggle.
- Toasts announce through a polite live region.
- Reduced-motion respected; text resizes with browser zoom (rem-based).
- Automated axe scans run in the Playwright suite for public and workspace pages.

## 7. Localisation

- English and Bangla dictionaries are typed: Bangla must define every English key (enforced by TypeScript and a unit test that also checks placeholders).
- One typed dictionary, split by area for maintainability: `en.ts` (core) + `en-applicant`, `en-shell`, `en-rajuk`, `en-admin`, `en-public`, each mirrored in Bangla. `translate()` lives in `i18n/core.ts` so client components, the demo store and server metadata share it.
- Every screen is translated: public portal, auth, applicant and professional workspaces, all RAJUK internal screens, administration, dialogs, toasts, empty states, charts and page titles.
- Domain labels (stages, statuses, services, documents, departments, checklists, next actions) come from one `useLabels()` hook so a term reads the same everywhere.
- Data values with a fixed vocabulary (job titles, zones, departments, meeting titles…) use a glossary lookup `term(group, value)` with a fallback to the stored value.
- Generated messages (notifications, signing-package log lines) store a message key plus variables and render in the reader's language; English text is kept as a fallback.
- Kept as recorded: names, addresses, project titles, typed notes, references/codes, audit-log details, CSV exports and drawing title blocks. `/design-system` is developer documentation and stays English.
- Dates, relative times, month names, numbers and Taka amounts follow the locale; Bangla date-times use the 24-hour clock.
- `tests/e2e/language.spec.ts` checks that English → Bangla → English leaves no Bangla behind; `LANG_AUDIT=<file>` lists any Latin words per screen in Bangla.
- Official service names are kept in their commonly used transliterated form (e.g. “প্ল্যানিং পারমিট”) with plain-language descriptions. All Bangla copy should be reviewed by RAJUK.

## 8. Content principles

- Say who holds the file and for how long; avoid passive “processing”.
- Label every simulated or illustrative element (`SimulatedTag`, `Callout tone="demo"`).
- Never state official fees, statutory timelines or legal validity.
