import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core/alias";
import { nanoid } from "nanoid";
import { participantReferralProfiles, participantReferrals, registrations } from "../../drizzle/schema";
import { REFERRAL_CREDIT_PERCENTAGE, REFERRAL_MAX_APPROVED_CREDITS, REFERRAL_POLICY_SUMMARY, referralCreditIsAvailable, referralIsEligibleForQualification } from "../../shared/referrals";
import { ownerAdminProcedure, participantProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { z } from "zod";

function shareOrigin(req: { headers: Record<string, string | string[] | undefined> }) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const proto = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) || "https";
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) || req.headers.host || "emmanueltarfa.com";
  return `${proto}://${host}`;
}

export const referralsRouter = router({
  share: participantProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const registrationId = ctx.participant.id;
    let profile = (await db.select().from(participantReferralProfiles)
      .where(eq(participantReferralProfiles.registrationId, registrationId)).limit(1))[0];
    if (!profile) {
      const referralCode = `j${nanoid(20)}`;
      try {
        await db.insert(participantReferralProfiles).values({ registrationId, referralCode });
      } catch {
        // A concurrent portal request may already have created the one-per-participant profile.
      }
      profile = (await db.select().from(participantReferralProfiles)
        .where(eq(participantReferralProfiles.registrationId, registrationId)).limit(1))[0];
    }
    if (!profile) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not prepare your share link." });
    const referrals = await db.select().from(participantReferrals)
      .where(eq(participantReferrals.referrerRegistrationId, registrationId)).orderBy(desc(participantReferrals.createdAt));
    const approvedCount = referrals.filter((referral) => referral.status === "Approved").length;
    return {
      shareUrl: `${shareOrigin(ctx.req)}/?ref=${encodeURIComponent(profile.referralCode)}`,
      policySummary: REFERRAL_POLICY_SUMMARY,
      approvedCount,
      availableCreditSlots: Math.max(0, REFERRAL_MAX_APPROVED_CREDITS - approvedCount),
      referrals: referrals.map((referral) => ({ id: referral.id, status: referral.status, creditPercentage: referral.creditPercentage, createdAt: referral.createdAt })),
    };
  }),

  listForOwner: ownerAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const referrer = alias(registrations, "referrer_registration");
    const referred = alias(registrations, "referred_registration");
    return db.select({
      id: participantReferrals.id,
      status: participantReferrals.status,
      creditPercentage: participantReferrals.creditPercentage,
      createdAt: participantReferrals.createdAt,
      notes: participantReferrals.notes,
      referrerRegistrationId: participantReferrals.referrerRegistrationId,
      referredRegistrationId: participantReferrals.referredRegistrationId,
      referrerName: referrer.fullName,
      referrerBusiness: referrer.businessName,
      referredName: referred.fullName,
      referredBusiness: referred.businessName,
      referredPackage: referred.package,
      referredStatus: referred.status,
      referredDepositPaid: referred.depositPaid,
    }).from(participantReferrals)
      .innerJoin(referrer, eq(participantReferrals.referrerRegistrationId, referrer.id))
      .innerJoin(referred, eq(participantReferrals.referredRegistrationId, referred.id))
      .orderBy(desc(participantReferrals.createdAt));
  }),

  review: ownerAdminProcedure
    .input(z.object({ id: z.number().int().positive(), decision: z.enum(["Qualified", "Approved", "Declined"]), notes: z.string().trim().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const referral = (await db.select().from(participantReferrals).where(eq(participantReferrals.id, input.id)).limit(1))[0];
      if (!referral) throw new TRPCError({ code: "NOT_FOUND", message: "Referral record not found." });
      const referredRegistration = (await db.select().from(registrations).where(eq(registrations.id, referral.referredRegistrationId)).limit(1))[0];
      if (!referredRegistration) throw new TRPCError({ code: "NOT_FOUND", message: "Referred participant record not found." });
      const isEligible = referralIsEligibleForQualification(referredRegistration.status, referredRegistration.depositPaid);
      if ((input.decision === "Qualified" || input.decision === "Approved") && !isEligible) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A referral can qualify only after the referred business is Accepted and its first commitment payment is marked Paid." });
      }
      if (input.decision === "Approved") {
        if (referral.status !== "Qualified") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Mark the referral Qualified before approving a credit." });
        const countRow = (await db.select({ count: sql<number>`count(*)` }).from(participantReferrals)
          .where(and(eq(participantReferrals.referrerRegistrationId, referral.referrerRegistrationId), eq(participantReferrals.status, "Approved"))))[0];
        if (!referralCreditIsAvailable(Number(countRow?.count ?? 0))) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: `The referrer has reached the maximum of ${REFERRAL_MAX_APPROVED_CREDITS} approved referral credits.` });
        }
      }
      await db.update(participantReferrals).set({
        status: input.decision,
        creditPercentage: input.decision === "Approved" ? REFERRAL_CREDIT_PERCENTAGE : 0,
        reviewedByUserId: ctx.user.id,
        reviewedAt: new Date(),
        notes: input.notes || null,
      }).where(eq(participantReferrals.id, referral.id));
      return { success: true, decision: input.decision, creditPercentage: input.decision === "Approved" ? REFERRAL_CREDIT_PERCENTAGE : 0 };
    }),
});
