import { readFileSync } from "node:fs";
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

  it("keeps the email/PDF brand colours in step with the UI colour tokens", () => {
    const css = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");
    const token = (name: string) => css.match(new RegExp(`--color-${name}:\\s*(#[0-9A-Fa-f]{6})`))?.[1]?.toUpperCase();
    expect(token("brand")).toBe(BRAND.colorBrand.toUpperCase());
    expect(token("brand-deep")).toBe(BRAND.colorBrandDeep.toUpperCase());
  });
});
