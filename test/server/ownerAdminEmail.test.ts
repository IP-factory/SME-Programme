import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadEnv(value: string | undefined) {
  vi.resetModules();
  if (value === undefined) vi.stubEnv("OWNER_ADMIN_EMAIL", undefined as unknown as string);
  else vi.stubEnv("OWNER_ADMIN_EMAIL", value);
  return (await import("@server/_core/env")).ENV.ownerAdminEmail;
}

describe("OWNER_ADMIN_EMAIL", () => {
  it("falls back to the default when unset, blank or only spaces", async () => {
    const fallback = await loadEnv(undefined);
    expect(fallback).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
    expect(await loadEnv("")).toBe(fallback);
    expect(await loadEnv("   ")).toBe(fallback);
  });

  it("is trimmed and lower-cased when set", async () => {
    expect(await loadEnv("  Owner@Example.COM ")).toBe("owner@example.com");
  });
});

describe("isOwnerAdmin", () => {
  it("matches the owner email case-insensitively and nobody else", async () => {
    vi.resetModules();
    vi.stubEnv("OWNER_ADMIN_EMAIL", "owner@example.com");
    const { isOwnerAdmin } = await import("@server/adminSecurity");
    expect(isOwnerAdmin({ email: " Owner@Example.com " })).toBe(true);
    expect(isOwnerAdmin({ email: "someone@example.com" })).toBe(false);
  });

  it("never treats a user without an email as the owner, even when the variable is blank", async () => {
    vi.resetModules();
    vi.stubEnv("OWNER_ADMIN_EMAIL", "");
    const { isOwnerAdmin } = await import("@server/adminSecurity");
    expect(isOwnerAdmin({ email: null })).toBe(false);
    expect(isOwnerAdmin({ email: "" })).toBe(false);
    expect(isOwnerAdmin({ email: "   " })).toBe(false);
  });
});
