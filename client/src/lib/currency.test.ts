import { describe, expect, it } from "vitest";
import { USD_TO_NGN_RATE, formatProgrammePrice } from "./currency";

describe("programme currency display", () => {
  it("uses the fixed reference rate", () => {
    expect(USD_TO_NGN_RATE).toBe(1400);
  });

  it("keeps the original naira price when NGN is selected", () => {
    expect(formatProgrammePrice("Foundation", "NGN")).toContain("575,000");
    expect(formatProgrammePrice("Boardroom", "NGN")).toContain("1,500,000");
  });

  it("shows rounded dollar equivalents by default", () => {
    expect(formatProgrammePrice("Foundation", "USD")).toBe("$411");
    expect(formatProgrammePrice("Engine Room", "USD")).toBe("$625");
    expect(formatProgrammePrice("Boardroom", "USD")).toBe("$1,071");
  });
});
