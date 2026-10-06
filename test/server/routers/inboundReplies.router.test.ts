import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "server/routers/inboundReplies.ts"), "utf8");

describe("inbound reply tracker router", () => {
  it("restricts participant reply visibility to authorised communication administrators", () => {
    expect(source).toContain('list: adminPermissionProcedure("view_communications")');
    expect(source).toContain('updateStatus: adminPermissionProcedure("view_communications")');
  });

  it("restricts live mailbox synchronisation to the owner and persists only matched active participant replies", () => {
    expect(source).toContain("sync: ownerAdminProcedure.mutation");
    expect(source).toContain("registrationByEmail");
    expect(source).toContain("getJumpMailboxMessages(Array.from(registrationByEmail.keys()))");
    expect(source).toContain("inboundEmailReplies");
    expect(source).toContain("onConflictDoUpdate");
  });
});
