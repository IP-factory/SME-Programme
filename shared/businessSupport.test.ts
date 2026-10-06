import { describe, expect, it } from "vitest";
import { DOORS, formatNaira, PRICE_LADDER } from "./businessSupport";

describe("business-support catalogue", () => {
  it("numbers the ten doors 0 to 10 without gaps, each with a measure", () => {
    expect(DOORS.map((door) => door.number)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const door of DOORS) expect(door.measure.length).toBeGreaterThan(0);
  });

  it("carries the decided price ladder", () => {
    expect(PRICE_LADDER.map((step) => [step.id, step.priceNaira])).toEqual([
      ["diagnostic", 500_000],
      ["sprint", 1_200_000],
      ["retainer", 400_000],
    ]);
  });

  it("formats naira with thousands separators", () => {
    expect(formatNaira(1_200_000)).toBe("₦1,200,000");
    expect(formatNaira(500_000)).toBe("₦500,000");
  });
});
