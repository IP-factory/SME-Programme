import { describe, expect, it } from "vitest";
import { calculateAssessmentProgress, isAssessmentComplete } from "@/lib/assessmentProgress";

describe("Current Status Assessment progress", () => {
  it("starts at zero for an empty assessment", () => {
    expect(calculateAssessmentProgress({})).toEqual({ completed: 0, total: 6, percentage: 0 });
  });

  it("counts only non-empty core sections", () => {
    expect(
      calculateAssessmentProgress({
        businessModelSummary: "A strategy practice",
        currentRevenueStage: "Established",
        primaryBottleNeck: "",
        teamAndOperations: "  ",
        financialVisibility: "Monthly records",
      })
    ).toEqual({ completed: 3, total: 6, percentage: 50 });
  });

  it("reports a complete assessment when every core section has a response", () => {
    const assessment = {
      businessModelSummary: "A strategy practice",
      currentRevenueStage: "Established",
      primaryBottleNeck: "Decision speed",
      teamAndOperations: "Three-person team",
      financialVisibility: "Monthly records",
      desiredSixMonthOutcome: "A repeatable growth system",
    };

    expect(calculateAssessmentProgress(assessment)).toEqual({ completed: 6, total: 6, percentage: 100 });
    expect(isAssessmentComplete(assessment)).toBe(true);
  });
});
