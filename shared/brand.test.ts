import { describe, expect, it } from "vitest";
import { BRAND } from "./brand";

describe("brand settings", () => {
  it("derives composite names from their parts so a rebrand stays consistent", () => {
    expect(BRAND.programmeFullName).toBe(`${BRAND.programmeName} ${BRAND.programmeTrack}`);
    expect(BRAND.senderDisplayName).toBe(`${BRAND.facilitatorName} | ${BRAND.programmeName}`);
    expect(BRAND.facilitatorFormalName).toContain(BRAND.facilitatorName);
  });

  it("uses well-formed mailbox addresses for programme and administration email", () => {
    for (const address of [BRAND.programmeMailbox, BRAND.administrationMailbox]) {
      expect(address).toMatch(/^[^\s@<>]+@[a-z0-9.-]+\.[a-z]{2,}$/);
    }
  });
});
