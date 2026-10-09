import { ENV } from "./_core/env";

/**
 * Reads a booking from IP Factory's Calendly account, so the admin console shows when a discovery call is booked for.
 * The browser only passes the booking's address (Calendly tells the page when someone books); the time is fetched here
 * with CALENDLY_API_TOKEN, so it cannot be made up by the browser, and the booking must belong to the owner who took the
 * check. Without the token, or if anything fails, nothing is recorded and the call stays "requested".
 */

const API = "https://api.calendly.com";
/** The only shape accepted from the browser: a scheduled event in Calendly's API. */
export const CALENDLY_EVENT_URI = /^https:\/\/api\.calendly\.com\/scheduled_events\/[A-Za-z0-9-]{8,64}$/;

export function isCalendlyConfigured() {
  return Boolean(ENV.calendlyApiToken);
}

async function calendly<T>(path: string): Promise<T | null> {
  // A slow Calendly must never hold up the owner's confirmation: give up after 5 seconds.
  const response = await fetch(`${API}${path}`, { headers: { authorization: `Bearer ${ENV.calendlyApiToken}`, accept: "application/json" }, signal: AbortSignal.timeout(5000) });
  if (!response.ok) {
    // Visible in the hosting logs; never includes the token or anyone's email. 401 means the token is wrong or revoked.
    console.warn(`[Calendly] ${path.split("?")[0].replace(/[A-Za-z0-9-]{8,}/g, "…")} returned ${response.status}`);
    return null;
  }
  return (await response.json()) as T;
}

/** IP Factory's Calendly organisation, read once per server instance. */
let organisation: Promise<string | null> | null = null;
function organisationUri() {
  organisation ??= calendly<{ resource?: { current_organization?: string } }>("/users/me").then((me) => {
    const uri = me?.resource?.current_organization ?? null;
    if (!uri) organisation = null; // try again next time rather than remembering a failure
    return uri;
  });
  return organisation;
}

/** Forgets the cached organisation (tests). */
export function resetCalendlyForTests() {
  organisation = null;
}

/**
 * The time of the active Calendly booking made with `inviteeEmail`: the next upcoming one, or else the most recent.
 * Used to fill in bookings the page could not report (made before the token was set, or in a new tab).
 */
export async function findBookedCall(inviteeEmail: string, now = new Date()): Promise<Date | null> {
  if (!isCalendlyConfigured()) return null;
  try {
    const org = await organisationUri();
    if (!org) return null;
    const query = new URLSearchParams({ organization: org, invitee_email: inviteeEmail.trim().toLowerCase(), status: "active", sort: "start_time:desc", count: "20" });
    const events = await calendly<{ collection?: { start_time?: string; status?: string }[] }>(`/scheduled_events?${query}`);
    const times = (events?.collection ?? [])
      .filter((event) => event.status === "active" && event.start_time)
      .map((event) => new Date(event.start_time!))
      .filter((time) => !Number.isNaN(time.getTime()));
    const upcoming = times.filter((time) => time >= now).sort((a, b) => a.getTime() - b.getTime());
    const past = times.filter((time) => time < now).sort((a, b) => b.getTime() - a.getTime());
    return upcoming[0] ?? past[0] ?? null;
  } catch (error) {
    console.warn("[Calendly] Could not look up bookings:", error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * The start time of an active Calendly booking made by `inviteeEmail`, or null when the token is missing, the booking
 * is not in IP Factory's account, it was cancelled, or someone else booked it.
 */
export async function bookedCallTime(eventUri: string, inviteeEmail: string): Promise<Date | null> {
  if (!isCalendlyConfigured() || !CALENDLY_EVENT_URI.test(eventUri)) return null;
  const path = eventUri.slice(API.length);
  try {
    const event = await calendly<{ resource?: { start_time?: string; status?: string } }>(path);
    const start = event?.resource?.start_time ? new Date(event.resource.start_time) : null;
    if (!start || Number.isNaN(start.getTime()) || event?.resource?.status !== "active") return null;
    const invitees = await calendly<{ collection?: { email?: string; status?: string }[] }>(`${path}/invitees?email=${encodeURIComponent(inviteeEmail)}`);
    const email = inviteeEmail.trim().toLowerCase();
    const matches = (invitees?.collection ?? []).some((invitee) => invitee.email?.trim().toLowerCase() === email && invitee.status !== "canceled");
    return matches ? start : null;
  } catch (error) {
    console.warn("[Calendly] Could not read the booking:", error instanceof Error ? error.message : error);
    return null;
  }
}
