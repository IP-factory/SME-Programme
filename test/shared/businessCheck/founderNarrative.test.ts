import { describe, expect, it } from "vitest";
import { describeFounder } from "@shared/businessCheck/founderNarrative";
import type { Answers } from "@shared/businessCheck/questions";

// The owner from the screenshot: rallies people under pressure, seen as careful; time and people,
// two money basics, a degree.
const rallyingAnalyst: Answers = { p_stage: "operating", p_age: "2to5", f_instinct: "I", f_seen: "C", f_team: "cofounder", f_education: "degree", f_finance: ["pl", "cash"], f_hours: "5plus" };

describe("founder readiness in words", () => {
  it("states the level with its score out of six, and what it means", () => {
    const narrative = describeFounder(rallyingAnalyst);
    expect(narrative.heading).toBe("Advanced (5 of 6)");
    expect(narrative.summary).toBe("You have the time and people and the experience to lead the next stage. The gap is the numbers.");
  });

  it("explains each part from the owner's own answers", () => {
    const [time, numbers, experience] = describeFounder(rallyingAnalyst).lines;
    expect(time).toMatchObject({ title: "Time and people", strength: "strong", text: "You can give 5 or more hours a week to working on the business, and you have a co-founder or partner beside you." });
    expect(numbers).toMatchObject({ title: "The numbers", strength: "building", text: "You are confident with 2 of the 4 money basics. Cost per unit and margin are the ones to strengthen." });
    expect(experience).toMatchObject({ title: "Experience", strength: "strong", text: "You have a business degree or professional qualification." });
  });

  it("names the gap between how the owner leads and how others see them, without a/an mistakes", () => {
    const { lead } = describeFounder(rallyingAnalyst);
    expect(lead).toBe("Under pressure you rally people around a solution (Influencer). Others see you as careful and precise (Analyst). Worth asking which one your team needs from you right now.");
    expect(lead).not.toMatch(/\ba [aeiou]/i);
  });

  it("describes a consistent style by its strength and what to watch", () => {
    expect(describeFounder({ ...rallyingAnalyst, f_seen: "I" }).lead).toMatch(/^Under pressure you rally people around a solution \(Influencer\)\. You sell, persuade/);
  });

  it("covers the extremes: no money basics, all four, and hard calls that don't get made", () => {
    const weak = describeFounder({ ...rallyingAnalyst, f_team: "solo", f_tough: "nobody", f_hours: "lt2", f_finance: ["none"], f_education: "none", p_age: "under2" });
    expect(weak.heading).toBe("Nascent (0 of 6)");
    expect(weak.lines[0].text).toBe("You can give less than 2 hours a week to working on the business, and you carry it mostly on your own. Hard calls often don't get made, which holds this back.");
    expect(weak.lines[1]).toMatchObject({ strength: "gap", text: expect.stringMatching(/^None of the four money basics yet/) });
    expect(weak.lines[2].text).toBe("You have learned by doing.");
    expect(weak.summary).toMatch(/^Time and people, the numbers and experience all need building/);

    const strong = describeFounder({ ...rallyingAnalyst, f_finance: ["pl", "cash", "unit", "margin"], p_age: "over10" });
    expect(strong.heading).toBe("Advanced (6 of 6)");
    expect(strong.lines[1].text).toMatch(/^You are confident with all four money basics/);
    expect(strong.lines[2].text).toBe("You have a business degree or professional qualification, and over 10 years of trading.");
    expect(strong.summary).toBe("You have the time and people, a grip on the numbers and the experience to lead the next stage.");
  });
});
