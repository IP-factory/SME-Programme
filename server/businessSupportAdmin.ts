import { desc, eq, isNotNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { businessChecks, businessMemberships, businesses, users } from "../drizzle/schema";
import { advancePipeline, type PipelineStage } from "../shared/businessCheck/pipeline";
import type { CheckResult } from "../shared/businessCheck/engine";
import type { Database } from "./accountAuth";
import { recordAudit } from "./audit";
import type { CheckSummary } from "./businessCheck";
import { latestInvitationStatuses } from "./clientOnboarding";
import { getDb } from "./db";

async function requireDatabase() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  return db;
}

/** What the team sees of a business check. The answers and the result JSON stay out of lists. */
const CHECK_COLUMNS = {
  id: businessChecks.id,
  fullName: businessChecks.fullName,
  businessName: businessChecks.businessName,
  email: businessChecks.email,
  whatsapp: businessChecks.whatsapp,
  stage: businessChecks.stage,
  route: businessChecks.route,
  readiness: businessChecks.readiness,
  primaryArea: businessChecks.primaryArea,
  pipelineStage: businessChecks.pipelineStage,
  callRequestedAt: businessChecks.callRequestedAt,
  callScheduledFor: businessChecks.callScheduledFor,
  reportRequestedAt: businessChecks.reportRequestedAt,
  completedAt: businessChecks.completedAt,
  createdAt: businessChecks.createdAt,
} as const;

/** Every business check: leads who only left their details, and finished checks. These are prospects, not clients. */
export async function listBusinessChecks(db: Pick<Database, "select">) {
  const [rows, invitations] = await Promise.all([
    db.select(CHECK_COLUMNS).from(businessChecks).orderBy(desc(businessChecks.createdAt)).limit(500),
    latestInvitationStatuses(db),
  ]);
  return rows.map(row => ({ ...row, invitationStatus: invitations.get(row.id) ?? null }));
}

/** Business checks whose owner asked for the free discovery call, newest request first. */
export async function listDiscoveryCalls(db: Pick<Database, "select">) {
  const [rows, invitations] = await Promise.all([
    db.select(CHECK_COLUMNS).from(businessChecks).where(isNotNull(businessChecks.callRequestedAt)).orderBy(desc(businessChecks.callRequestedAt)).limit(500),
    latestInvitationStatuses(db),
  ]);
  return rows.map(row => ({ ...row, invitationStatus: invitations.get(row.id) ?? null }));
}

const parseJson = <T>(text: string | null): T | null => {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
};

/**
 * One business check in full, for the record drawer: the saved result and summary exactly as they were stored when the
 * owner finished the check. Nothing is recomputed and the owner's raw answers are not returned.
 */
export async function getBusinessCheckDetail(db: Pick<Database, "select">, businessCheckId: number) {
  const row = (await db.select({
    ...CHECK_COLUMNS,
    heardFrom: businessChecks.heardFrom,
    resultJson: businessChecks.resultJson,
    summaryJson: businessChecks.summaryJson,
  }).from(businessChecks).where(eq(businessChecks.id, businessCheckId)).limit(1))[0];
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "That business check does not exist." });
  const { resultJson, summaryJson, ...fields } = row;
  const result = parseJson<Pick<CheckResult, "outline" | "primaryArea" | "founder">>(resultJson);
  const summary = parseJson<CheckSummary>(summaryJson);
  const invitations = await latestInvitationStatuses(db);
  return {
    ...fields,
    invitationStatus: invitations.get(row.id) ?? null,
    summary: summary ? { found: summary.found, think: summary.think, next: summary.next, offerings: summary.offerings ?? [] } : null,
    outline: result?.outline ?? null,
    primaryAreaNumber: result?.primaryArea?.area ?? row.primaryArea ?? null,
  };
}

async function requestedCheck(db: Pick<Database, "select">, businessCheckId: number) {
  const check = (await db.select({ id: businessChecks.id, email: businessChecks.email, pipelineStage: businessChecks.pipelineStage, callRequestedAt: businessChecks.callRequestedAt }).from(businessChecks).where(eq(businessChecks.id, businessCheckId)).limit(1))[0];
  if (!check) throw new TRPCError({ code: "NOT_FOUND", message: "That business check does not exist." });
  if (!check.callRequestedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "This business check has not asked for a discovery call." });
  // A paid client's record is not reopened from the call list.
  if (check.pipelineStage === "won") throw new TRPCError({ code: "CONFLICT", message: "This business has already been won, so its call outcome can no longer be changed here." });
  return check;
}

/** Records the time agreed for the call. The owner's request is kept as it was; the stage moves to "call booked" if it was behind. */
export async function scheduleDiscoveryCall(db: Database, input: { businessCheckId: number; scheduledFor: Date; actorUserId: number }) {
  const check = await requestedCheck(db, input.businessCheckId);
  await db.transaction(async tx => {
    await tx.update(businessChecks).set({ callScheduledFor: input.scheduledFor, pipelineStage: advancePipeline(check.pipelineStage, "call_booked") }).where(eq(businessChecks.id, check.id));
    await recordAudit(tx, { action: "business_check_call_scheduled", actorUserId: input.actorUserId, targetEmail: check.email, details: { businessCheckId: check.id, scheduledFor: input.scheduledFor.toISOString() } });
  });
  return { success: true } as const;
}

export const CALL_OUTCOMES = ["fit", "refer", "decline"] as const;
export type CallOutcome = (typeof CALL_OUTCOMES)[number];

/** The existing pipeline stages already say what each outcome means (see PIPELINE_LABELS): no new status field. */
export const OUTCOME_STAGE: Record<CallOutcome, PipelineStage> = { fit: "opportunity", refer: "referred", decline: "lost" };

/** Records the result of the discovery call. Fit does not create an account: onboarding is a separate, deliberate step. */
export async function recordDiscoveryCallOutcome(db: Database, input: { businessCheckId: number; outcome: CallOutcome; actorUserId: number }) {
  const check = await requestedCheck(db, input.businessCheckId);
  const stage = OUTCOME_STAGE[input.outcome];
  await db.transaction(async tx => {
    await tx.update(businessChecks).set({ pipelineStage: stage }).where(eq(businessChecks.id, check.id));
    await recordAudit(tx, { action: "business_check_call_outcome", actorUserId: input.actorUserId, targetEmail: check.email, details: { businessCheckId: check.id, outcome: input.outcome, from: check.pipelineStage, to: stage } });
  });
  return { success: true, pipelineStage: stage } as const;
}

/** Onboarded clients only: one row per active-or-not membership, never a business check. */
export async function listClients(db: Pick<Database, "select">) {
  return db
    .select({
      membershipId: businessMemberships.id,
      businessId: businesses.id,
      businessName: businesses.name,
      businessStatus: businesses.status,
      userId: users.id,
      userName: users.name,
      email: users.email,
      role: businessMemberships.role,
      membershipStatus: businessMemberships.status,
      joinedAt: businessMemberships.createdAt,
      businessCreatedAt: businesses.createdAt,
    })
    .from(businessMemberships)
    .innerJoin(businesses, eq(businessMemberships.businessId, businesses.id))
    .innerJoin(users, eq(businessMemberships.userId, users.id))
    .orderBy(desc(businesses.createdAt), businessMemberships.id)
    .limit(500);
}

export async function businessSupportDb() {
  return requireDatabase();
}

