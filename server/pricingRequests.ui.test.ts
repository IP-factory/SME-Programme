import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const portalSource = readFileSync(resolve(process.cwd(), "client/src/pages/ParticipantDashboard.tsx"), "utf8");
const dialogSource = readFileSync(resolve(process.cwd(), "client/src/components/PricingRequestDialog.tsx"), "utf8");

describe("Request Programme Pricing entry points", () => {
  it("places the public request in the sign-up call-to-action group", () => {
    expect(homeSource).toContain("Request programme pricing");
    expect(homeSource).toContain('source="public"');
  });

  it("offers the authenticated portal request inside private payment guidance", () => {
    expect(portalSource).toContain("Request programme pricing");
    expect(portalSource).toContain('source="portal"');
  });

  it("uses typed public and authenticated submission procedures", () => {
    expect(dialogSource).toContain("trpc.pricingRequests.submitPublic.useMutation");
    expect(dialogSource).toContain("trpc.pricingRequests.submitPortal.useMutation");
  });
});
