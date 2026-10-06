import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { JUMP_MONITORING_BCC } from "@server/email";

const participantDeliverySources = [
  "server/routers/registration.ts",
  "server/routers/participant.ts",
  "server/routers/paymentInstructions.ts",
  "server/routers/adminAccess.ts",
].map((relativePath) => readFileSync(resolve(process.cwd(), relativePath), "utf8"));

describe("JUMP monitoring-copy policy", () => {
  it("uses the programme administration mailbox as the only operational monitoring recipient", () => {
    expect(JUMP_MONITORING_BCC).toEqual(["admin@emmanueltarfa.com"]);
  });

  it("uses the central monitoring policy in every live participant and admin-invitation delivery route", () => {
    participantDeliverySources.forEach((source) => {
      expect(source).toContain("JUMP_MONITORING_BCC");
      expect(source).not.toContain("emmanuel.tarfa@enzokrypton.com");
    });
  });
});
