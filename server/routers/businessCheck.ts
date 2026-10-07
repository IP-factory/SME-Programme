import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { businessChecks, type BusinessCheck } from "../../drizzle/schema";
import { BRAND } from "../../shared/brand";
import { businessDetails, cleanAnswers, evaluate, isComplete } from "../../shared/businessCheck/engine";
import { advancePipeline } from "../../shared/businessCheck/pipeline";
import { stageOf, type Answers } from "../../shared/businessCheck/questions";
import { officeEmail, ownerEmail, summariseCheck, type CheckContact, type CheckSummary } from "../businessCheck";
import { getDb } from "../db";
import { databaseNow } from "../dbHelpers";
import { deliverEmail, JUMP_ADMINISTRATION_MAILBOX } from "../email";
import { publicProcedure, router } from "../_core/trpc";

const WINDOW_MS = 15 * 60 * 1000;

const limiters: Array<{ clear: () => void }> = [];

/** Fixed-window counters, per key. Starting a check is rare; saving progress happens on every answer. */
function rateLimiter(maximum: number) {
  const counts = new Map<string, { count: number; resetAt: number }>();
  limiters.push({ clear: () => counts.clear() });
  return (key: string) => {
    const now = Date.now();
    const existing = counts.get(key);
    if (!existing || existing.resetAt <= now) {
      counts.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return true;
    }
    if (existing.count >= maximum) return false;
    existing.count += 1;
    return true;
  };
}

const allowStart = rateLimiter(5);
/** Caps new checks from one address whatever email is typed, so the table cannot be flooded with leads. */
const allowStartFromIp = rateLimiter(20);
const allowSave = rateLimiter(300);

/**
 * Clears every limiter's counters. Tests only: the limiters live at module level, so tests that share a process
 * (and an address) would otherwise spend one another's allowance. Never call this from application code.
 */
export function resetBusinessCheckRateLimitsForTests() {
  for (const limiter of limiters) limiter.clear();
}

const answerValue = z.union([z.string().max(300), z.array(z.string().max(64)).max(10)]);
const answersInput = z.record(z.string().max(32), answerValue.optional()).refine((value) => Object.keys(value).length <= 80);
const tokenInput = z.string().min(16).max(64);

/** The first screen: who the owner is. Everything about the business is asked inside the check. */
export const businessCheckStartInput = z.object({
  fullName: z.string().trim().min(2).max(255),
  email: z.string().trim().email().max(320),
  whatsapp: z.string().trim().max(32).optional(),
  heardFrom: z.string().trim().max(64).optional(),
});

export type BusinessCheckResponse = {
  token: string;
  result: ReturnType<typeof evaluate>;
  summary: CheckSummary;
  summarySource: "AI" | "Rules";
  discoveryCallUrl: string;
};

const unavailable = (what: string) => new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `We could not ${what} just now. Kindly try again shortly.` });

async function database(what: string) {
  const db = await getDb();
  if (!db) throw unavailable(what);
  return db;
}

async function findCheck(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, token: string) {
  const [check] = await db.select().from(businessChecks).where(eq(businessChecks.publicToken, token)).limit(1);
  if (!check) throw new TRPCError({ code: "NOT_FOUND", message: "We could not find that business check. Kindly start again." });
  return check;
}

/** Columns that follow from the answers so far: the stage and the business details typed in the check. */
function answerColumns(answers: Answers) {
  const { businessName, description } = businessDetails(answers);
  return { answersJson: JSON.stringify(answers), stage: stageOf(answers) ?? "unknown", businessName: businessName || null, description: description || null };
}

function contactOf(check: BusinessCheck, answers: Answers): CheckContact {
  const { businessName, description } = businessDetails(answers);
  return { fullName: check.fullName, email: check.email, whatsapp: check.whatsapp || undefined, heardFrom: check.heardFrom || undefined, businessName: businessName || undefined, description: description || undefined };
}

