import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { enterAs, freshDemo } from "./helpers";

test.beforeEach(async ({ page }) => {
  await freshDemo(page);
});

test("landing page renders the hero, services and notices", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /From plot to permit/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Apply for a permit" }).first()).toBeVisible();
  await page.getByLabel("Search services").fill("occupancy");
  await expect(page.getByText("Recommended for you")).toBeVisible();
  await expect(page.getByText("Scheduled maintenance window")).toBeVisible();
});

test("language switch renders Bangla and persists", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Switch to Bangla/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("প্লট থেকে অনুমোদন");
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("প্লট থেকে অনুমোদন");
});

test("public tracking shows stage without personal data", async ({ page }) => {
  await page.goto("/track?ref=CP-26-Z1-01421");
  await expect(page.getByText("Assistant Authorized Officer").first()).toBeVisible();
  await expect(page.getByText("Nusrat")).toHaveCount(0);
});

test("sign-in form validates required fields", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Enter your email, mobile number or username.")).toBeVisible();
  await expect(page.getByText("Enter your password.")).toBeVisible();
});

const PAGES = ["/", "/sign-in", "/services", "/public-register", "/register/applicant", "/track?ref=CP-26-Z1-01421", "/design-system"];

for (const path of PAGES) {
  test(`axe: no serious or critical violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
  });
}

for (const [role, path] of [
  ["Applicant", "/workspace"],
  ["RAJUK Officer", "/rajuk/files/a-203"],
  ["RAJUK Officer", "/rajuk/inbox"],
  ["Administrator", "/rajuk/admin/security"],
] as const) {
  test(`axe: workspace ${path} as ${role}`, async ({ page }) => {
    await enterAs(page, role);
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
  });
}
