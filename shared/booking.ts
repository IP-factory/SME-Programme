/**
 * The free discovery call is booked in a scheduling app, not arranged by hand. A Calendly link is
 * embedded on the result page with the owner's name and email filled in, and Calendly tells the page
 * when a time is booked. Any other booking page (Microsoft Bookings, Google appointment schedules,
 * Cal.com…) opens in a new tab.
 */
export type BookingTarget =
  /** `openUrl`: the same page for a new tab, with the owner's details filled in, for when the embed is blocked. */
  | { kind: "calendly"; embedUrl: string; pageUrl: string; openUrl: string }
  | { kind: "link"; pageUrl: string }
  | { kind: "none" };

export const CALENDLY_ORIGIN = "https://calendly.com";

/** Only https booking pages are accepted; anything else is treated as not configured. */
export function bookingTarget(url: string | undefined, prefill: { name?: string; email?: string; host?: string } = {}): BookingTarget {
  let parsed: URL;
  try {
    parsed = new URL((url ?? "").trim());
  } catch {
    return { kind: "none" };
  }
  if (parsed.protocol !== "https:") return { kind: "none" };
  const pageUrl = parsed.toString();
  if (parsed.hostname !== "calendly.com" && !parsed.hostname.endsWith(".calendly.com")) return { kind: "link", pageUrl };

  const open = new URL(pageUrl);
  if (prefill.name) open.searchParams.set("name", prefill.name);
  if (prefill.email) open.searchParams.set("email", prefill.email);
  const embed = new URL(pageUrl);
  if (prefill.host) embed.searchParams.set("embed_domain", prefill.host);
  embed.searchParams.set("embed_type", "Inline");
  embed.searchParams.set("hide_gdpr_banner", "1");
  if (prefill.name) embed.searchParams.set("name", prefill.name);
  if (prefill.email) embed.searchParams.set("email", prefill.email);
  return { kind: "calendly", embedUrl: embed.toString(), pageUrl, openUrl: open.toString() };
}

/** True for Calendly's message when the owner has picked a time in the embedded calendar. */
export function isCalendlyBooking(event: { origin: string; data: unknown }) {
  const data = event.data as { event?: unknown } | null;
  return event.origin === CALENDLY_ORIGIN && typeof data === "object" && data !== null && data.event === "calendly.event_scheduled";
}

/** The booking's address in Calendly's API, from Calendly's "event scheduled" message, or undefined. */
export function calendlyEventUri(data: unknown): string | undefined {
  const uri = (data as { payload?: { event?: { uri?: unknown } } } | null)?.payload?.event?.uri;
  return typeof uri === "string" && uri.startsWith("https://api.calendly.com/scheduled_events/") ? uri : undefined;
}
