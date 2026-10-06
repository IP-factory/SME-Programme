import { describe, expect, it } from "vitest";
import { formatNaira, JOURNEY, PRICES, PROBLEM_AREAS } from "@shared/businessSupport";

describe("business-support catalogue (concept note v0.8.1)", () => {
  it("numbers the problem areas 0 to 10 without gaps, each with a measure", () => {
    expect(PROBLEM_AREAS.map((area) => area.number)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const area of PROBLEM_AREAS) expect(area.measure.length).toBeGreaterThan(0);
  });

  it("carries the frozen v0.1 prices, and shows them in full in the journey", () => {
    expect(PRICES).toEqual({ fullReport: 100_000, currentStateFrom: 500_000, fix: 1_200_000, standardEngagementCap: 2_500_000 });
    const copy = JOURNEY.map((step) => step.body).join(" ");
    for (const price of ["₦100,000", "₦500,000", "₦1,200,000", "₦2,500,000"]) expect(copy).toContain(price);
  });

  it("follows the site copy rules: no internal terms and no price for ongoing support", () => {
    const copy = JOURNEY.map((step) => `${step.name} ${step.body}`).join(" ") + PROBLEM_AREAS.map((area) => area.siteSentence ?? "").join(" ");
    expect(copy).not.toMatch(/\b(door|sprint|playbook|retainer|leverage|holistic|framework|solutions)\b/i);
    expect(copy).not.toContain("₦400,000");
  });

  it("formats naira in full with thousands separators", () => {
    expect(formatNaira(1_200_000)).toBe("₦1,200,000");
  });
});
