import { beforeEach, describe, expect, it } from "vitest";
import { useDemoStore } from "@/lib/store/demo-store";

const s = () => useDemoStore.getState();

beforeEach(() => {
  s().resetDemo();
});

describe("demo store — cross-role scenarios", () => {
  it("submitting a draft sends it to the Front Desk and notifies the officer", () => {
    s().signInAs("applicant");
    const id = s().createDraft("PP");
    s().updateApplication(id, { property: { ...s().applications.find((a) => a.id === id)!.property, zone: "Zone 4" } });
    s().submitApplication(id);
    const app = s().applications.find((a) => a.id === id)!;
    expect(app.status).toBe("submitted");
    expect(app.stage).toBe("front_desk");
    expect(app.ref).toMatch(/^PP-26-Z4-\d{5}$/);
    expect(s().notifications.some((n) => n.userId === "u-off-01" && n.body.includes(app.ref))).toBe(true);
  });

  it("forwarding records the move, the holder and an audit entry", () => {
    s().signInAs("officer");
    s().forwardFile("a-203", "bc_committee", undefined, "test");
    const app = s().applications.find((a) => a.id === "a-203")!;
    expect(app.stage).toBe("bc_committee");
    expect(app.history.at(-1)?.action).toBe("forwarded");
    expect(s().audit[0]?.action).toBe("file.forward");
  });

  it("signing all pages requests the fee from the applicant (TOR 1.13)", () => {
    s().signInAs("officer");
    s().signPackage("sp-208");
    const pkg = s().signing.find((p) => p.id === "sp-208")!;
    expect(pkg.status).toBe("signed");
    expect(pkg.signatures.at(-1)?.pages).toEqual([1, 2, 3, 4, 5]); // FAR sheet excluded
    expect(new Set(pkg.signatures.map((x) => x.slot)).size).toBe(pkg.signatures.length); // no overlapping slots
    const app = s().applications.find((a) => a.id === "a-208")!;
    expect(app.status).toBe("fee_pending");
    expect(s().payments.some((p) => p.applicationId === "a-208" && p.status === "pending")).toBe(true);
  });

  it("paying the fee issues the permit and publishes it to the register", () => {
    s().signInAs("applicant");
    s().payFee("a-104", "Card");
    const app = s().applications.find((a) => a.id === "a-104")!;
    expect(app.status).toBe("approved");
    expect(s().issuedPermits.some((p) => p.permitNo === app.permitNo)).toBe(true);
  });

  it("a second BC presentation can never end in 'correction' (TOR 1.4)", () => {
    s().signInAs("committee");
    s().castVote("m-14", "ci-1", "correction");
    s().concludeItem("m-14", "ci-1", { autoSign: false });
    const item = s().meetings.find((m) => m.id === "m-14")!.items.find((i) => i.id === "ci-1")!;
    expect(["approved", "rejected"]).toContain(item.decision);
  });

  it("submitting an inspection locks it and notifies the file holder", () => {
    s().signInAs("inspector");
    s().submitInspection("i-01", "compliant");
    expect(s().inspections.find((i) => i.id === "i-01")!.status).toBe("submitted");
    expect(s().notifications.some((n) => n.userId === "u-off-01" && n.title.includes("Inspection"))).toBe(true);
  });

  it("holding-limit changes are applied and audited", () => {
    s().signInAs("admin");
    s().setHoldingLimit("authorized_officer", 10);
    expect(s().holdingLimits.authorized_officer).toBe(10);
    expect(s().audit[0]?.action).toBe("settings.workflow");
  });

  it("reset restores the seed but keeps the signed-in role", () => {
    s().signInAs("officer");
    s().forwardFile("a-203", "bc_committee", undefined, "x");
    s().resetDemo();
    expect(s().applications.find((a) => a.id === "a-203")!.stage).toBe("authorized_officer");
    expect(s().session?.role).toBe("officer");
  });
});
