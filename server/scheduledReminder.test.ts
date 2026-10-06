import { describe, expect, it } from "vitest";
import {
  automatedReminderPolicy,
  isAuthorisedCronRequest,
  OWNER_APPROVAL_REQUIRED_FOR_REMINDERS,
  reminderDeliveryKey,
  reminderWindow,
} from "./scheduledReminder";

describe("scheduled 24-hour reminders", () => {
  it("accepts only the configured cron secret, and nothing when no secret is set", () => {
    expect(isAuthorisedCronRequest("Bearer s3cret-value", "s3cret-value")).toBe(true);
    expect(isAuthorisedCronRequest("Bearer wrong", "s3cret-value")).toBe(false);
    expect(isAuthorisedCronRequest("s3cret-value", "s3cret-value")).toBe(false);
    expect(isAuthorisedCronRequest(undefined, "s3cret-value")).toBe(false);
    expect(isAuthorisedCronRequest("Bearer ", "")).toBe(false);
  });

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
