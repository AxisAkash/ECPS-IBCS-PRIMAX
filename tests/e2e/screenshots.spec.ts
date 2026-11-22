/**
 * Visual QA capture. Not part of the default run:
 *   SCREENSHOTS=1 npx playwright test screenshots --project=desktop
 * Writes PNGs to docs/screenshots for the contact sheet (docs/screenshots/README.md).
 */
import { test, type Page } from "@playwright/test";
import { enterAs, freshDemo } from "./helpers";

test.skip(!process.env.SCREENSHOTS, "Set SCREENSHOTS=1 to capture visual QA screenshots");
test.describe.configure({ mode: "serial" });

const OUT = "docs/screenshots";

async function shot(page: Page, name: string, opts: { full?: boolean; width?: number; height?: number } = {}) {
  if (opts.width) await page.setViewportSize({ width: opts.width, height: opts.height ?? 900 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1300); // let entry animations and charts settle
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: opts.full ?? false });
}

test("capture key screens", async ({ page }) => {
  test.setTimeout(240_000);
  await freshDemo(page);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await shot(page, "01-landing-desktop");
  await shot(page, "01b-landing-desktop-full", { full: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await shot(page, "02-landing-mobile");
  await page.goto("/sign-in");
  await shot(page, "04-sign-in-mobile");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/sign-in");
  await shot(page, "03-sign-in-desktop");

  await enterAs(page, "Applicant");
  await shot(page, "05-applicant-dashboard");
  await page.goto("/workspace/applications/a-101/edit");
  await shot(page, "06-wizard-professionals");
  await page.goto("/workspace/applications/a-102");
  await shot(page, "07-application-detail-correction");

  await enterAs(page, "RAJUK Officer");
  await shot(page, "08-officer-dashboard");
  await page.goto("/rajuk/inbox");
  await shot(page, "09-officer-inbox");
  await page.goto("/rajuk/files/a-203");
  await shot(page, "10-case-review");
  await page.goto("/rajuk/signing/sp-208");
  await page.getByRole("button", { name: "Validate my certificate" }).click();
  await page.getByText("Demo Certifying Authority (simulated)").waitFor();
  await page.getByLabel("Show my signature placement").check();
  await shot(page, "11-digital-signing");

  await enterAs(page, "Committee User");
  await shot(page, "12-committee");

  await enterAs(page, "Inspector");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/rajuk/inspections/i-01");
  await shot(page, "13-inspector-mobile");
  await page.setViewportSize({ width: 1440, height: 900 });

  await enterAs(page, "Management");
  await shot(page, "14-management-dashboard");
  await enterAs(page, "Finance Officer");
  await shot(page, "15-finance-dashboard");
  await enterAs(page, "Administrator");
  await page.goto("/rajuk/admin/security");
  await shot(page, "16-admin-security");

  await page.goto("/public-register");
  await shot(page, "17-public-register");
  await page.goto("/public-register/CP-26-Z4-01561");
  await shot(page, "18-permit-extract");
  await page.goto("/design-system");
  await shot(page, "19-design-system");
});
