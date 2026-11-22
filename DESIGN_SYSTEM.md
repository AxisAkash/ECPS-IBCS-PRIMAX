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
| Brand | `LogoMark`/`Logo` (original mark, not the RAJUK emblem), `HeroPlan` (deterministic cadastral composition) |

shadcn/ui conventions (Radix + Tailwind + `cva`) are used as a foundation only; every visual is custom.

## 5. Layout & responsive decisions

| Surface | Approach |
| --- | --- |
| Public portal | Max width 88rem; editorial asymmetric grids; distinct layout per landing section; mobile nav collapses to a full-width sheet |
| Applicant workspace | Sidebar ≥ 1024px, drawer below; dashboard leads with one primary action; wizard uses a sticky stepper on desktop and a progress header + sticky action bar on mobile |
| Officer workspace | Dense but calm; key-facts strip, document viewer and review tools side by side ≥ 1280px; tables switch to cards below 768px |
| Inspector | Phone-first single column, 44px touch targets, thumb-reachable sticky actions |
| Management/finance | Desktop-first two-column charts that stack on narrow screens; every chart has a table alternative |

Tested at 1440, 1024, 768, 390 and 360px wide.

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
- Translated: public landing, navigation, authentication and registration, service names, applicant dashboard and wizard chrome, statuses.
- English-only (prototype scope): internal RAJUK workspace screens.
- Official service names are kept in their commonly used transliterated form (e.g. “প্ল্যানিং পারমিট”) with plain-language descriptions. All Bangla copy should be reviewed by RAJUK.

## 8. Content principles

- Say who holds the file and for how long; avoid passive “processing”.
- Label every simulated or illustrative element (`SimulatedTag`, `Callout tone="demo"`).
- Never state official fees, statutory timelines or legal validity.
