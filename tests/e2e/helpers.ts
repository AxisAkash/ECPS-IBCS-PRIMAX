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

/** Demo tools are hidden on load; the Demo button reveals them. */
export async function showDemo(page: Page) {
  const toggle = page.getByRole("button", { name: /Show demo tools|Hide demo tools/ }).first();
  // Retry until React has hydrated and the toggle reports it is open.
  await expect(async () => {
    if ((await toggle.getAttribute("aria-pressed")) !== "true") await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true", { timeout: 1000 });
  }).toPass({ timeout: 15_000 });
}

/** Enter a demo role through the real sign-in page selector (revealed with the Demo button). */
export async function enterAs(page: Page, role: string) {
  await page.goto("/sign-in");
  await showDemo(page);
  await page.getByRole("button", { name: roleButton(role) }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/sign-in"));
}

/** Switch role without losing demo data (Demo tools panel → Switch demo role). */
export async function switchRole(page: Page, role: string, landing: RegExp) {
  await showDemo(page);
  await page.getByRole("complementary", { name: "Demo tools" }).getByRole("button", { name: "Switch demo role" }).click();
  await page.getByRole("dialog").getByRole("button", { name: roleButton(role) }).click();
  await page.waitForURL(landing);
}

export async function useSample(page: Page, times = 1) {
  for (let i = 0; i < times; i++) {
    await page.getByRole("button", { name: "Use sample file" }).first().click();
    await expect(page.getByText("Uploading (simulated)…")).toHaveCount(0, { timeout: 8000 });
  }
}
