import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "server/routers/paymentInstructions.ts"), "utf8");

describe("payment instruction reply route", () => {
  it("keeps template access and delivery restricted to the owner-admin procedure", () => {
    expect(source).toMatch(/templateLibrary: ownerAdminProcedure/);
    expect(source).toMatch(/preview: ownerAdminProcedure/);
    expect(source).toMatch(/send: ownerAdminProcedure/);
  });

  it("requires explicit owner approval, blind copies the programme administration mailbox, and writes an audit record", () => {
    expect(source).toContain("ownerApproval: z.literal(true)");
    expect(source).toContain("bcc: JUMP_MONITORING_BCC");
    expect(source).toContain("await db.insert(emailLogs).values");
  });
});
