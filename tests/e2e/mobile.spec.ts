import { expect, test } from "@playwright/test";
import { enterAs, freshDemo } from "./helpers";

test.beforeEach(async ({ page }) => {
  await freshDemo(page);
});

test("landing has no horizontal overflow and a working mobile menu", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.locator("#mobile-nav").getByRole("link", { name: "Public Register" })).toBeVisible();
});

test("inspector workspace is usable on a phone", async ({ page }) => {
  await enterAs(page, "Inspector");
  await page.goto("/rajuk/inspections/i-01");
  await expect(page.getByRole("button", { name: "Save draft" })).toBeInViewport();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("officer inbox switches to cards on mobile", async ({ page }) => {
  await enterAs(page, "RAJUK Officer");
  await page.goto("/rajuk/inbox");
  await expect(page.locator("ul.md\\:hidden a").first()).toBeVisible();
});
