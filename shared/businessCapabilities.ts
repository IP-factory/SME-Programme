import type { BusinessMembershipRole } from "./businessMemberships";

/**
 * What a membership role may do INSIDE a business. Central, so routers never compare raw roles. Business roles are
 * unrelated to platform roles: owning a business grants nothing inside IPF, and an IPF role grants nothing inside
 * a client's business.
 */
export const BUSINESS_CAPABILITIES = [
  "view_business",
  "view_business_dashboard",
  "edit_business_profile",
  "manage_business_members",
  "invite_team_members",
  "manage_billing",
] as const;
export type BusinessCapability = (typeof BUSINESS_CAPABILITIES)[number];

export const BUSINESS_ROLE_CAPABILITIES: Record<BusinessMembershipRole, readonly BusinessCapability[]> = {
  owner: BUSINESS_CAPABILITIES,
  business_admin: ["view_business", "view_business_dashboard", "edit_business_profile", "manage_business_members"],
  member: ["view_business", "view_business_dashboard"],
};

export function businessRoleCan(role: BusinessMembershipRole, capability: BusinessCapability): boolean {
  return BUSINESS_ROLE_CAPABILITIES[role].includes(capability);
}
export const canViewBusiness = (role: BusinessMembershipRole) => businessRoleCan(role, "view_business");
export const canEditBusiness = (role: BusinessMembershipRole) => businessRoleCan(role, "edit_business_profile");
export const canManageBusinessMembers = (role: BusinessMembershipRole) => businessRoleCan(role, "manage_business_members");

export const BUSINESS_ROLE_LABELS: Record<BusinessMembershipRole, string> = { owner: "Owner", business_admin: "Business admin", member: "Member" };
