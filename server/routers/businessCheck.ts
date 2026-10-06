import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { businessChecks } from "../../drizzle/schema";
import { BRAND } from "../../shared/brand";
import { cleanAnswers, evaluate, isComplete } from "../../shared/businessCheck/engine";
import { stageOf } from "../../shared/businessCheck/questions";
import { officeEmail, ownerEmail, summariseCheck, type CheckSummary } from "../businessCheck";
import { getDb } from "../db";
import { deliverEmail, JUMP_ADMINISTRATION_MAILBOX } from "../email";
import { publicProcedure, router } from "../_core/trpc";

const WINDOW_MS = 15 * 60 * 1000;
const MAXIMUM_PER_WINDOW = 5;
const recentSubmissions = new Map<string, { count: number; resetAt: number }>();

function consumeRateLimit(email: string, ip: string) {
  const key = `${ip.trim().toLowerCase()}:${email.trim().toLowerCase()}`;
  const now = Date.now();
  const existing = recentSubmissions.get(key);
  if (!existing || existing.resetAt <= now) {
    recentSubmissions.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (existing.count >= MAXIMUM_PER_WINDOW) return false;
  existing.count += 1;
  return true;
}

const answerValue = z.union([z.string().max(64), z.array(z.string().max(64)).max(10)]);

export const businessCheckInput = z.object({
  contact: z.object({
    fullName: z.string().trim().min(2).max(255),
    email: z.string().trim().email().max(320),
    whatsapp: z.string().trim().max(32).optional(),
    businessName: z.string().trim().max(255).optional(),
    description: z.string().trim().max(500).optional(),
  }),
  answers: z.record(z.string().max(32), answerValue.optional()).refine((value) => Object.keys(value).length <= 80),
});

export type BusinessCheckResponse = {
  token: string;
  result: ReturnType<typeof evaluate>;
  summary: CheckSummary;
  summarySource: "AI" | "Rules";
  discoveryCallUrl: string;
};

export const businessCheckRouter = router({
  submit: publicProcedure.input(businessCheckInput).mutation(async ({ input, ctx }): Promise<BusinessCheckResponse> => {
    if (!consumeRateLimit(input.contact.email, ctx.req.ip || "unknown")) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Kindly wait a few minutes before sending another business check." });
    }
    const answers = cleanAnswers(input.answers);
    if (!isComplete(answers)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Some questions are still unanswered. Kindly go back and complete them." });
    }
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "We could not record your business check just now. Kindly try again shortly." });

    const result = evaluate(answers);
    const { summary, source } = await summariseCheck({ answers, result, contact: input.contact });

    const office = officeEmail({ contact: input.contact, answers, summary, source, result });
    const owner = ownerEmail({ contact: input.contact, summary, result });
    const [officeDelivery] = await Promise.all([
      deliverEmail({ to: JUMP_ADMINISTRATION_MAILBOX, subject: office.subject, body: office.body }),
      deliverEmail({ to: input.contact.email, subject: owner.subject, body: owner.body }),
    ]);

    const token = randomBytes(24).toString("base64url");
    await db.insert(businessChecks).values({
      publicToken: token,
      fullName: input.contact.fullName,
      email: input.contact.email,
      whatsapp: input.contact.whatsapp || null,
      businessName: input.contact.businessName || null,
      description: input.contact.description || null,
      stage: stageOf(answers) ?? "unknown",
      route: result.route,
      readiness: result.founder.level,
      primaryArea: result.primaryArea?.area ?? null,
      answersJson: JSON.stringify(answers),
      resultJson: JSON.stringify(result),
      summaryJson: JSON.stringify(summary),
      summarySource: source,
      notificationStatus: officeDelivery.status === "Failed" ? "Failed" : officeDelivery.status === "Simulated" ? "Simulated" : "Sent",
    });

    return { token, result, summary, summarySource: source, discoveryCallUrl: BRAND.discoveryCallUrl };
  }),

  /** The owner asks for the free call or the paid full report from the result screen. */
  requestNext: publicProcedure
    .input(z.object({ token: z.string().min(16).max(64), choice: z.enum(["call", "report"]), note: z.string().trim().max(500).optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "We could not record your request just now. Kindly try again shortly." });
      const [check] = await db.select().from(businessChecks).where(eq(businessChecks.publicToken, input.token)).limit(1);
      if (!check) throw new TRPCError({ code: "NOT_FOUND", message: "We could not find that business check." });

      const already = input.choice === "call" ? check.callRequestedAt : check.reportRequestedAt;
      if (!already) {
        await db.update(businessChecks)
          .set(input.choice === "call" ? { callRequestedAt: new Date() } : { reportRequestedAt: new Date() })
          .where(eq(businessChecks.id, check.id));
        const what = input.choice === "call" ? "a free discovery call" : "the full business check report";
        await deliverEmail({
          to: JUMP_ADMINISTRATION_MAILBOX,
          subject: `Business check: ${check.businessName || check.fullName} asked for ${what}`,
          body: [
            `${check.fullName} asked for ${what}.`,
            "",
            `Email: ${check.email}`,
            `WhatsApp: ${check.whatsapp || "Not given"}`,
            `Business: ${check.businessName || "Not given"}`,
            `Note: ${input.note || "None"}`,
            "",
            `Business check #${check.id}, completed ${check.createdAt.toISOString()}.`,
          ].join("\n"),
        });
      }
      return { success: true, choice: input.choice };
    }),
});
