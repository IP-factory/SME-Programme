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

/**
 * Profile completion is derived from what is filled in, never stored. `logoUrl` joins the list once logo upload exists
 * (storage is still the legacy Manus proxy, so upload is deferred); until then it is not required.
 */
export const BUSINESS_PROFILE_COMPLETION_FIELDS = ["name", "description", "yearFounded", "sector", "website"] as const;
export type BusinessProfileField = (typeof BUSINESS_PROFILE_COMPLETION_FIELDS)[number];

type ProfileValues = Partial<Record<BusinessProfileField, string | number | null | undefined>>;

const isFilled = (value: string | number | null | undefined) => (typeof value === "number" ? Number.isFinite(value) : Boolean(value?.toString().trim()));

export function businessProfileCompletion(business: ProfileValues) {
  const missing = BUSINESS_PROFILE_COMPLETION_FIELDS.filter(field => !isFilled(business[field]));
  const filled = BUSINESS_PROFILE_COMPLETION_FIELDS.length - missing.length;
  return { percent: Math.round((filled / BUSINESS_PROFILE_COMPLETION_FIELDS.length) * 100), missing, complete: missing.length === 0 };
}

export function isBusinessProfileComplete(business: ProfileValues) {
  return businessProfileCompletion(business).complete;
}
