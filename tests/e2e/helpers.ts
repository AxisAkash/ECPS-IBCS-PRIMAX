import { expect, type Page } from "@playwright/test";

export async function freshDemo(page: Page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    document.cookie = "ecps-locale=en; path=/";
    document.cookie = "ecps-theme=; path=/; max-age=0";
  });
}

/** Accessible names start with "Enter as <Role>" followed by the persona name. */
const roleButton = (role: string) => new RegExp("^Enter as " + role + "(\\s|$)");

/** Enter a demo role through the real sign-in page selector. */
export async function enterAs(page: Page, role: string) {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: roleButton(role) }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/sign-in"));
}

/** Switch role without losing demo data (uses the workspace user menu). */
export async function switchRole(page: Page, role: string, landing: RegExp) {
  await page.getByRole("button", { name: /Building owner|Authorized Officer|Building Inspector|Committee|Director|Administrator|Engineer|Architect|Officer/ }).first().click();
  await page.getByRole("menuitem", { name: "Switch demo role" }).click();
  await page.getByRole("dialog").getByRole("button", { name: roleButton(role) }).click();
  await page.waitForURL(landing);
}

export async function useSample(page: Page, times = 1) {
  for (let i = 0; i < times; i++) {
    await page.getByRole("button", { name: "Use sample file" }).first().click();
    await expect(page.getByText("Uploading (simulated)…")).toHaveCount(0, { timeout: 8000 });
  }
}