export const businessCheckRouter = router({
  /** The details screen: records the owner as a lead before the first question. */
  start: publicProcedure.input(businessCheckStartInput).mutation(async ({ input, ctx }) => {
    const ip = (ctx.req.ip || "unknown").toLowerCase();
    if (!allowStartFromIp(ip) || !allowStart(`${ip}:${input.email.toLowerCase()}`)) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Kindly wait a few minutes before starting another business check." });
    }
    const db = await database("start your business check");
    const token = randomBytes(24).toString("base64url");
    await db.insert(businessChecks).values({
      publicToken: token,
      pipelineStage: "lead",
      fullName: input.fullName,
      email: input.email,
      whatsapp: input.whatsapp || null,
      heardFrom: input.heardFrom || null,
      stage: "unknown",
      answersJson: "{}",
    });
    return { token };
  }),

  /** Saves answers as the owner goes, so an unfinished check still tells the team where they were. */
  saveProgress: publicProcedure.input(z.object({ token: tokenInput, answers: answersInput })).mutation(async ({ input }) => {
    if (!allowSave(input.token)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many updates. Your answers are still kept on this device." });
    const db = await database("save your progress");
    const check = await findCheck(db, input.token);
    // A finished check is final; later edits on the device do not change what was submitted.
    if (check.completedAt) return { saved: false };
    await db.update(businessChecks).set(answerColumns(cleanAnswers(input.answers))).where(eq(businessChecks.id, check.id));
    return { saved: true };
  }),

  /** Finishes the check: works out the result on the server, writes the summary and emails both sides once. */
  submit: publicProcedure.input(z.object({ token: tokenInput, answers: answersInput })).mutation(async ({ input }): Promise<BusinessCheckResponse> => {
    const db = await database("record your business check");
    const check = await findCheck(db, input.token);
    if (check.completedAt && check.resultJson && check.summaryJson && check.summarySource) {
      // Already submitted (a double click or a retry): return what was recorded, without emailing again.
      return { token: check.publicToken, result: JSON.parse(check.resultJson), summary: JSON.parse(check.summaryJson), summarySource: check.summarySource, discoveryCallUrl: BRAND.discoveryCallUrl };
    }
    const answers = cleanAnswers(input.answers);
    if (!isComplete(answers)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Some questions are still unanswered. Kindly go back and complete them." });
    }

    const result = evaluate(answers);
    const contact = contactOf(check, answers);
    const { summary, source } = await summariseCheck({ answers, result, contact });

    const office = officeEmail({ contact, answers, summary, source, result });
    const owner = ownerEmail({ contact, summary, result });
    const [officeDelivery] = await Promise.all([
      deliverEmail({ to: JUMP_ADMINISTRATION_MAILBOX, subject: office.subject, body: office.body }),
      deliverEmail({ to: check.email, subject: owner.subject, body: owner.body }),
    ]);

    await db.update(businessChecks).set({
      ...answerColumns(answers),
      pipelineStage: advancePipeline(check.pipelineStage, "qualified_lead"),
      route: result.route,
      readiness: result.founder.level,
      primaryArea: result.primaryArea?.area ?? null,
      resultJson: JSON.stringify(result),
      summaryJson: JSON.stringify(summary),
      summarySource: source,
      notificationStatus: officeDelivery.status === "Failed" ? "Failed" : officeDelivery.status === "Simulated" ? "Simulated" : "Sent",
      completedAt: databaseNow(),
    }).where(eq(businessChecks.id, check.id));

    return { token: check.publicToken, result, summary, summarySource: source, discoveryCallUrl: BRAND.discoveryCallUrl };
  }),

  /** The owner asks for the free call or the full report from the result screen. */
  requestNext: publicProcedure
    .input(z.object({ token: tokenInput, choice: z.enum(["call", "report"]), note: z.string().trim().max(500).optional() }))
    .mutation(async ({ input }) => {
      const db = await database("record your request");
      const check = await findCheck(db, input.token);
      if (!check.completedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Kindly finish the business check first." });

      const already = input.choice === "call" ? check.callRequestedAt : check.reportRequestedAt;
      if (!already) {
        await db.update(businessChecks)
          .set(input.choice === "call"
            ? { callRequestedAt: databaseNow(), pipelineStage: advancePipeline(check.pipelineStage, "call_booked") }
            : { reportRequestedAt: databaseNow() })
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
            `Business check #${check.id}, completed ${check.completedAt.toISOString()}.`,
          ].join("\n"),
        });
      }
      return { success: true, choice: input.choice };
    }),
});
