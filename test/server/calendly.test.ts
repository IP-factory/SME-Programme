import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const env = vi.hoisted(() => ({ calendlyApiToken: "test-calendly-token" }));
vi.mock("@server/_core/env", () => ({ ENV: env }));

import { bookedCallTime, CALENDLY_EVENT_URI, findBookedCall, resetCalendlyForTests } from "@server/calendly";

const EVENT = "https://api.calendly.com/scheduled_events/ABCDEF12-3456-7890";
const START = "2026-10-14T09:00:00.000000Z";

function calendlyReplies(event: unknown, invitees: unknown, ok = true) {
  return vi.fn(async (url: string) => ({
    ok,
    json: async () => (url.includes("/invitees") ? invitees : event),
  }));
}

describe("reading a Calendly booking", () => {
  beforeEach(() => {
    env.calendlyApiToken = "test-calendly-token";
  });
  afterEach(() => vi.unstubAllGlobals());

  it("returns the start time of an active booking made by the owner, asking Calendly with the token", async () => {
    const fetchMock = calendlyReplies({ resource: { start_time: START, status: "active" } }, { collection: [{ email: "Ada@Example.com", status: "active" }] });
    vi.stubGlobal("fetch", fetchMock);
    expect(await bookedCallTime(EVENT, "ada@example.com")).toEqual(new Date(START));
    expect(fetchMock).toHaveBeenCalledWith("https://api.calendly.com/scheduled_events/ABCDEF12-3456-7890", expect.objectContaining({ headers: expect.objectContaining({ authorization: "Bearer test-calendly-token" }), signal: expect.any(AbortSignal) }));
    expect(fetchMock.mock.calls[1][0]).toBe(`${EVENT}/invitees?email=ada%40example.com`);
  });

  it("records nothing for a cancelled booking, someone else's booking, or a booking Calendly does not know", async () => {
    vi.stubGlobal("fetch", calendlyReplies({ resource: { start_time: START, status: "canceled" } }, { collection: [{ email: "ada@example.com" }] }));
    expect(await bookedCallTime(EVENT, "ada@example.com")).toBeNull();
    vi.stubGlobal("fetch", calendlyReplies({ resource: { start_time: START, status: "active" } }, { collection: [{ email: "someone.else@example.com" }] }));
    expect(await bookedCallTime(EVENT, "ada@example.com")).toBeNull();
    vi.stubGlobal("fetch", calendlyReplies({}, {}, false));
    expect(await bookedCallTime(EVENT, "ada@example.com")).toBeNull();
  });

  it("never calls Calendly without the token or for an address that is not a Calendly booking, and survives a network failure", async () => {
    const fetchMock = vi.fn(async () => { throw new Error("offline"); });
    vi.stubGlobal("fetch", fetchMock);
    expect(await bookedCallTime("https://evil.example/scheduled_events/ABCDEF12", "ada@example.com")).toBeNull();
    env.calendlyApiToken = "";
    expect(await bookedCallTime(EVENT, "ada@example.com")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    env.calendlyApiToken = "test-calendly-token";
    expect(await bookedCallTime(EVENT, "ada@example.com")).toBeNull();
  });

  it("accepts only Calendly scheduled-event addresses from the browser", () => {
    expect(CALENDLY_EVENT_URI.test(EVENT)).toBe(true);
    for (const bad of ["https://calendly.com/ipfactory-info/x", "https://api.calendly.com/scheduled_events/../users/me", "http://api.calendly.com/scheduled_events/ABCDEF12", `${EVENT}?x=1`]) {
      expect(CALENDLY_EVENT_URI.test(bad), bad).toBe(false);
    }
  });
});

describe("finding a booking by the owner's email", () => {
  const ORG = "https://api.calendly.com/organizations/ORG12345";
  const NOW = new Date("2026-10-10T12:00:00Z");
  function replies(events: unknown[], { meOk = true, eventsOk = true } = {}) {
    return vi.fn(async (url: string) => {
      if (url.endsWith("/users/me")) return { ok: meOk, status: meOk ? 200 : 401, json: async () => ({ resource: { current_organization: ORG } }) };
      return { ok: eventsOk, status: eventsOk ? 200 : 500, json: async () => ({ collection: events }) };
    });
  }
  beforeEach(() => {
    env.calendlyApiToken = "test-calendly-token";
    resetCalendlyForTests();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("picks the next upcoming active booking, asking only for that email in IP Factory's organisation", async () => {
    const fetchMock = replies([
      { start_time: "2026-10-20T09:00:00Z", status: "active" },
      { start_time: "2026-10-14T09:00:00Z", status: "active" },
      { start_time: "2026-10-01T09:00:00Z", status: "active" },
    ]);
    vi.stubGlobal("fetch", fetchMock);
    expect(await findBookedCall(" Ada@Example.com ", NOW)).toEqual(new Date("2026-10-14T09:00:00Z"));
    const query = new URL(fetchMock.mock.calls[1][0] as string).searchParams;
    expect(query.get("organization")).toBe(ORG);
    expect(query.get("invitee_email")).toBe("ada@example.com");
    expect(query.get("status")).toBe("active");
  });

  it("falls back to the most recent past booking, and returns nothing when there is none", async () => {
    vi.stubGlobal("fetch", replies([{ start_time: "2026-10-01T09:00:00Z", status: "active" }, { start_time: "2026-10-05T09:00:00Z", status: "active" }]));
    expect(await findBookedCall("ada@example.com", NOW)).toEqual(new Date("2026-10-05T09:00:00Z"));
    vi.stubGlobal("fetch", replies([{ start_time: "2026-10-14T09:00:00Z", status: "canceled" }]));
    expect(await findBookedCall("ada@example.com", NOW)).toBeNull();
  });

  it("logs why a lookup failed without the token or the email, and does nothing without a token", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", replies([], { meOk: false }));
    expect(await findBookedCall("ada@example.com", NOW)).toBeNull();
    expect(warn).toHaveBeenCalledWith("[Calendly] /users/me returned 401");
    expect(JSON.stringify(warn.mock.calls)).not.toMatch(/test-calendly-token|ada@example\.com/);
    warn.mockRestore();
    env.calendlyApiToken = "";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await findBookedCall("ada@example.com", NOW)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
