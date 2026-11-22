# Visual QA contact sheet

Captured from the production build at 1440×900 (desktop) and 390×844 (mobile) with fictional demo data.
Regenerate with:

```powershell
npm run build
$env:SCREENSHOTS = "1"; npx playwright test screenshots --project=desktop
```

| | |
| --- | --- |
| ![Landing — desktop](01-landing-desktop.png) Landing · desktop | ![Landing — mobile](02-landing-mobile.png) Landing · mobile |
| ![Sign-in — desktop](03-sign-in-desktop.png) Sign-in · desktop | ![Sign-in — mobile](04-sign-in-mobile.png) Sign-in · mobile |
| ![Applicant dashboard](05-applicant-dashboard.png) Applicant dashboard | ![Wizard](06-wizard-professionals.png) Permit wizard |
| ![Application detail](07-application-detail-correction.png) Application detail (correction) | ![Officer dashboard](08-officer-dashboard.png) Officer dashboard |
| ![Inbox](09-officer-inbox.png) File inbox | ![Case review](10-case-review.png) Case review workspace |
| ![Digital signing](11-digital-signing.png) Digital signing | ![Committee](12-committee.png) BC Committee |
| ![Inspector — mobile](13-inspector-mobile.png) Inspector · mobile | ![Management](14-management-dashboard.png) Management dashboard |
| ![Finance](15-finance-dashboard.png) Finance dashboard | ![Admin security](16-admin-security.png) Admin · security |
| ![Public Register](17-public-register.png) Public Register | ![Permit extract](18-permit-extract.png) Permit extract |
| ![Design system](19-design-system.png) Design system | ![Landing — full page](01b-landing-desktop-full.png) Landing · full page |

## Review notes

Issues found during visual review and fixed before delivery:

- Hero status card overlapped the highlighted plot → plot moved east of the avenue; lake redrawn as a narrow water body.
- `tailwind-merge` dropped the navy background of the lifecycle band (pattern class treated as a background colour) → pattern rendered as an overlay and merge config extended.
- Auth identity panel text pushed below the fold by the long form column → panel made sticky at viewport height.
- Officer case review pushed the document viewer below the fold at 1440px → summary panels replaced by a key-facts strip.
- Horizontal bar charts skipped alternate labels → all category labels forced and height sized by row count.
- Seeded FAR values exceeded the illustrative limit on most files; seeded payment dates clustered outside 90 days; some schedules fell at night → seed corrected.
- Professional rows in the wizard were cramped at 390px → rows stack on small screens.
- axe findings (label-in-name on logo/language/demo-role controls, `text-subtle` contrast, a `<dl>` with a stray element, `aria-hidden` chart containers with focusable content) → fixed.
