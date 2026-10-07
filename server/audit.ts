import { adminAccessAuditEvents } from "../drizzle/schema";
import type { Database } from "./accountAuth";

export const AUDIT_ACTIONS = [
  "account_signed_in",
  "account_signed_out",
  "account_sign_in_failed",
  "account_sign_in_locked",
  "admin_sign_in_refused",
  "owner_credential_bootstrapped",
  "owner_credential_reset",
  "workspace_switched",
  "business_profile_updated",
  "account_profile_updated",
  "account_password_changed",
  "platform_role_granted",
  "platform_role_revoked",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/**
 * Appends to the existing administrative audit log (`admin_access_audit_events`). Details are small, structured and
 * never contain passwords, tokens, hashes or invitation links: callers pass identifiers and field names only.
 */
export async function recordAudit(
  db: Pick<Database, "insert">,
  event: { action: AuditAction | (string & {}); actorUserId?: number | null; targetEmail?: string | null; details?: Record<string, unknown> },
) {
  await db.insert(adminAccessAuditEvents).values({
    actorUserId: event.actorUserId ?? null,
    action: event.action,
    targetEmail: event.targetEmail ? event.targetEmail.slice(0, 320) : null,
    details: event.details ? JSON.stringify(event.details) : null,
  });
}
