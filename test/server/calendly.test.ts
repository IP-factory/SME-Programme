import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const env = vi.hoisted(() => ({ calendlyApiToken: "test-calendly-token" }));
vi.mock("@server/_core/env", () => ({ ENV: env }));

import { bookedCallTime, CALENDLY_EVENT_URI } from "@server/calendly";

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
