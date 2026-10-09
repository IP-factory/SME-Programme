import { describe, expect, it } from "vitest";
import { SECTIONS } from "@shared/businessCheck/questions";
import { AREA_CONTENT, AREA_DEFAULT_MOVE, IDEA_READINGS } from "@shared/fullReport/content";

describe("the full report's written content", () => {
  const areaSections = Object.values(SECTIONS).filter((section) => section.area !== undefined && section.area > 0 && section.id !== "idea");

  it("reads every status answer of every area", () => {
    for (const section of areaSections) {
      const status = section.questions.find((question) => question.id.endsWith("_status"))!;
      for (const option of status.options) {
        expect(AREA_CONTENT[section.area!].status[option.value], `${status.id}=${option.value}`).toMatchObject({ finding: expect.stringMatching(/\.$/), meaning: expect.stringMatching(/\.$/) });
      }
    }
  });

  it("gives every follow-up answer a meaning, a move and a step for this week; areas without one have a default move", () => {
    for (const section of areaSections) {
      const detail = section.questions.find((question) => question.id.endsWith("_detail"));
      if (!detail) {
        expect(AREA_DEFAULT_MOVE[section.area!], section.id).toBeDefined();
        continue;
      }
      for (const option of detail.options) {
        expect(AREA_CONTENT[section.area!].detail[option.value], `${detail.id}=${option.value}`).toMatchObject({ meaning: expect.any(String), move: expect.any(String), thisWeek: expect.any(String) });
      }
    }
  });

  it("reads every answer to the idea questions", () => {
    for (const question of SECTIONS.idea.questions) {
      for (const option of question.options) expect(IDEA_READINGS[question.id]?.[option.value], `${question.id}=${option.value}`).toBeTruthy();
    }
  });

  it("keeps to the site's copy rules", () => {
    const all = JSON.stringify({ AREA_CONTENT, AREA_DEFAULT_MOVE, IDEA_READINGS });
    expect(all).not.toMatch(/\b(door|sprint|playbook|retainer)\b/i);
    expect(all).not.toMatch(/JUMP|—/);
  });
});
