import { z } from "zod";
import { BUSINESS_NAME_MAX_LENGTH } from "./businessMemberships";

/**
 * Universal account authentication (Phase 1).
 *
 * Authentication answers "who is this person?". Authorisation answers "what may they do?". Business membership
 * answers "which business may they act inside?". Keep the three separate.
 */

export const ACCOUNT_SESSION_COOKIE = "ipf_session";
export const ACCOUNT_SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
export const ACCOUNT_PASSWORD_MIN_LENGTH = 10;
export const ACCOUNT_PASSWORD_MAX_LENGTH = 128;
export const ACCOUNT_MAX_FAILED_ATTEMPTS = 5;
export const ACCOUNT_LOCKOUT_MS = 15 * 60 * 1000;
export const ACCOUNT_FULL_NAME_MAX_LENGTH = 255;
export const ACCOUNT_EMAIL_MAX_LENGTH = 320;

export const ACCOUNT_STATUSES = ["active", "suspended", "disabled"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

/**
 * Internal IPF roles. NOT built in Phase 1: they will be assigned to a person separately from any business
 * membership, with engagement assignments scoping where they apply. Until then, existing admin access keeps using
 * `users.role` ("user" | "admin") and the admin permission profiles.
 */
export const PLATFORM_ROLES = ["super_admin", "admin", "desk_lead", "analyst", "partner", "subject_matter_expert", "finance"] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const ACCOUNT_AUTH_ERRORS = {
  signInRequired: "Please sign in to continue.",
  invalidCredentials: "Your email or password is not correct.",
  locked: "Too many attempts. Kindly try again in 15 minutes.",
  tooManyRequests: "Too many attempts. Kindly wait a few minutes and try again.",
  emailTaken: "An account with this email already exists. Try signing in.",
  noBusinessAccess: "You do not have access to this business.",
  crossSite: "This request did not come from this site.",
} as const;

export function normaliseAccountEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

export function validateAccountPassword(password: string): string | null {
  if (password.length < ACCOUNT_PASSWORD_MIN_LENGTH) return `Use at least ${ACCOUNT_PASSWORD_MIN_LENGTH} characters.`;
  if (password.length > ACCOUNT_PASSWORD_MAX_LENGTH) return `Use no more than ${ACCOUNT_PASSWORD_MAX_LENGTH} characters.`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Use at least one letter and one number.";
  return null;
}

/**
 * Accepting an onboarding invitation. Accounts are never created without a valid invitation token: there is no
 * public self-registration. `email` is read-only in the form and must equal the invitation's address.
 */
export const onboardingAcceptInputSchema = z
  .object({
    token: z.string().min(20).max(200),
    fullName: z.string().trim().min(2, "Enter your full name.").max(ACCOUNT_FULL_NAME_MAX_LENGTH),
    email: z.string().trim().email("Enter a valid email address.").max(ACCOUNT_EMAIL_MAX_LENGTH).transform(normaliseAccountEmail),
    password: z.string().max(ACCOUNT_PASSWORD_MAX_LENGTH + 1),
    confirmPassword: z.string().max(ACCOUNT_PASSWORD_MAX_LENGTH + 1),
    businessName: z.string().trim().min(2, "Enter your business name.").max(BUSINESS_NAME_MAX_LENGTH),
  })
  .superRefine((value, context) => {
    const policy = validateAccountPassword(value.password);
    if (policy) context.addIssue({ code: "custom", path: ["password"], message: policy });
    if (value.password !== value.confirmPassword) {
      context.addIssue({ code: "custom", path: ["confirmPassword"], message: "The password confirmation does not match." });
    }
  });
export type OnboardingAcceptInput = z.input<typeof onboardingAcceptInputSchema>;

export const ONBOARDING_INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const ONBOARDING_ERRORS = {
  unavailable: "This invitation is unavailable. It may have expired or already been used. Ask the IPF team for a new link.",
  emailMismatch: "The email does not match this invitation.",
  existingAccount: "An account already exists for this email address. The IPF team will help you sign in.",
  existingAccountAdmin: "This email already belongs to an account. Linking an existing account to a new business is not available yet.",
  noCheck: "That business check does not exist.",
  invalidCheckEmail: "The business check does not have a valid email address to invite.",
} as const;

export const signInInputSchema = z.object({
  email: z.string().trim().max(ACCOUNT_EMAIL_MAX_LENGTH).transform(normaliseAccountEmail),
  // No policy check on sign-in: a wrong or short password must fail like any other wrong password.
  password: z.string().min(1).max(ACCOUNT_PASSWORD_MAX_LENGTH + 1),
});

/** What the client may see. Never includes credentials, session tokens or hashes. */
export type AccountMembership = {
  businessId: number;
  businessName: string;
  role: import("./businessMemberships").BusinessMembershipRole;
  /** False until the owner has filled in the business profile (completed after signup, never required at signup). */
  profileComplete: boolean;
};
export type AccountSessionView = {
  user: { id: number; fullName: string; email: string };
  memberships: AccountMembership[];
  /** The business the user is acting inside. With exactly one membership it is chosen automatically. */
  activeBusiness: AccountMembership | null;
};
