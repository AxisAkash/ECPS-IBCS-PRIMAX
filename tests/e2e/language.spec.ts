import { appendFileSync, writeFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { enterAs, freshDemo } from "./helpers";
import { ROUTES } from "./routes";

const BENGALI = /[ঀ-৿]/;

/** Visible text of the page, minus the language toggle (which always names the other language). */
const pageText = (page: Page) =>
  page.evaluate(() => {
    const clone = document.body.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("[lang]").forEach((el) => {
      if (el !== clone && el.closest("button")) el.remove();
    });
    clone.querySelectorAll("script,style,svg,[aria-hidden='true']").forEach((el) => el.remove());
    return clone.innerText;
  });

test("switching English → Bangla → English updates the whole interface", async ({ page }) => {
  await freshDemo(page);
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const english = await pageText(page);
  expect(english).not.toMatch(BENGALI);

  await page.getByRole("button", { name: /বাংলা/ }).first().click();
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/[ঀ-৿]/);

  await page.getByRole("button", { name: /^English/ }).first().click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect.poll(() => pageText(page)).not.toMatch(BENGALI);
  expect((await pageText(page)).trim()).toBe(english.trim());
});

test("internal workspace switches language without leftovers", async ({ page }) => {
  await freshDemo(page);
  await enterAs(page, "RAJUK Officer");
  await page.goto("/rajuk/inbox");
  await page.waitForLoadState("networkidle");
  const before = await pageText(page);
  expect(before).not.toMatch(BENGALI);

  await page.evaluate(() => (document.cookie = "ecps-locale=bn; path=/"));
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("নথির ইনবক্স");

  await page.evaluate(() => (document.cookie = "ecps-locale=en; path=/"));
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect.poll(() => pageText(page)).not.toMatch(BENGALI);
});

/**
 * LANG_AUDIT=<file> visits every screen in Bangla and writes the Latin-script words it finds, so
 * untranslated interface text stands out among the expected data (names, references, codes).
 */
for (const { role, paths } of ROUTES) {
  test(`Bangla audit · ${role ?? "public"}`, async ({ page }) => {
    const out = process.env.LANG_AUDIT;
    test.skip(!out, "set LANG_AUDIT=<file> to run");
    test.setTimeout(240_000);
    await freshDemo(page);
    if (role) await enterAs(page, role);
    await page.evaluate(() => (document.cookie = "ecps-locale=bn; path=/"));
    if (!role) writeFileSync(out!, "");
    for (const path of paths) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);
      const words = (await pageText(page)).match(/[A-Za-z][A-Za-z’'-]{2,}/g) ?? [];
      const counts = new Map<string, number>();
      words.forEach((w) => counts.set(w, (counts.get(w) ?? 0) + 1));
      appendFileSync(out!, `\n## ${role ?? "public"} ${path}\n${[...counts.entries()].map(([w, n]) => `${w}${n > 1 ? `×${n}` : ""}`).join(" ")}\n`);
    }
  });
}
