import { ENV } from "./_core/env";
import { BRAND } from "../shared/brand";

export type CalendarSyncStatus = "Created" | "Pending" | "Failed" | "NotConfigured";
export type BusyRange = { start: Date; end: Date };
export type CalendarAttendeeResponse = {
  email: string;
  responseStatus: string;
};

export function isCalendarConfigured() {
  return Boolean(ENV.googleClientId && ENV.googleClientSecret && ENV.googleRefreshToken && ENV.googleCalendarId);
}

export function calendarConfigurationMessage() {
  return isCalendarConfigured()
    ? "Google Calendar is connected."
    : "Availability is managed by owner coordination. The site prevents double-booking locally.";
}

async function getAccessToken() {
  if (!isCalendarConfigured()) return null;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      refresh_token: ENV.googleRefreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) throw new Error(`Google OAuth token refresh failed (${response.status})`);
  const body = await response.json() as { access_token?: string };
  if (!body.access_token) throw new Error("Google OAuth response did not include an access token");
  return body.access_token;
}

export async function getBusyRanges(timeMin: Date, timeMax: Date): Promise<BusyRange[]> {
  const accessToken = await getAccessToken();
  if (!accessToken) return [];
  const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone: "Africa/Lagos",
      items: [{ id: ENV.googleCalendarId }],
    }),
  });
  if (!response.ok) throw new Error(`Google Calendar free/busy query failed (${response.status})`);
  const body = await response.json() as { calendars?: Record<string, { busy?: Array<{ start: string; end: string }> }> };
  return (body.calendars?.[ENV.googleCalendarId]?.busy ?? []).map((range) => ({ start: new Date(range.start), end: new Date(range.end) }));
}

/** Reads RSVP status from one private owner-calendar event without exposing calendar data to clients. */
export async function getCalendarEventAttendeeResponses(eventId: string): Promise<CalendarAttendeeResponse[]> {
  const accessToken = await getAccessToken();
  if (!accessToken) return [];
  const fields = encodeURIComponent("attendees(email,responseStatus)");
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(ENV.googleCalendarId)}/events/${encodeURIComponent(eventId)}?fields=${fields}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Google Calendar attendee query failed (${response.status})`);
  const body = await response.json() as { attendees?: CalendarAttendeeResponse[] };
  return (body.attendees ?? []).filter((attendee) => Boolean(attendee.email));
}

export async function createCalendarEvent(input: {
  summary: string;
  description: string;
  startAt: Date;
  endAt: Date;
  attendeeEmail: string;
  attendeeName: string;
}) {
  const accessToken = await getAccessToken();
  if (!accessToken) return { status: "NotConfigured" as const, eventId: undefined };
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(ENV.googleCalendarId)}/events?sendUpdates=all`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.startAt.toISOString(), timeZone: "Africa/Lagos" },
      end: { dateTime: input.endAt.toISOString(), timeZone: "Africa/Lagos" },
      attendees: [{ email: input.attendeeEmail, displayName: input.attendeeName }],
      guestsCanInviteOthers: false,
      guestsCanModify: false,
      guestsCanSeeOtherGuests: false,
      extendedProperties: { private: { jumpProgramme: `${BRAND.programmeShortName}-2026` } },
    }),
  });
  if (!response.ok) throw new Error(`Google Calendar event creation failed (${response.status})`);
  const body = await response.json() as { id?: string };
  return { status: "Created" as const, eventId: body.id };
}

/** Updates an owner-created programme event and sends a single RSVP invitation to each attendee. */
export async function updateCalendarEvent(input: {
  eventId: string;
  summary: string;
  description: string;
  startAt: Date;
  endAt: Date;
  attendees: Array<{ email: string; displayName: string }>;
}) {
  const accessToken = await getAccessToken();
  if (!accessToken) return { status: "NotConfigured" as const, eventId: undefined };
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(ENV.googleCalendarId)}/events/${encodeURIComponent(input.eventId)}?sendUpdates=all`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.startAt.toISOString(), timeZone: "Africa/Lagos" },
      end: { dateTime: input.endAt.toISOString(), timeZone: "Africa/Lagos" },
      attendees: input.attendees,
      guestsCanInviteOthers: false,
      guestsCanModify: false,
      guestsCanSeeOtherGuests: false,
    }),
  });
  if (!response.ok) throw new Error(`Google Calendar event update failed (${response.status})`);
  const body = await response.json() as { id?: string };
  return { status: "Created" as const, eventId: body.id ?? input.eventId };
}
