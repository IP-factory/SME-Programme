import { describe, expect, it } from "vitest";
import { buildDuplicatePathwayClarificationEmail, buildEngagementBriefInvitationEmail, buildInformationSessionInvitationEmail, buildRegistrationConfirmationEmail } from "@server/emailTemplates";

describe("registration confirmation presentation", () => {
  it("includes the screenshot-support guidance in both the plain-text and branded HTML variants", () => {
    const email = buildRegistrationConfirmationEmail({
      fullName: "Amina Founder",
      businessName: "Amina Ventures",
      businessModel: "Expert",
      packageName: "Foundation",
    });

    expect(email.body).toContain("kindly take a screenshot");
    expect(email.body).toContain("reply directly to this email");
    expect(email.html).toContain("kindly take a screenshot");
    expect(email.html).toContain("JUMP 2026");
  });
});

describe("Engagement Brief invitation presentation", () => {
  it("uses a secure password-setup link and screenshot-support guidance without exposing payment figures in the email", () => {
    const email = buildEngagementBriefInvitationEmail({
      fullName: "Amina Founder",
      businessName: "Amina Ventures",
      packageName: "Engine Room",
      portalUrl: "https://emmanueltarfa.com/portal",
    });

    expect(email.subject).toContain("Engine Room Engagement Brief");
    expect(email.body).not.toContain("₦875,000");
    expect(email.body).not.toContain("₦350,000 (40%)");
    expect(email.body).not.toContain("30% by the end of September");
    expect(email.body).toContain("set your participant password");
    expect(email.body).toContain("expires after 20 minutes");
    expect(email.body).toContain("starting hypothesis");
    expect(email.body).toContain("Your private payment guidance is available alongside this brief");
    expect(email.body).toContain("You can begin the assessment before payment");
    expect(email.body).toContain("initial get-to-know-you diagnostic");
    expect(email.body).toContain("Before each class, I will ask further focused questions");
    expect(email.body).toContain("We have digitised this engagement");
    expect(email.body).toContain("kindly use a laptop whenever possible");
    expect(email.html).toContain("Set my portal password");
    expect(email.html).toContain("potential challenge");
    expect(email.html).toContain("kindly take a screenshot");
    expect(email.html).toContain("https://emmanueltarfa.com/portal");
    expect(email.html).not.toContain("₦875,000");
    expect(email.html).not.toContain("₦350,000 (40%)");
    expect(email.html).toContain("meeting recordings can live in one private place");
    expect(email.html).toContain("initial get-to-know-you diagnostic");
    expect(email.html).toContain("Before each class, I will ask further focused questions");
    expect(email.html).toContain("expires in 20 minutes");
  });

  it("reconciles duplicate pathway entries into one clear Boardroom-only participant instruction", () => {
    const email = buildDuplicatePathwayClarificationEmail({
      fullName: "Tobi Adeyemi",
      businessName: "Tobi Bloom Studio",
      packageName: "Boardroom",
      portalUrl: "https://emmanueltarfa.com/portal/access?token=boardroom-only",
    });

    expect(email.subject).toContain("Boardroom registration is confirmed");
    expect(email.body).toContain("recognised two entries");
    expect(email.body).toContain("retained your Boardroom registration only");
    expect(email.body).toContain("Please disregard the earlier lower-pathway email");
    expect(email.body).toContain("initial get-to-know-you diagnostic");
    expect(email.body).toContain("laptop or desktop");
    expect(email.html).toContain("Boardroom journey is confirmed");
    expect(email.html).toContain("Set my participant password");
    expect(email.body).toContain("expires after 20 minutes");
  });

  it("describes the Engagement Brief portal link as a time-limited password setup action", () => {
    const email = buildEngagementBriefInvitationEmail({
      fullName: "Amina Founder",
      businessName: "Amina Ventures",
      packageName: "Foundation",
      portalUrl: "https://emmanueltarfa.com/portal/access?token=personal-token",
    });

    expect(email.body).toContain("sign in normally");
    expect(email.html).toContain("Set my portal password");
    expect(email.body).not.toContain("opens your portal directly");
  });
});

describe("Information Session invitation presentation", () => {
  it("sets the confirmed Lagos date, Meet route, attendance response, personal purpose and recording assurance", () => {
    const email = buildInformationSessionInvitationEmail({
      fullName: "Amina Founder",
      meetUrl: "https://meet.google.com/abc-defg-hij",
    });

    expect(email.subject).toContain("Information Session & Briefing");
    expect(email.body).toContain("Sunday, 23 August 2026");
    expect(email.body).toContain("7:00–8:00 pm (Lagos time)");
    expect(email.body).toContain("Google Calendar invitation");
    expect(email.body).toContain("Yes, No or Maybe");
    expect(email.body).toContain("session will be recorded");
    expect(email.body).toContain("private participant portal");
    expect(email.body).toContain("Having interacted with some individuals already");
    expect(email.body).toContain("already clear on what you want and ready to move forward");
    expect(email.body).not.toContain("instance of the JUMP Admin Team");
    expect(email.html).toContain("Join the Information Session");
    expect(email.html).toContain("https://meet.google.com/abc-defg-hij");
    expect(email.html).toContain("JUMP 2026 community");
    expect(email.html).toContain("A personal invitation from Emmanuel Tarfa");
  });
});
