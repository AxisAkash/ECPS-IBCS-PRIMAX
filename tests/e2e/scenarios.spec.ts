import { expect, test } from "@playwright/test";
import { enterAs, freshDemo, switchRole, useSample } from "./helpers";

test.beforeEach(async ({ page }) => {
  await freshDemo(page);
});

test("Scenario 1+2: applicant submits a Planning Permit and an officer moves it on", async ({ page }) => {
  await enterAs(page, "Applicant");
  await expect(page.getByRole("heading", { name: /Good to see you, Nusrat/ })).toBeVisible();

  // Start a new Planning Permit
  await page.getByRole("button", { name: "New application" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: /^Planning Permit Confirms/ }).click();
  await page.waitForURL(/\/edit$/);
  await page.getByRole("button", { name: "Save and continue" }).click();

  // Property & plot
  await expect(page.getByRole("heading", { level: 2, name: "Property & plot" })).toBeVisible();
  await page.getByLabel("RAJUK zone").selectOption("Zone 4");
  await page.getByLabel("Sub-zone").selectOption("4/1");
  await page.getByLabel("Area / locality").fill("Dhanmondi");
  await page.getByLabel("Mouza").fill("Jafrabad");
  await page.getByLabel("RS dag no.").fill("1450");
  await page.getByLabel("Plot area (m²)").fill("320");
  await page.getByLabel("Access road width (m)").fill("9");
  await page.getByLabel("Plot address").fill("Plot 9, Road 4, Dhanmondi (fictional)");
  await page.getByRole("button", { name: "Save and continue" }).click();

  // Owners — validation first, then sample uploads
  await expect(page.getByRole("heading", { level: 2, name: "Owners" })).toBeVisible();
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Complete these before continuing" })).toBeVisible();
  await useSample(page, 4);
  await page.getByRole("button", { name: "Save and continue" }).click();

  // Professionals
  await expect(page.getByRole("heading", { level: 2, name: "Professional participation" })).toBeVisible();
  await page.getByRole("button", { name: "Invite" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Invite" }).first().click();
  await expect(page.getByText(/Invited/).first()).toBeVisible();
  await page.getByRole("button", { name: "Save and continue" }).click();

  // Location
  await expect(page.getByRole("heading", { level: 2, name: "Location & map" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm plot position" }).click();
  await useSample(page, 1); // plot photograph
  await page.getByRole("button", { name: "Use sample file" }).nth(1).click(); // adjacent-road photograph
  await expect(page.getByText("Uploading (simulated)…")).toHaveCount(0, { timeout: 8000 });
  await expect(page.getByRole("button", { name: "Remove adjacent_road_sample.jpg" })).toBeVisible();
  await page.getByRole("button", { name: "Save and continue" }).click();

  // Building
  await expect(page.getByRole("heading", { level: 2, name: "Project & building details" })).toBeVisible();
  await page.getByLabel("Storeys above ground").fill("6");
  await page.getByLabel("Total floor area (m²)").fill("1100");
  await page.getByLabel("Ground coverage (m²)").fill("185");
  await page.getByRole("button", { name: "Save and continue" }).click();

  // Documents
  await expect(page.getByRole("heading", { level: 2, name: "Drawings & supporting documents" })).toBeVisible();
  await useSample(page, 1);
  await page.getByRole("button", { name: "Save and continue" }).click();

  // Review & fee
  await expect(page.getByRole("heading", { level: 2, name: "Review & fee" })).toBeVisible();
  await expect(page.getByText("Fee preview")).toBeVisible();
  await expect(page.getByText(/Illustrative rule set/)).toBeVisible();
  await page.getByRole("checkbox", { name: /I declare/ }).check();
  await page.getByRole("button", { name: "Submit application" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Yes, submit" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Application submitted" })).toBeVisible({ timeout: 15000 });
  const ref = (await page.locator(".ref").filter({ hasText: /^PP-26-Z4-\d{5}$/ }).first().textContent())!.trim();
  expect(ref).toMatch(/^PP-26-Z4-/);

  // Officer sees it at the Front Desk and takes it
  await switchRole(page, "RAJUK Officer", /\/rajuk$/);
  await page.goto("/rajuk");
  const queue = page.getByRole("region", { name: "Front Desk queue" }).or(page.locator("section", { hasText: "Front Desk queue" }));
  await expect(queue.getByText(ref)).toBeVisible();
  await queue.locator("li", { hasText: ref }).getByRole("button", { name: "Take" }).click();
  await page.waitForURL(/\/rajuk\/files\//);

  // Forward to Deputy Town Planner with Yes/No confirmation
  await page.getByRole("button", { name: /Forward to Deputy Town Planner/ }).click();
  await expect(page.getByRole("dialog").getByText("Forward to Deputy Town Planner?")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Yes, confirm" }).click();
  await expect(page.getByText(/Read-only — this file is held by Sharmin Akter/)).toBeVisible();

  // Applicant sees the new stage
  await switchRole(page, "Applicant", /\/workspace$/);
  await page.goto("/workspace/applications");
  await page.getByText(ref).click();
  await expect(page.getByText("Deputy Town Planner").first()).toBeVisible();
});

test("Scenario 2: officer reviews an assigned file and lists it for committee", async ({ page }) => {
  await enterAs(page, "RAJUK Officer");
  await page.goto("/rajuk/files/a-203");
  await page.getByRole("radio", { name: "Compliant" }).first().click();
  await page.getByRole("tab", { name: /Notes/ }).click();
  await page.getByLabel("Observation").fill("Stair widths verified against fire-safety drawing.");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText("Stair widths verified")).toBeVisible();
  await page.getByRole("button", { name: "List for BC Committee" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Yes, confirm" }).click();
  await expect(page.getByText("Listed for BC Committee").first()).toBeVisible();
});

test("Scenario 3: digital signing with simulated certificate and MFA", async ({ page }) => {
  await enterAs(page, "RAJUK Officer");
  await page.goto("/rajuk/signing/sp-208");
  await expect(page.getByText("Simulated signing & certificate check")).toBeVisible();
  await page.getByRole("button", { name: "Validate my certificate" }).click();
  await expect(page.getByText("Demo Certifying Authority (simulated)")).toBeVisible();
  await page.getByLabel("Show my signature placement").check();
  await expect(page.getByText(/FAR calculation sheet excluded by rule/)).toBeVisible();
  await page.getByRole("button", { name: /Sign 5 pages/ }).click();
  await page.getByLabel("Verification code").fill("000000");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(page.getByText("Code not accepted")).toBeVisible();
  await page.getByLabel("Verification code").fill("246810");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(page.getByText("All required signatures applied")).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(/asked for the permit fee/)).toBeVisible();
});

test("Scenario 4: inspector completes a field inspection", async ({ page }) => {
  await enterAs(page, "Inspector");
  await page.goto("/rajuk/inspections/i-01");
  await page.getByRole("button", { name: "Capture GPS" }).click();
  await expect(page.getByText(/· on site/)).toBeVisible();
  for (const group of await page.getByRole("radiogroup").all()) {
    const yes = group.getByRole("radio", { name: "Yes" });
    if (await yes.count()) await yes.click();
  }
  await page.getByRole("button", { name: "Use sample photo" }).click();
  await page.getByLabel("Observations").fill("Plinth completed as per approved drawing.");
  await page.getByRole("button", { name: "Submit" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Yes, submit" }).click();
  await expect(page.getByText(/Submitted .* outcome: Compliant/)).toBeVisible();
});

test("Scenario 5: Public Register, verification and management insight", async ({ page }) => {
  await page.goto("/public-register");
  await page.getByRole("link", { name: "CP-26-Z4-01561" }).click();
  await expect(page.getByRole("heading", { name: "CP-26-Z4-01561" })).toBeVisible();
  await expect(page.getByText("Not shown for privacy")).toBeVisible();
  await page.goto("/verify");
  await page.getByRole("button", { name: "fill a valid sample" }).click();
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByText("Permit verified")).toBeVisible();
  await enterAs(page, "Management");
  await expect(page.getByRole("heading", { name: "Permitting performance" })).toBeVisible();
  await page.getByRole("button", { name: "Table" }).first().click();
  await expect(page.getByRole("columnheader", { name: "Submitted" })).toBeVisible();
});

test("Committee: second presentation offers only Approve or Reject", async ({ page }) => {
  await enterAs(page, "Committee User");
  const second = page.locator("article", { hasText: "2nd & final presentation" });
  await expect(second.getByRole("radio", { name: "Approve" })).toBeVisible();
  await expect(second.getByRole("radio", { name: "Correction" })).toHaveCount(0);
  const first = page.locator("article", { hasText: "1st presentation" });
  await expect(first.getByRole("radio", { name: "Correction" })).toBeVisible();
});

test("Role-based navigation blocks other workspaces", async ({ page }) => {
  await enterAs(page, "Applicant");
  await page.goto("/rajuk/admin");
  await expect(page.getByText(/This area is not available to the Applicant role/)).toBeVisible();
});
