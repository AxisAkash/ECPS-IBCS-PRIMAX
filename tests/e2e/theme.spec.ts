import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { enterAs, freshDemo } from "./helpers";
import { ROUTES, shotName } from "./routes";

const theme = (page: import("@playwright/test").Page) => page.evaluate(() => document.documentElement.dataset.theme);

test("light is the default, dark persists across navigation and reloads, and light can be restored", async ({ page }) => {
  await freshDemo(page);
  await page.goto("/");
  expect(await theme(page)).toBe("light");

  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  expect(await theme(page)).toBe("dark");

  // Server-rendered from the cookie: correct before any script runs (no flash).
  const html = await (await page.request.get("/services")).text();
  expect(html).toMatch(/<html[^>]*data-theme="dark"/);

  await page.goto("/services");
  expect(await theme(page)).toBe("dark");
  await page.reload();
  expect(await theme(page)).toBe("dark");

  await page.getByRole("button", { name: "Switch to light theme" }).click();
  expect(await theme(page)).toBe("light");
  await page.reload();
  expect(await theme(page)).toBe("light");
});

test("dark theme passes automated colour-contrast checks on key screens", async ({ page }) => {
  test.setTimeout(120_000);
  await freshDemo(page);
  await page.evaluate(() => (document.cookie = "ecps-theme=dark; path=/"));
  const check = async (path: string) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    const r = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    expect(r.violations.map((v) => `${path}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(", ")}`)).toEqual([]);
  };
  for (const p of ["/", "/services", "/track?ref=CP-26-Z1-01421", "/public-register", "/sign-in"]) await check(p);
  await enterAs(page, "Applicant");
  for (const p of ["/workspace", "/workspace/applications/a-104"]) await check(p);
  await enterAs(page, "RAJUK Officer");
  for (const p of ["/rajuk", "/rajuk/inbox", "/rajuk/files/a-203"]) await check(p);
});

/**
 * THEME_SHOTS=<dir> saves a screenshot of every screen for visual review — dark by default;
 * SHOTS_THEME=light and SHOTS_LANG=bn change the theme and language.
 */
for (const { role, paths } of ROUTES) {
  test(`screenshots · ${role ?? "public"}`, async ({ page }) => {
    test.skip(!process.env.THEME_SHOTS, "set THEME_SHOTS=<dir> to capture");
    test.setTimeout(240_000);
    await freshDemo(page);
    const themeCookie = `ecps-theme=${process.env.SHOTS_THEME ?? "dark"}; path=/`;
    const langCookie = `ecps-locale=${process.env.SHOTS_LANG ?? "en"}; path=/`;
    await page.evaluate((c) => (document.cookie = c), themeCookie);
    if (role) await enterAs(page, role);
    await page.evaluate((c) => (document.cookie = c), langCookie);
    for (const path of paths) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${process.env.THEME_SHOTS}/${shotName(role ? role.replace(/\s/g, "") : "public", path)}`, fullPage: true });
    }
  });
}
