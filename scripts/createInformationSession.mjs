const startAt = "2026-08-23T19:00:00+01:00";
const endAt = "2026-08-23T20:00:00+01:00";
const eventId = "jump2026infosessionaug23";
const requestId = "jump2026-information-session-20260823";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

if (!clientId || !clientSecret || !refreshToken) {
  throw new Error("Google Calendar credentials are not configured.");
}

const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  }),
});

if (!tokenResponse.ok) {
  throw new Error(`Google OAuth token refresh failed (${tokenResponse.status}).`);
}

const tokenBody = await tokenResponse.json();
if (!tokenBody.access_token) {
  throw new Error("Google OAuth token response did not include an access token.");
}

const eventResponse = await fetch(
  `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=none`,
  {
    method: "POST",
    headers: {
      authorization: `Bearer ${tokenBody.access_token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      id: eventId,
      summary: "JUMP 2026 Information Session & Briefing",
      description: [
        "JUMP 2026 Information Session & Briefing",
        "Hosted by the JUMP Admin Team, following the format introduced last year.",
        "",
        "Purpose: to introduce the full programme experience, answer participant questions, explain the shared cohort journey, and allow participants to meet one another before the programme begins.",
        "",
        "The session will be recorded for participants who are unable to attend live. Kindly use the Google Calendar response buttons to confirm whether you will attend.",
      ].join("\n"),
      start: { dateTime: startAt, timeZone: "Africa/Lagos" },
      end: { dateTime: endAt, timeZone: "Africa/Lagos" },
      conferenceData: {
        createRequest: {
          requestId,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      guestsCanInviteOthers: false,
      guestsCanModify: false,
      guestsCanSeeOtherGuests: false,
      extendedProperties: { private: { jumpProgramme: "JUMP-2026", eventPurpose: "information-session" } },
    }),
  },
);

const eventBody = await eventResponse.json();
if (!eventResponse.ok) {
  throw new Error(`Google Calendar Information Session creation failed (${eventResponse.status}): ${JSON.stringify(eventBody)}`);
}

const meetLink = eventBody.hangoutLink
  ?? eventBody.conferenceData?.entryPoints?.find((entryPoint) => entryPoint.entryPointType === "video")?.uri;

console.log(JSON.stringify({
  eventId: eventBody.id,
  htmlLink: eventBody.htmlLink,
  meetLink,
  conferenceStatus: eventBody.conferenceData?.createRequest?.status?.statusCode ?? "unknown",
  startAt,
  endAt,
}, null, 2));
