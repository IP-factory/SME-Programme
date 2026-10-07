/**
 * Business membership vocabulary. A membership answers "which business may this person act inside, and in what
 * capacity?". It is separate from authentication (who the person is) and from internal platform roles
 * (see PLATFORM_ROLES in shared/auth.ts).
 *
 * "owner", never "founder": founder readiness already has a distinct meaning in the business diagnostic.
 */
export const BUSINESS_MEMBERSHIP_ROLES = ["owner", "business_admin", "member"] as const;
export type BusinessMembershipRole = (typeof BUSINESS_MEMBERSHIP_ROLES)[number];

/** "invited" is reserved for the invitation flow (a later phase); only "active" memberships grant access. */
export const BUSINESS_MEMBERSHIP_STATUSES = ["active", "invited", "suspended", "removed"] as const;
export type BusinessMembershipStatus = (typeof BUSINESS_MEMBERSHIP_STATUSES)[number];

export const BUSINESS_STATUSES = ["active", "suspended", "archived"] as const;
export type BusinessStatus = (typeof BUSINESS_STATUSES)[number];

export const BUSINESS_NAME_MAX_LENGTH = 255;

/** Profile fields completed after signup. Signup itself asks only for the business name. */
export const BUSINESS_PROFILE_FIELDS = ["description", "sector", "country"] as const;

export function isBusinessProfileComplete(business: Partial<Record<(typeof BUSINESS_PROFILE_FIELDS)[number], string | null>>) {
  return BUSINESS_PROFILE_FIELDS.every(field => Boolean(business[field]?.trim()));
}
