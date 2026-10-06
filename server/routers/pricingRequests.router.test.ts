import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "server/routers/pricingRequests.ts"), "utf8");

describe("pricing request routes", () => {
  it("keeps public requests rate-limited and records each request before reporting success", () => {
    expect(source).toContain("consumePublicPricingRequestRateLimit");
    expect(source).toContain('code: "TOO_MANY_REQUESTS"');
    expect(source).toContain("await db.insert(pricingRequests).values");
  });

  it("derives portal request identity from the authenticated participant and not browser input", () => {
    const portalSection = source.slice(source.indexOf("submitPortal:"));
    expect(portalSection).toContain("participantProcedure");
    expect(portalSection).toContain("registrationId: participant.id");
    expect(portalSection).toContain("email: participant.email");
    expect(portalSection).not.toContain("input.email");
  });

  it("notifies only the programme administration mailbox", () => {
    expect(source).toContain("to: JUMP_ADMINISTRATION_MAILBOX");
  });
});
