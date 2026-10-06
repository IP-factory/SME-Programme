import { describe, expect, it } from "vitest";
import {
  buildInformationSessionCalendarDescription,
  hasSentFinalInformationSessionEmail,
  INFORMATION_SESSION,
  INFORMATION_SESSION_RECIPIENT_IDS,
} from "@server/informationSession";

describe("JUMP Information Session delivery model", () => {
  it("keeps Emmanuel's personal briefing purpose and approved practical next-step guidance", () => {
    const description = buildInformationSessionCalendarDescription();

    expect(description).toContain("Having interacted with some individuals already");
    expect(description).toContain("already clear on what you want and ready to move forward");
    expect(description).toContain("recorded for participants who cannot attend live");
    expect(description).toContain(INFORMATION_SESSION.meetUrl);
    expect(description).not.toContain("Hosted by the JUMP Admin Team");
  });

  it("includes canonical participant and owner experience records while excluding internal QA rows", () => {
    expect(INFORMATION_SESSION_RECIPIENT_IDS).toHaveLength(19);
    expect(INFORMATION_SESSION_RECIPIENT_IDS).toContain(1);
    expect(INFORMATION_SESSION_RECIPIENT_IDS).toContain(480001);
    expect(INFORMATION_SESSION_RECIPIENT_IDS).toContain(600001);
    expect(INFORMATION_SESSION_RECIPIENT_IDS).not.toContain(510001);
    expect(INFORMATION_SESSION_RECIPIENT_IDS).not.toContain(570001);
  });

  it("does not allow a different earlier preview to suppress the approved final invitation", () => {
    expect(hasSentFinalInformationSessionEmail([{ status: "Sent", body: "earlier preview" }], "approved final email")).toBe(false);
    expect(hasSentFinalInformationSessionEmail([{ status: "Sent", body: "approved final email" }], "approved final email")).toBe(true);
    expect(hasSentFinalInformationSessionEmail([{ status: "Failed", body: "approved final email" }], "approved final email")).toBe(false);
  });
});
