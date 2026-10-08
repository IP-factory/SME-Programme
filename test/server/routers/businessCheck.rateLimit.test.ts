import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "@server/_core/context";

// No database: the limiters run before the database is touched, so a request that passes them fails with
// INTERNAL_SERVER_ERROR and one that is throttled fails with TOO_MANY_REQUESTS. That separates the two cleanly.
vi.mock("@server/db", () => ({ getDb: async () => null }));

import { businessCheckRouter, resetBusinessCheckRateLimitsForTests } from "@server/routers/businessCheck";

const caller = (ip: string) =>
  businessCheckRouter.createCaller({ req: { ip, protocol: "https", headers: {} }, res: {}, user: null } as unknown as TrpcContext);
const start = (ip: string, email: string) => caller(ip).start({ fullName: "Rate Limit", email });
const passes = (promise: Promise<unknown>) => expect(promise).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
const throttled = (promise: Promise<unknown>) => expect(promise).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });

beforeEach(() => resetBusinessCheckRateLimitsForTests());

describe("business check start limiter", () => {
  it("allows 5 starts per address and email, then throttles", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) await passes(start("203.0.113.10", "same@example.test"));
    await throttled(start("203.0.113.10", "same@example.test"));
    // Another email from the same address is a separate allowance.
    await passes(start("203.0.113.10", "other@example.test"));
  });

  it("treats the email case-insensitively, so changing case does not dodge the limit", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) await passes(start("203.0.113.11", "Case@Example.test"));
    await throttled(start("203.0.113.11", "case@example.test"));
  });

  it("caps one address at 20 starts whatever emails are typed", async () => {
    for (let attempt = 0; attempt < 20; attempt += 1) await passes(start("203.0.113.12", `flood-${attempt}@example.test`));
    await throttled(start("203.0.113.12", "flood-final@example.test"));
    // A different address is unaffected.
    await passes(start("203.0.113.13", "flood-final@example.test"));
  });

  it("restores the allowance when the test helper resets the state", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) await passes(start("203.0.113.14", "reset@example.test"));
    await throttled(start("203.0.113.14", "reset@example.test"));
    resetBusinessCheckRateLimitsForTests();
    await passes(start("203.0.113.14", "reset@example.test"));
  });

  it("runs each test with a fresh allowance (no bleed from the previous test)", async () => {
    // The previous tests exhausted several addresses' limits; the beforeEach reset gives this one a full allowance.
    for (let attempt = 0; attempt < 5; attempt += 1) await passes(start("203.0.113.10", "same@example.test"));
    await throttled(start("203.0.113.10", "same@example.test"));
  });
});

describe("the reset helper", () => {
  const root = process.cwd();
  const walk = (directory: string): string[] =>
    readdirSync(directory, { withFileTypes: true }).flatMap(entry => (entry.isDirectory() ? walk(resolve(directory, entry.name)) : [resolve(directory, entry.name)]));

  it("is used only by tests, never by application code", () => {
    const users = ["server", "shared", "client/src", "scripts"]
      .flatMap(directory => walk(resolve(root, directory)))
      .filter(file => /\.(ts|tsx|mjs)$/.test(file))
      .filter(file => readFileSync(file, "utf8").includes("resetBusinessCheckRateLimitsForTests"))
      .map(file => file.replace(`${root}/`, ""));
    expect(users).toEqual(["server/routers/businessCheck.ts"]);
  });
});

describe("business check start: the WhatsApp number", () => {
  // Same trick as above: a request that passes validation reaches the (missing) database.
  const startWith = (whatsapp: string) => caller("203.0.113.40").start({ fullName: "Phone Check", email: `phone-${whatsapp.length}@example.test`, whatsapp });

  it("accepts a number in international format", async () => {
    await passes(startWith("+2348031234567"));
  });

  it("refuses a number that is not in international format before touching the database", async () => {
    for (const bad of ["08031234567", "+234 803 123 4567", "not a number", "+12"]) {
      await expect(startWith(bad), bad).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
  });
});
