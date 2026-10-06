import { describe, expect, it } from "vitest";
import { getGettingStartedMilestones, participantTechnicalSupportNotice, programmeFormat, programmePathwayDelivery, programmeSessions } from "@shared/programmeProgress";

describe("Release 1 programme progress data", () => {
  it("shows the five-session sequence once, with a shared explanation of the engagement", () => {
    expect(programmeSessions).toHaveLength(5);
    expect(programmeSessions.map((session) => session.title)).toEqual([
      "Class 1 · Clarity",
      "Class 2 · The Business Model",
      "Class 3 · The Growth Engine",
      "Class 4 · The Operating Engine",
      "Class 5 · A Durable Business",
    ]);
    expect(programmeFormat.body).toContain("five sessions are one connected advisory journey");
  });

  it("marks registration complete and exposes the brief as the next step on first sign-in", () => {
    const milestones = getGettingStartedMilestones(false);
    expect(milestones[0]).toMatchObject({ title: "Registered", state: "complete" });
    expect(milestones[1]).toMatchObject({ title: "Read your engagement brief", state: "available" });
    expect(milestones.find((milestone) => milestone.title === "Complete the Current State Assessment")).toMatchObject({ state: "locked" });
    expect(milestones.find((milestone) => milestone.title === "Review payment guidance")).toMatchObject({ state: "available" });
    expect(milestones.find((milestone) => milestone.title === "Choose eligible session slots")).toMatchObject({ state: "locked" });
  });

  it("makes the assessment available after consent without using payment status as a prerequisite", () => {
    const assessment = getGettingStartedMilestones(true).find((milestone) => milestone.title === "Complete the Current State Assessment");
    expect(assessment).toMatchObject({ state: "available" });
    expect(assessment?.note).toContain("does not wait for payment");
  });

  it("keeps the screenshot-support instruction visible at the start of the journey", () => {
    expect(participantTechnicalSupportNotice).toContain("screenshot");
    expect(participantTechnicalSupportNotice).toContain("email Emmanuel directly");
  });

  it("clearly separates Foundation group delivery from the additional Engine Room and private Boardroom layers", () => {
    expect(programmePathwayDelivery.Foundation.body).toContain("shared advisory experience");
    expect(programmePathwayDelivery["Engine Room"].inclusions).toContain("Everything in Foundation");
    expect(programmePathwayDelivery.Boardroom.body).toContain("private Boardroom sessions are distinct from the shared Foundation classes");
  });
});
