import { describe, expect, it } from "vitest";
import { MAX_IDENTIFIER_BYTES, pgIdentifier } from "../../scripts/pgIdentifier.mjs";

describe("pgIdentifier (PostgreSQL's 63-byte identifier limit)", () => {
  it("leaves names within the limit alone", () => {
    expect(MAX_IDENTIFIER_BYTES).toBe(63);
    expect(pgIdentifier("users_email_lower_unique")).toBe("users_email_lower_unique");
    expect(pgIdentifier("a".repeat(63))).toBe("a".repeat(63));
  });

  it("truncates to 63 bytes exactly as PostgreSQL stores it", () => {
    const declared = "client_onboarding_invitations_businessCheckId_business_checks_id_fk";
    expect(declared.length).toBe(67);
    expect(pgIdentifier(declared)).toBe("client_onboarding_invitations_businessCheckId_business_checks_i");
    expect(pgIdentifier("a".repeat(64))).toBe("a".repeat(63));
  });

  it("never splits a multi-byte character", () => {
    const name = `${"a".repeat(62)}é`; // 62 + 2 bytes
    expect(Buffer.byteLength(pgIdentifier(name))).toBeLessThanOrEqual(63);
    expect(pgIdentifier(name)).toBe("a".repeat(62));
  });
});
