import { expect, test } from "@playwright/test";
import { freshDemo, showDemo } from "./helpers";

test("demo tools are hidden on load and toggle open and closed with the Demo button", async ({ page }) => {
  await freshDemo(page);
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const panel = page.getByRole("complementary", { name: "Demo tools" });
  const toggle = page.getByRole("button", { name: /Show demo tools|Hide demo tools/ }).first();

  await expect(panel).toHaveCount(0);
  await expect(toggle).toHaveAttribute("aria-pressed", "false");

  await toggle.click();
  await expect(panel).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  await toggle.click();
  await expect(panel).toHaveCount(0);

  // Escape also closes it; a fresh load always starts hidden.
  await toggle.click();
  await expect(panel).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await toggle.click();
  await page.reload();
  await expect(page.getByRole("complementary", { name: "Demo tools" })).toHaveCount(0);
});

test("sign-in keeps demo roles hidden until requested", async ({ page }) => {
  await freshDemo(page);
  await page.goto("/sign-in");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Explore with a demo role" })).toHaveCount(0);

  await page.getByLabel("Email, mobile or username").fill("someone@example.com");
  await page.locator("input[type=password]").fill("anything");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("button", { name: "Show demo access" }).click();

  await expect(page.getByRole("heading", { name: "Explore with a demo role" })).toBeVisible();
  await page.getByRole("button", { name: /^Enter as Applicant(\s|$)/ }).click();
  await page.waitForURL(/\/workspace$/);

  // Role switching and reset now live in the demo panel, not the user menu.
  await showDemo(page);
  const panel = page.getByRole("complementary", { name: "Demo tools" });
  await expect(panel.getByRole("button", { name: "Switch demo role" })).toBeVisible();
  await expect(panel.getByRole("button", { name: "Reset demo data" })).toBeVisible();
});
