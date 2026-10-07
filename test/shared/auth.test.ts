import { describe, expect, it } from "vitest";
import {
  ACCOUNT_AUTH_ERRORS,
  ACCOUNT_PASSWORD_MAX_LENGTH,
  ACCOUNT_PASSWORD_MIN_LENGTH,
  PLATFORM_ROLES,
  normaliseAccountEmail,
  signInInputSchema,
  onboardingAcceptInputSchema,
  ONBOARDING_INVITATION_TTL_MS,
  validateAccountPassword,
} from "@shared/auth";
import { BUSINESS_MEMBERSHIP_ROLES, BUSINESS_MEMBERSHIP_STATUSES, isBusinessProfileComplete } from "@shared/businessMemberships";

const valid = { token: "t".repeat(43), fullName: "Ada Example", email: "Ada@Example.com", password: "correct horse 42", confirmPassword: "correct horse 42", businessName: "Example Traders" };

describe("account email and password rules", () => {
  it("normalises emails by trimming and lower-casing", () => {
    expect(normaliseAccountEmail("  Person@Example.COM ")).toBe("person@example.com");
    expect(normaliseAccountEmail(null)).toBe("");
  });

  it("enforces length and character policy", () => {
    expect(validateAccountPassword("short1")).toMatch(new RegExp(`at least ${ACCOUNT_PASSWORD_MIN_LENGTH}`));
    expect(validateAccountPassword("only letters here")).toMatch(/letter and one number/);
    expect(validateAccountPassword("1234567890123")).toMatch(/letter and one number/);
    expect(validateAccountPassword(`a1${"x".repeat(ACCOUNT_PASSWORD_MAX_LENGTH)}`)).toMatch(/no more than/);
    expect(validateAccountPassword("correct horse 42")).toBeNull();
  });
});

describe("onboarding acceptance input", () => {
  it("asks for the invitation token plus five account fields, and normalises the email", () => {
    const parsed = onboardingAcceptInputSchema.parse(valid);
    expect(Object.keys(parsed).sort()).toEqual(["businessName", "confirmPassword", "email", "fullName", "password", "token"]);
    expect(parsed.email).toBe("ada@example.com");
  });

  it("trims names and rejects bad input with a readable first message", () => {
    expect(onboardingAcceptInputSchema.parse({ ...valid, fullName: "  Ada Example ", businessName: "  Example Traders " })).toMatchObject({ fullName: "Ada Example", businessName: "Example Traders" });
    const messages = (patch: object) => onboardingAcceptInputSchema.safeParse({ ...valid, ...patch }).error?.issues.map((issue: { message: string }) => issue.message);
    expect(messages({ email: "nope" })).toContain("Enter a valid email address.");
    expect(messages({ confirmPassword: "different 12345" })).toContain("The password confirmation does not match.");
    expect(messages({ businessName: "" })).toContain("Enter your business name.");
    expect(messages({ token: "short" })).toBeDefined();
    expect(onboardingAcceptInputSchema.safeParse({ ...valid, token: undefined }).success).toBe(false);
    expect(messages({ businessName: "x".repeat(256) })).toBeDefined();
    expect(messages({ fullName: "x".repeat(256) })).toBeDefined();
  });

  it("does not ask for profile fields during account creation", () => {
    const parsed = onboardingAcceptInputSchema.parse({ ...valid, sector: "Retail", website: "https://x.test", phone: "123" } as never);
    expect(parsed).not.toHaveProperty("sector");
    expect(parsed).not.toHaveProperty("website");
    expect(parsed).not.toHaveProperty("phone");
  });
});

describe("sign-in input", () => {
  it("normalises the email and does not apply the password policy", () => {
    expect(signInInputSchema.parse({ email: " A@B.com ", password: "x" })).toEqual({ email: "a@b.com", password: "x" });
    expect(signInInputSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("roles and vocabulary", () => {
  it("keeps business membership roles separate from platform roles", () => {
    expect(BUSINESS_MEMBERSHIP_ROLES).toEqual(["owner", "business_admin", "member"]);
    expect(BUSINESS_MEMBERSHIP_ROLES.filter(role => (PLATFORM_ROLES as readonly string[]).includes(role))).toEqual([]);
    expect(PLATFORM_ROLES).toEqual(["super_admin", "admin", "desk_lead", "analyst", "partner", "subject_matter_expert", "finance"]);
    expect(BUSINESS_MEMBERSHIP_ROLES).not.toContain("founder");
  });

  it("reserves an invited status for the later invitation flow", () => {
    expect(BUSINESS_MEMBERSHIP_STATUSES).toContain("invited");
  });

  it("does not reuse the legacy login message, which would trigger the platform OAuth redirect", () => {
    expect(ACCOUNT_AUTH_ERRORS.signInRequired).not.toMatch(/10001/);
  });

  it("treats a business profile as complete only when description, sector and country are set", () => {
    expect(isBusinessProfileComplete({})).toBe(false);
    expect(isBusinessProfileComplete({ description: "d", sector: "s", country: " " })).toBe(false);
    expect(isBusinessProfileComplete({ description: "d", sector: "s", country: "Nigeria" })).toBe(true);
  });
});

describe("onboarding invitations", () => {
  it("expire after seven days", () => {
    expect(ONBOARDING_INVITATION_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });
});
