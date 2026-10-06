import { describe, expect, it } from "vitest";
import {
  automatedReminderPolicy,
  OWNER_APPROVAL_REQUIRED_FOR_REMINDERS,
  reminderDeliveryKey,
  reminderWindow,
} from "./scheduledReminder";

describe("scheduled 24-hour reminders", () => {
  it("uses a stable delivery key for exactly one reminder per booking", () => {
    expect(reminderDeliveryKey(42)).toBe("booking:42:24h");
  });

  it("selects sessions in a bounded window around the 24-hour mark", () => {
    const now = new Date("2026-08-20T08:00:00.000Z");
    const window = reminderWindow(now);
    expect(window.start.toISOString()).toBe("2026-08-21T07:30:00.000Z");
    expect(window.end.toISOString()).toBe("2026-08-21T08:30:00.000Z");
  });

  it("requires Emmanuel's explicit approval rather than sending unattended reminders", () => {
    expect(OWNER_APPROVAL_REQUIRED_FOR_REMINDERS).toBe(true);
    expect(automatedReminderPolicy()).toEqual({
      automatedDispatchEnabled: false,
      message: "JUMP 24-hour session reminders require Emmanuel's explicit approval before delivery.",
    });
  });
});
