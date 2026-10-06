import { describe, expect, it } from "vitest";
import { getBusyRanges, isCalendarConfigured } from "./calendar";

const shouldValidate = process.env.VALIDATE_GOOGLE_CALENDAR === "1";

describe.skipIf(!shouldValidate)("Google Calendar credential readiness", () => {
  it("refreshes the configured credential and reads a narrow free-busy window", async () => {
    expect(isCalendarConfigured()).toBe(true);

    const start = new Date("2026-08-23T18:00:00.000Z");
    const end = new Date("2026-08-23T19:00:00.000Z");
    const busyRanges = await getBusyRanges(start, end);

    expect(Array.isArray(busyRanges)).toBe(true);
    for (const range of busyRanges) {
      expect(range.start).toBeInstanceOf(Date);
      expect(range.end).toBeInstanceOf(Date);
    }
  }, 20_000);
});
