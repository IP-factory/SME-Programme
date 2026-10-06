import { describe, expect, it } from "vitest";
import { filterAvailableSlotRows, generateSlotDefinitions, isBlackoutDate, requiredMeetingsForPackage } from "./scheduling";

describe("JUMP scheduling rules", () => {
  it("excludes the September blackout dates", () => {
    const slots = generateSlotDefinitions("Decide", { start: new Date("2026-09-07T00:00:00.000Z"), end: new Date("2026-09-14T23:59:59.999Z") });
    expect(slots.every((slot) => !isBlackoutDate(slot.startAt))).toBe(true);
    expect(slots.some((slot) => slot.startAt.toISOString().startsWith("2026-09-09"))).toBe(false);
    expect(slots.some((slot) => slot.startAt.toISOString().startsWith("2026-09-12"))).toBe(false);
  });

  it("generates Decide slots from the stated availability", () => {
    const slots = generateSlotDefinitions("Decide", { start: new Date("2026-08-24T00:00:00.000Z"), end: new Date("2026-08-30T23:59:59.999Z") });
    const times = slots.map((slot) => slot.startAt.toISOString().slice(11, 16));
    expect(times).toContain("06:00");
    expect(times).toContain("17:00");
    expect(slots.every((slot) => slot.capacity === 1 && slot.timezone === "Africa/Lagos")).toBe(true);
  });

  it("returns package session allowances", () => {
    expect(requiredMeetingsForPackage("Boardroom")).toEqual({ kind: "Decide", count: 3 });
    expect(requiredMeetingsForPackage("Engine Room")).toEqual({ kind: "Apply", count: 3 });
    expect(requiredMeetingsForPackage("Foundation")).toEqual({ kind: "Learn", count: 5 });
  });

  it("filters capacity and calendar conflicts before showing availability", () => {
    const rows = [
      { startAt: new Date("2026-08-24T06:00:00.000Z"), endAt: new Date("2026-08-24T07:30:00.000Z"), status: "Open" as const, capacity: 1, bookedCount: 0 },
      { startAt: new Date("2026-08-25T06:00:00.000Z"), endAt: new Date("2026-08-25T07:30:00.000Z"), status: "Open" as const, capacity: 1, bookedCount: 1 },
      { startAt: new Date("2026-08-26T06:00:00.000Z"), endAt: new Date("2026-08-26T07:30:00.000Z"), status: "Open" as const, capacity: 1, bookedCount: 0 },
    ];
    const available = filterAvailableSlotRows(rows, [{ start: new Date("2026-08-26T06:15:00.000Z"), end: new Date("2026-08-26T07:00:00.000Z") }]);
    expect(available).toHaveLength(1);
    expect(available[0]?.startAt.toISOString()).toContain("2026-08-24");
  });
});
