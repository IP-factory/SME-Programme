/**
 * The free discovery call is booked in a scheduling app, not arranged by hand. A Calendly link is
 * embedded on the result page with the owner's name and email filled in, and Calendly tells the page
 * when a time is booked. Any other booking page (Microsoft Bookings, Google appointment schedules,
 * Cal.com…) opens in a new tab.
 */
export type BookingTarget =
  | { kind: "calendly"; embedUrl: string; pageUrl: string }
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

  const embed = new URL(pageUrl);
  if (prefill.host) embed.searchParams.set("embed_domain", prefill.host);
  embed.searchParams.set("embed_type", "Inline");
  embed.searchParams.set("hide_gdpr_banner", "1");
  if (prefill.name) embed.searchParams.set("name", prefill.name);
  if (prefill.email) embed.searchParams.set("email", prefill.email);
  return { kind: "calendly", embedUrl: embed.toString(), pageUrl };
}

/** True for Calendly's message when the owner has picked a time in the embedded calendar. */
export function isCalendlyBooking(event: { origin: string; data: unknown }) {
  const data = event.data as { event?: unknown } | null;
  return event.origin === CALENDLY_ORIGIN && typeof data === "object" && data !== null && data.event === "calendly.event_scheduled";
}
