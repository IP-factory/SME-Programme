import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { ACCOUNT_AUTH_ERRORS } from "@shared/auth";
import { getAccountSessionCookieOptions } from "@server/_core/cookies";
import { assertSameOrigin, requireBusinessMembership, toAccountView, type AccountSession } from "@server/accountAuth";

const req = (overrides: Partial<Request> & { headers?: Record<string, string> }) => ({ protocol: "http", secure: false, headers: {}, ...overrides }) as unknown as Request;

describe("account session cookie", () => {
  it("is HttpOnly, SameSite=Lax and host-wide", () => {
    expect(getAccountSessionCookieOptions(req({}), "development")).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/", secure: false });
  });

  it("is Secure over HTTPS and always Secure in production", () => {
    expect(getAccountSessionCookieOptions(req({ protocol: "https" }), "development").secure).toBe(true);
    expect(getAccountSessionCookieOptions(req({ protocol: "http" }), "production").secure).toBe(true);
  });
});

describe("assertSameOrigin", () => {
  it("allows requests with no Origin and requests from the same host", () => {
    expect(() => assertSameOrigin(req({}))).not.toThrow();
    expect(() => assertSameOrigin(req({ headers: { origin: "https://app.example.test", host: "app.example.test" } }))).not.toThrow();
    expect(() => assertSameOrigin(req({ headers: { origin: "https://app.example.test", "x-forwarded-host": "app.example.test", host: "internal" } }))).not.toThrow();
  });

  it("rejects an Origin that names another site", () => {
    expect(() => assertSameOrigin(req({ headers: { origin: "https://evil.example", host: "app.example.test" } }))).toThrowError(ACCOUNT_AUTH_ERRORS.crossSite);
    expect(() => assertSameOrigin(req({ headers: { origin: "https://app.example.test.evil.example", host: "app.example.test" } }))).toThrow();
    expect(() => assertSameOrigin(req({ headers: { origin: "null", host: "app.example.test" } }))).toThrow();
  });
});

describe("session view and business membership", () => {
  const session = {
    sessionId: 9,
    authority: { roles: [], permissions: [], legacyCapabilities: [], isSuperAdmin: false },
    user: { id: 1, fullName: "Ada Example", email: "ada@example.test", status: "active" as const },
    platformRoles: [],
    permissions: [],
    memberships: [{ businessId: 5, businessName: "Example Traders", role: "owner" as const, status: "active" as const, profileComplete: false, profilePercent: 20 }],
    activeBusiness: { businessId: 5, businessName: "Example Traders", role: "owner" as const, status: "active" as const, profileComplete: false, profilePercent: 20 },
    landingPath: "/dashboard" as const,
  } satisfies AccountSession;

  it("never exposes the internal session id or the authority internals", () => {
    const view = toAccountView(session);
    expect(view).not.toHaveProperty("sessionId");
    expect(view).not.toHaveProperty("authority");
  });

  it("grants only the user's own business and gives one answer for any other id", () => {
    expect(requireBusinessMembership(session, 5).businessName).toBe("Example Traders");
    for (const foreign of [6, 0, -1, 2_000_000_000]) {
      expect(() => requireBusinessMembership(session, foreign)).toThrowError(ACCOUNT_AUTH_ERRORS.noBusinessAccess);
    }
  });
});
