import { describe, expect, it } from "vitest";
import { buildConsentConfirmationEmail, ENGAGEMENT_BRIEF_VERSION, getEngagementBrief } from "../shared/engagementBrief";

const baseParticipant = {
  fullName: "Ada Lovelace",
  businessName: "Analytical Engine Ltd",
  businessModel: "Expert" as const,
  businessDescription: "a specialist advisory practice helping technical founders turn complex work into clear commercial decisions",
  question: "How can I grow without becoming the bottleneck?",
};

describe("personalised engagement briefs", () => {
  it.each([
    ["Foundation", "₦575,000", "complete five-class"],
    ["Engine Room", "₦875,000", "two focused advisory sessions"],
    ["Boardroom", "₦1,500,000", "three private 90-minute"],
  ] as const)("builds the %s brief with its correct package and fee", (packageName, fee, packageDetail) => {
    const brief = getEngagementBrief({ ...baseParticipant, packageName });

    expect(brief.version).toBe(ENGAGEMENT_BRIEF_VERSION);
    expect(brief.welcome).toContain(baseParticipant.businessName);
    expect(brief.selectedPackage).toBe(packageName);
    expect(brief.payment.body).toContain(fee);
    expect(brief.package.summary).toContain(packageDetail);
    expect(brief.consentStatement).toContain("consent to proceed");
  });

  it("opens with the participant's stated context and a provisional working hypothesis", () => {
    const brief = getEngagementBrief({
      ...baseParticipant,
      packageName: "Foundation",
      diagnosticConstraint: "Everything runs through me",
      diagnosticFocusSessions: ["04 · The Operating Engine", "02 · The Business Model"],
    });

    expect(brief.initialPerspective.summary).toContain(baseParticipant.businessDescription);
    expect(brief.initialPerspective.summary).toContain(baseParticipant.question);
    expect(brief.initialPerspective.potentialChallenge).toContain("Everything runs through me");
    expect(brief.initialPerspective.potentialChallenge).toContain("not a final diagnosis");
    expect(brief.initialPerspective.exploration).toContain("04 · The Operating Engine");
  });

  it("creates a confirmation email that records the selected package and next steps", () => {
    const confirmation = buildConsentConfirmationEmail({
      ...baseParticipant,
      packageName: "Boardroom",
      acknowledgedAt: new Date("2026-08-20T10:00:00.000Z"),
    });

    expect(confirmation.subject).toContain("acknowledgement");
    expect(confirmation.body).toContain("Boardroom");
    expect(confirmation.body).toContain(ENGAGEMENT_BRIEF_VERSION);
    expect(confirmation.body).toContain("Current State Assessment");
    expect(confirmation.body).toContain("screenshot");
  });
});
