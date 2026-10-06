import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const routerSource = readFileSync(resolve(import.meta.dirname, "routers/informationSession.ts"), "utf8");

describe("Information Session attendance router safeguards", () => {
  it("requires the participant-viewing administrator capability before returning RSVP states", () => {
    expect(routerSource).toContain('adminPermissionProcedure("view_participants")');
  });

  it("reads RSVP data only from the canonical Information Session event", () => {
    expect(routerSource).toContain("getCalendarEventAttendeeResponses(INFORMATION_SESSION.eventId)");
    expect(routerSource).toContain("INFORMATION_SESSION_RECIPIENT_IDS");
  });

  it("fails closed when the calendar cannot be refreshed", () => {
    expect(routerSource).toContain("available: false as const");
    expect(routerSource).toContain("Calendar RSVP responses could not be refreshed");
  });
});
