import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const participantRouterSource = readFileSync(resolve(process.cwd(), "server/routers/participant.ts"), "utf8");
const participantPortalSource = readFileSync(resolve(process.cwd(), "client/src/pages/ParticipantDashboard.tsx"), "utf8");

describe("portal-wide private payment guidance", () => {
  it("makes payment guidance available to authenticated participants without brief acknowledgement", () => {
    const section = participantRouterSource.slice(participantRouterSource.indexOf("paymentGuidance: participantProcedure"), participantRouterSource.indexOf("acknowledgeEngagementBrief:"));
    expect(section).toContain("getPrivatePaymentGuidance(applicant.package as ParticipantPackage, applicant.fullName)");
    expect(section).not.toContain("requireBriefAcknowledgement");
    expect(section).not.toContain("participantEngagementConsents");
  });

  it("loads payment guidance as soon as the authenticated portal record is available and renders it before consent", () => {
    expect(participantPortalSource).toContain("enabled: Boolean(data)");
    expect(participantPortalSource).toContain("pre-consent-payment-guidance-heading");
    expect(participantPortalSource).toContain("Your {paymentGuidance.packageName} payment schedule");
    expect(participantPortalSource).toContain("First commitment · 40%");
    expect(participantPortalSource).toContain("End September · 30%");
    expect(participantPortalSource).toContain("Mid October · 30%");
    expect(participantPortalSource).toContain("10% full-upfront option:");
    expect(participantPortalSource).toContain("Payment-receipt upload and session selection become available after you acknowledge your engagement brief.");
    expect(participantPortalSource).toContain("Paystack <span");
    expect(participantPortalSource).toContain("(Payments in North America)");
    expect(participantPortalSource).toContain("Other payment options");
    expect(participantPortalSource).toContain('route.id !== "north_america"');
    expect(participantPortalSource).not.toContain("Western Union Direct Deposit");
  });
});
