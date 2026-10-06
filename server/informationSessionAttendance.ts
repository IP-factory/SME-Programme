import type { CalendarAttendeeResponse } from "./calendar";

export type InformationSessionRsvpStatus = "Confirmed" | "Tentative" | "Declined" | "Awaiting response";

export function normaliseAttendanceEmail(email: string) {
  return email.trim().toLowerCase();
}

export function toInformationSessionRsvpStatus(responseStatus: string | undefined): InformationSessionRsvpStatus {
  switch ((responseStatus || "").toLowerCase()) {
    case "accepted": return "Confirmed";
    case "tentative": return "Tentative";
    case "declined": return "Declined";
    default: return "Awaiting response";
  }
}

export function buildInformationSessionAttendance<T extends { id: number; email: string }>(
  registrations: T[],
  attendeeResponses: CalendarAttendeeResponse[],
) {
  const responseByEmail = new Map(
    attendeeResponses.map((attendee) => [normaliseAttendanceEmail(attendee.email), attendee.responseStatus]),
  );
  return registrations.map((registration) => ({
    registrationId: registration.id,
    status: toInformationSessionRsvpStatus(responseByEmail.get(normaliseAttendanceEmail(registration.email))),
  }));
}
