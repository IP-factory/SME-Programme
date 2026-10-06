/**
 * Free Business Check persistence on PostgreSQL: PGlite on every run, plus TEST_DATABASE_URL when set.
 * The language model and email delivery are stubbed; everything else is the production router and schema.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { createPgliteHarness, createRemoteHarness, type DbHarness } from "./harness";
import { businessCheckProfiles, profileContact } from "../fixtures/businessCheckProfiles";

const holder = vi.hoisted(() => {
  process.env.DATABASE_URL = "postgresql://contract:contract@localhost:5432/contract";
  return { current: null as unknown as Record<string, unknown> };
});
const mocked = vi.hoisted(() => ({ deliverEmail: vi.fn() }));

vi.mock("pg", () => ({ default: { Pool: class { on() { return this; } } } }));
vi.mock("drizzle-orm/node-postgres", () => ({
  drizzle: () =>
    new Proxy({}, {
      get: (_target, property) => {
        const value = holder.current[property as string];
        return typeof value === "function" ? value.bind(holder.current) : value;
      },
    }),
}));
vi.mock("@server/email", async importOriginal => ({ ...(await importOriginal<typeof import("@server/email")>()), deliverEmail: mocked.deliverEmail }));
vi.mock("@server/_core/llm", () => ({ invokeLLM: () => Promise.reject(new Error("offline")) }));
vi.mock("@server/_core/env", async importOriginal => ({ ENV: { ...(await importOriginal<typeof import("@server/_core/env")>()).ENV, forgeApiKey: "test-key" } }));

import { businessCheckRouter } from "@server/routers/businessCheck";
import { JUMP_ADMINISTRATION_MAILBOX } from "@server/email";
import { cleanAnswers, evaluate, founderRead } from "@shared/businessCheck/engine";
import type { TrpcContext } from "@server/_core/context";

const targets = [
  { name: "PGlite", enabled: true, timeout: undefined, make: () => createPgliteHarness() },
  // One network round trip per statement on a real database; local targets keep the default 5 s ceiling.
  { name: "TEST_DATABASE_URL", enabled: Boolean(process.env.TEST_DATABASE_URL), timeout: 30_000, make: () => createRemoteHarness(process.env.TEST_DATABASE_URL!) },
];

const caller = () =>
  businessCheckRouter.createCaller({ req: { ip: "203.0.113.9", protocol: "https", headers: {} }, res: {}, user: null } as unknown as TrpcContext);

for (const target of targets) {
  describe.skipIf(!target.enabled)(`Free Business Check persistence on ${target.name}`, target.timeout ? { timeout: target.timeout } : {}, () => {
    let harness: DbHarness;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let db: any;

    beforeAll(async () => {
      harness = await target.make();
      db = harness.db;
      holder.current = harness.db as unknown as Record<string, unknown>;
    }, 60_000);
    afterAll(async () => {
      await harness?.close();
    });
    beforeEach(() => {
      mocked.deliverEmail.mockReset();
      mocked.deliverEmail.mockResolvedValue({ status: "Simulated", reason: "test_sender" });
    });

    describe.each(Object.entries(businessCheckProfiles))("submit: %s", (name, rawAnswers) => {
      it("persists exactly one business_checks row with answers, result and summary, and returns its public token", async () => {
        const contact = profileContact(name);
        const response = await caller().submit({ contact, answers: rawAnswers });

        const rows = await db.select().from(schema.businessChecks).where(eq(schema.businessChecks.email, contact.email));
        expect(rows).toHaveLength(1);
        const row = rows[0];
        const answers = cleanAnswers(rawAnswers);
        const result = evaluate(answers);

        expect(row.publicToken).toBe(response.token);
        expect(row).toMatchObject({
          fullName: contact.fullName,
          businessName: contact.businessName,
          route: result.route,
          readiness: founderRead(answers).level,
          primaryArea: result.primaryArea?.area ?? null,
          summarySource: "Rules",
          notificationStatus: "Simulated",
          callRequestedAt: null,
          reportRequestedAt: null,
        });
        expect(JSON.parse(row.answersJson)).toEqual(answers);
        expect(JSON.parse(row.resultJson)).toEqual(JSON.parse(JSON.stringify(result)));
        expect(JSON.parse(row.summaryJson)).toEqual(JSON.parse(JSON.stringify(response.summary)));
        expect(row.createdAt).toBeInstanceOf(Date);
        expect(response.result).toEqual(result);
      });
    });

    describe("requestNext", () => {
      async function submitted(email: string) {
        const response = await caller().submit({ contact: { ...profileContact("Next"), email }, answers: businessCheckProfiles.growingMaker });
        mocked.deliverEmail.mockClear();
        return response.token;
      }
      const rowFor = async (token: string) => (await db.select().from(schema.businessChecks).where(eq(schema.businessChecks.publicToken, token)))[0];

      it("call sets callRequestedAt only, once, and notifies the programme mailbox", async () => {
        const token = await submitted("next-call@example.test");
        await caller().requestNext({ token, choice: "call", note: "Please phone me." });
        const first = await rowFor(token);
        expect(first.callRequestedAt).toBeInstanceOf(Date);
        expect(first.reportRequestedAt).toBeNull();
        expect(mocked.deliverEmail).toHaveBeenCalledTimes(1);
        expect(mocked.deliverEmail.mock.calls[0][0].to).toBe(JUMP_ADMINISTRATION_MAILBOX);

        await caller().requestNext({ token, choice: "call" });
        expect((await rowFor(token)).callRequestedAt!.getTime()).toBe(first.callRequestedAt!.getTime());
        expect(mocked.deliverEmail).toHaveBeenCalledTimes(1);
      });

      it("report sets reportRequestedAt only", async () => {
        const token = await submitted("next-report@example.test");
        await caller().requestNext({ token, choice: "report" });
        const row = await rowFor(token);
        expect(row.reportRequestedAt).toBeInstanceOf(Date);
        expect(row.callRequestedAt).toBeNull();
      });

      it("rejects an unknown token", async () => {
        await expect(caller().requestNext({ token: "x".repeat(24), choice: "call" })).rejects.toMatchObject({ code: "NOT_FOUND" });
      });
    });
  });
}
