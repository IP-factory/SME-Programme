import { describe, expect, it } from "vitest";
import { buildInformationSessionAttendance, normaliseAttendanceEmail, toInformationSessionRsvpStatus } from "./informationSessionAttendance";

describe("Information Session attendance mapping", () => {
  it("normalises calendar attendee addresses before matching them to registrations", () => {
    expect(normaliseAttendanceEmail("  Amaka.Eze@Example.com ")).toBe("amaka.eze@example.com");
  });

  it("maps Google RSVP response values into clear admin-facing attendance states", () => {
    expect(toInformationSessionRsvpStatus("accepted")).toBe("Confirmed");
    expect(toInformationSessionRsvpStatus("tentative")).toBe("Tentative");
    expect(toInformationSessionRsvpStatus("declined")).toBe("Declined");
    expect(toInformationSessionRsvpStatus("needsAction")).toBe("Awaiting response");
  });

  it("returns a confirmed row only for the registration whose invited email accepted the calendar event", () => {
    const attendance = buildInformationSessionAttendance(
      [{ id: 1, email: "Amaka@Example.com" }, { id: 2, email: "Other@Example.com" }],
      [{ email: "amaka@example.com", responseStatus: "accepted" }, { email: "other@example.com", responseStatus: "needsAction" }],
    );
    expect(attendance).toEqual([
      { registrationId: 1, status: "Confirmed" },
      { registrationId: 2, status: "Awaiting response" },
    ]);
  });
});
