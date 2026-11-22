import { expect, test, type Page } from "@playwright/test";
import { enterAs, freshDemo } from "./helpers";

/**
 * Responsive guard: no page may scroll horizontally at the widths named in the brief.
 * Set RESPONSIVE_SHOTS=<dir> to also save a screenshot of every page/width for visual review.
 */
const WIDTHS = [1024, 768, 360];

const PAGES: Array<{ role?: string; path: string }> = [
  { path: "/" },
  { path: "/sign-in" },
  { path: "/services" },
  { path: "/public-register" },
  { path: "/track?ref=CP-26-Z1-01421" },
  { role: "Applicant", path: "/workspace" },
  { role: "Applicant", path: "/workspace/applications/a-101/edit" },
  { role: "Applicant", path: "/workspace/applications/a-104" },
  { role: "RAJUK Officer", path: "/rajuk" },
  { role: "RAJUK Officer", path: "/rajuk/inbox" },
  { role: "RAJUK Officer", path: "/rajuk/files/a-203" },
  { role: "RAJUK Officer", path: "/rajuk/signing/sp-208" },
  { role: "Committee User", path: "/rajuk/committee" },
  { role: "Inspector", path: "/rajuk/inspections/i-01" },
  { role: "Management", path: "/rajuk/management" },
  { role: "Finance Officer", path: "/rajuk/finance" },
  { role: "Administrator", path: "/rajuk/admin/security" },
];

async function overflow(page: Page) {
  return page.evaluate(() => {
    const extra = document.documentElement.scrollWidth - window.innerWidth;
    if (extra <= 1) return { extra, culprits: [] as string[] };
    const culprits = [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1 && el.offsetParent !== null)
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`);
    return { extra, culprits };
  });
}

const byRole = new Map<string | undefined, typeof PAGES>();
PAGES.forEach((p) => byRole.set(p.role, [...(byRole.get(p.role) ?? []), p]));

for (const [role, pages] of byRole) {
  test(`no horizontal overflow · ${role ?? "public"}`, async ({ page }) => {
    test.setTimeout(180_000);
    await freshDemo(page);
    if (role) await enterAs(page, role);
    const failures: string[] = [];
    for (const { path } of pages) {
      for (const w of WIDTHS) {
        await page.setViewportSize({ width: w, height: 900 });
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(600);
        const o = await overflow(page);
        if (o.extra > 1) failures.push(`${path} @${w}px overflows by ${o.extra}px: ${o.culprits.join(" | ")}`);
        if (process.env.RESPONSIVE_SHOTS) await page.screenshot({ path: `${process.env.RESPONSIVE_SHOTS}/${w}${path.replace(/[/?=]/g, "_")}.png` });
      }
    }
    expect(failures).toEqual([]);
  });
}
