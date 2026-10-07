import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { adminPermissionProfiles, userPlatformRoles, users } from "../drizzle/schema";
import { parseAdminPermissions } from "../shared/adminPermissions";
import type { PlatformRole } from "../shared/auth";
import { authorityAllows, resolveAuthority, type AnyAuthorityPermission, type Authority } from "../shared/platformPermissions";
import { isOwnerAdmin, normalizeAdminEmail, OWNER_ADMIN_EMAIL } from "./adminSecurity";
import type { Database } from "./accountAuth";
import { recordAudit } from "./audit";
import { isUniqueViolation } from "./accountAuth";
import { emailEquals } from "./dbHelpers";

type Person = { id: number; role: "user" | "admin"; email: string | null; status: "active" | "suspended" | "disabled" };

export const NO_AUTHORITY: Authority = { roles: [], permissions: [], legacyCapabilities: [], isSuperAdmin: false };

/**
 * The single place that turns a person into authority. Both the legacy administrator channel (OAuth + administrator
 * password) and the account channel (email/password session) call this, so one person always gets one answer.
 */
export async function loadAuthority(db: Pick<Database, "select">, person: Person): Promise<Authority> {
  const [stored, profile] = await Promise.all([
    db.select({ role: userPlatformRoles.role }).from(userPlatformRoles).where(eq(userPlatformRoles.userId, person.id)),
    db.select({ permissionsJson: adminPermissionProfiles.permissionsJson }).from(adminPermissionProfiles).where(eq(adminPermissionProfiles.userId, person.id)).limit(1),
  ]);
  return resolveAuthority({
    storedRoles: stored.map(row => row.role),
    legacyAdmin: person.role === "admin",
    ownerBridge: isOwnerAdmin({ email: person.email }),
    legacyProfile: parseAdminPermissions(profile[0]?.permissionsJson),
    active: person.status === "active",
  });
}

export async function requireAuthority(db: Pick<Database, "select">, person: Person, permission: AnyAuthorityPermission) {
  const authority = await loadAuthority(db, person);
  if (!authorityAllows(authority, permission)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Your role does not include this responsibility." });
  }
  return authority;
}

/** Active people who are Super Admin today: a stored `super_admin` role, or the owner-email bridge. */
export async function listSuperAdminIds(db: Pick<Database, "select">): Promise<Set<number>> {
  const stored = await db
    .select({ id: users.id })
    .from(userPlatformRoles)
    .innerJoin(users, eq(userPlatformRoles.userId, users.id))
    .where(and(eq(userPlatformRoles.role, "super_admin"), eq(users.status, "active")));
  const bridge = OWNER_ADMIN_EMAIL
    ? await db.select({ id: users.id }).from(users).where(and(emailEquals(users.email, normalizeAdminEmail(OWNER_ADMIN_EMAIL)), eq(users.status, "active")))
    : [];
  return new Set([...stored, ...bridge].map(row => row.id));
}

/**
 * Grants a platform role. Safeguards (the caller has already been checked for the `manage_roles` responsibility):
 *  - only a Super Admin may grant Super Admin;
 *  - nobody but a Super Admin may change their own roles (no self-escalation);
 *  - a business role grants nothing here: only an existing, active person can be given a platform role.
 */
export async function grantPlatformRole(db: Database, input: { actor: Person & { authority: Authority }; targetUserId: number; role: PlatformRole }) {
  const { actor, targetUserId, role } = input;
  if (role === "super_admin" && !actor.authority.isSuperAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only a Super Admin can grant Super Admin." });
  }
  if (targetUserId === actor.id && !actor.authority.isSuperAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You cannot change your own roles." });
  }
  const target = (await db.select({ id: users.id, email: users.email, status: users.status }).from(users).where(eq(users.id, targetUserId)).limit(1))[0];
  if (!target || target.status !== "active") throw new TRPCError({ code: "NOT_FOUND", message: "That person does not exist or is not active." });
  try {
    await db.transaction(async tx => {
      await tx.insert(userPlatformRoles).values({ userId: target.id, role, grantedByUserId: actor.id });
      await recordAudit(tx, { action: "platform_role_granted", actorUserId: actor.id, targetEmail: target.email, details: { targetUserId: target.id, role } });
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new TRPCError({ code: "CONFLICT", message: "That person already holds this role." });
    throw error;
  }
  return { success: true } as const;
}

/**
 * Revokes a stored platform role. The last Super Admin can never be removed: the removal is refused if nobody else
 * (and not the permanent owner bridge) would remain. The owner-email Super Admin cannot be revoked through roles at all.
 */
export async function revokePlatformRole(db: Database, input: { actor: Person & { authority: Authority }; targetUserId: number; role: PlatformRole }) {
  const { actor, targetUserId, role } = input;
  if (role === "super_admin" && !actor.authority.isSuperAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only a Super Admin can revoke Super Admin." });
  }
  if (targetUserId === actor.id && !actor.authority.isSuperAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You cannot change your own roles." });
  }
  const target = (await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, targetUserId)).limit(1))[0];
  const assignment = target
    ? (await db.select({ id: userPlatformRoles.id }).from(userPlatformRoles).where(and(eq(userPlatformRoles.userId, targetUserId), eq(userPlatformRoles.role, role))).limit(1))[0]
    : undefined;
  if (!target || !assignment) throw new TRPCError({ code: "NOT_FOUND", message: "That person does not hold this role." });

  if (role === "super_admin") {
    const before = await listSuperAdminIds(db);
    const stillSuper = isOwnerAdmin({ email: target.email });
    if (stillSuper) throw new TRPCError({ code: "CONFLICT", message: "The permanent Super Admin cannot be removed." });
    if (before.has(target.id) && before.size <= 1) throw new TRPCError({ code: "CONFLICT", message: "This is the last Super Admin and cannot be removed." });
  }
  await db.transaction(async tx => {
    await tx.delete(userPlatformRoles).where(eq(userPlatformRoles.id, assignment.id));
    await recordAudit(tx, { action: "platform_role_revoked", actorUserId: actor.id, targetEmail: target.email, details: { targetUserId: target.id, role } });
  });
  return { success: true } as const;
}

export async function listPlatformRoleAssignments(db: Pick<Database, "select">) {
  const rows = await db
    .select({ id: userPlatformRoles.id, userId: users.id, name: users.name, email: users.email, status: users.status, role: userPlatformRoles.role, createdAt: userPlatformRoles.createdAt })
    .from(userPlatformRoles)
    .innerJoin(users, eq(userPlatformRoles.userId, users.id))
    .orderBy(users.id, userPlatformRoles.id);
  return rows;
}

