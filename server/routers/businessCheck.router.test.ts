import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "server/routers/businessCheck.ts"), "utf8");

describe("business check routes", () => {
  it("rate-limits public submissions and refuses incomplete checks", () => {
    expect(source).toContain("consumeRateLimit");
    expect(source).toContain('code: "TOO_MANY_REQUESTS"');
    expect(source).toContain("if (!isComplete(answers))");
  });

  it("recomputes the result on the server from cleaned answers, never from browser input", () => {
    expect(source).toContain("const answers = cleanAnswers(input.answers)");
    expect(source).toContain("const result = evaluate(answers)");
    expect(source).not.toContain("input.result");
  });

  it("records each check and finds follow-up requests by an unguessable token", () => {
    expect(source).toContain("await db.insert(businessChecks).values");
    expect(source).toContain("randomBytes(24)");
    expect(source).toContain("eq(businessChecks.publicToken, input.token)");
  });

  it("notifies only the administration mailbox and the owner who took the check", () => {
    const recipients = Array.from(source.matchAll(/to: ([\w.]+)/g)).map((match) => match[1]);
    expect(new Set(recipients)).toEqual(new Set(["JUMP_ADMINISTRATION_MAILBOX", "input.contact.email"]));
  });
});
