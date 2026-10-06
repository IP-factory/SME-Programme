import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { calculateAssessmentProgress, isAssessmentComplete } from "../client/src/lib/assessmentProgress";

describe("JUMP 2026 Assessment and Portal Workflow", () => {
  it("should have participant assessment procedures available on router", () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    expect(caller.participant.getAssessment).toBeDefined();
    expect(caller.participant.saveAssessment).toBeDefined();
    expect(caller.participant.adminGetAssessment).toBeDefined();
  });

  it("calculates empty and partial assessment completion correctly", () => {
    expect(calculateAssessmentProgress({})).toEqual({ completed: 0, total: 6, percentage: 0 });
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

  it("reports complete when every core section has a response", () => {
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
