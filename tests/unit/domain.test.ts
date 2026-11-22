import { describe, expect, it } from "vitest";
import { createSeed } from "@/lib/data/seed";
import { calculateIllustrativeFee, ILLUSTRATIVE_RULESET } from "@/lib/domain/fees";
import { can, ROLE_PERMISSIONS } from "@/lib/domain/roles";
import { flowFor, holdingInfo, nextStage } from "@/lib/domain/workflow";
import { validateStep } from "@/features/wizard/validation";
import { interpolate } from "@/lib/i18n";
import { bn } from "@/lib/i18n/messages/bn";
import { en } from "@/lib/i18n/messages/en";
import { toBnDigits, toCsv, workingDaysBetween } from "@/lib/utils";

describe("illustrative fee calculation", () => {
  it("combines the flat application fee and the area-based permit fee", () => {
    const fee = calculateIllustrativeFee({ type: "CP", occupancy: "A", totalFloorAreaSqm: 1000 });
    expect(fee.ruleSetId).toBe(ILLUSTRATIVE_RULESET.id);
    expect(fee.lines).toHaveLength(2);
    expect(fee.lines[0]!.amount).toBe(10000);
    expect(fee.lines[1]!.amount).toBe(1000 * 40 * 1);
    expect(fee.total).toBe(10000 + 40000);
  });

  it("applies the larger-project slab multiplier", () => {
    const fee = calculateIllustrativeFee({ type: "CP", occupancy: "E", totalFloorAreaSqm: 2000 });
    expect(fee.lines[1]!.amount).toBe(Math.round(2000 * 60 * 1.15));
  });

  it("labels the rule set as non-official", () => {
    expect(ILLUSTRATIVE_RULESET.label.toLowerCase()).toContain("not an official");
  });
});

describe("workflow", () => {
  it("routes Construction Permits through the BC Committee", () => {
    expect(flowFor("CP")).toContain("bc_committee");
    expect(nextStage({ type: "CP", stage: "authorized_officer" })).toBe("bc_committee");
  });

  it("routes Planning Permits through Town Planning stages", () => {
    expect(flowFor("PP")).toEqual(expect.arrayContaining(["deputy_town_planner", "town_planner", "chief_town_planner"]));
    expect(nextStage({ type: "PP", stage: "front_desk" })).toBe("deputy_town_planner");
  });

  it("flags files held beyond their limit", () => {
    const now = new Date("2026-11-19T10:00:00Z").getTime(); // Thursday
    const enteredTwoWeeksAgo = new Date("2026-11-05T10:00:00Z").toISOString();
    const h = holdingInfo({ stage: "authorized_officer", stageEnteredAt: enteredTwoWeeksAgo, status: "in_review" }, { authorized_officer: 3 }, now);
    expect(h.state).toBe("exceeded");
    expect(h.days).toBeGreaterThan(3);
  });

  it("never flags decided files", () => {
    const h = holdingInfo({ stage: "issued", stageEnteredAt: "2020-01-01T00:00:00Z", status: "approved" }, { issued: 1 });
    expect(h.state).toBe("ok");
  });

  it("counts working days excluding Friday and Saturday", () => {
    // Thu 19 Nov → Thu 26 Nov 2026 = 5 working days (Fri/Sat skipped)
    expect(workingDaysBetween("2026-11-19T09:00:00Z", new Date("2026-11-26T09:00:00Z").getTime())).toBe(5);
  });
});

describe("RBAC", () => {
  it("only officers can sign documents", () => {
    expect(can("officer", "document.sign")).toBe(true);
    expect(can("applicant", "document.sign")).toBe(false);
    expect(can("committee", "document.sign")).toBe(false);
  });

  it("every role has at least one permission", () => {
    Object.values(ROLE_PERMISSIONS).forEach((p) => expect(p.length).toBeGreaterThan(0));
  });
});

describe("wizard validation", () => {
  const seed = createSeed(new Date("2026-11-22T10:00:00Z").getTime());
  const draft = seed.applications.find((a) => a.id === "a-101")!;

  it("requires per-owner documents for every owner (TOR 2.9)", () => {
    const issues = validateStep(draft, "owners", seed.far);
    expect(issues.some((i) => i.field === "owner-1-tax")).toBe(true);
  });

  it("treats an unaccepted invitation as a warning, not a blocker", () => {
    const issues = validateStep(draft, "professionals", seed.far);
    expect(issues.every((i) => i.severity === "warning")).toBe(true);
  });

  it("requires GPS, plot photographs and road photographs (TOR 2.3)", () => {
    const stripped = { ...draft, location: undefined, documents: [] };
    const fields = validateStep(stripped, "location", seed.far).map((i) => i.field);
    expect(fields).toEqual(expect.arrayContaining(["location", "plot_photo", "road_photo"]));
  });
});

describe("seed data", () => {
  const seed = createSeed();
  it("uses only fictional identities and demo email domains", () => {
    seed.users.forEach((u) => expect(u.email.endsWith("@demo.ecps.test")).toBe(true));
  });
  it("links every application professional to a known user", () => {
    const ids = new Set(seed.users.map((u) => u.id));
    seed.applications.forEach((a) => a.professionals.forEach((p) => expect(ids.has(p.userId)).toBe(true)));
  });
  it("gives every signing package exactly one locked approved version", () => {
    seed.signing.forEach((p) => expect(p.versions.filter((v) => v.status === "approved")).toHaveLength(1));
  });
});

describe("i18n", () => {
  it("has a Bangla string for every English key", () => {
    const missing = Object.keys(en).filter((k) => !(bn as Record<string, string>)[k]?.trim());
    expect(missing).toEqual([]);
  });
  it("keeps interpolation placeholders consistent", () => {
    for (const k of Object.keys(en) as Array<keyof typeof en>) {
      const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
      expect(ph(bn[k]), k).toBe(ph(en[k]));
    }
  });
  it("interpolates variables", () => {
    expect(interpolate("Step {n} of {total}", { n: 2, total: 4 })).toBe("Step 2 of 4");
  });
  it("converts digits to Bangla numerals", () => {
    expect(toBnDigits("2026")).toBe("২০২৬");
  });
});

describe("CSV export", () => {
  it("escapes commas and quotes", () => {
    expect(toCsv([{ a: "x,y", b: 'say "hi"' }])).toBe('a,b\n"x,y","say ""hi"""');
  });
});
