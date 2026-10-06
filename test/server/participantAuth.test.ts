import { describe, expect, it } from "vitest";
import {
  buildParticipantPasswordUrl,
  getParticipantSessionCookieOptions,
  isActiveParticipantToken,
} from "@server/participantAuth";

describe("participant password-session lifecycle", () => {
  it("creates a password-only portal route rather than a direct-access or magic-link route", () => {
    const url = buildParticipantPasswordUrl("https://emmanueltarfa.com", "setup-token");
    expect(url).toBe("https://emmanueltarfa.com/portal/password?token=setup-token");
    expect(url).not.toContain("authenticate");
    expect(url).not.toContain("/portal/access");
  });

  it("configures an http-only, secure 30-day participant session cookie", () => {
    const options = getParticipantSessionCookieOptions({ protocol: "https", headers: {} } as never);
    expect(options).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/" });
    expect(options.maxAge).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("rejects expired, consumed, and revoked password or session tokens", () => {
    const now = new Date("2026-08-30T20:00:00.000Z");
    expect(isActiveParticipantToken({ expiresAt: new Date("2026-08-30T20:20:00.000Z") }, now)).toBe(true);
    expect(isActiveParticipantToken({ expiresAt: new Date("2026-08-30T19:59:59.000Z") }, now)).toBe(false);
    expect(isActiveParticipantToken({ expiresAt: new Date("2026-08-30T20:20:00.000Z"), consumedAt: now }, now)).toBe(false);
    expect(isActiveParticipantToken({ expiresAt: new Date("2026-08-30T20:20:00.000Z"), revokedAt: now }, now)).toBe(false);
  });
});
