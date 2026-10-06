import { describe, expect, it } from "vitest";
import { appRouter } from "@server/routers";
import type { TrpcContext } from "@server/_core/context";
import type { StructuredDiagnosticDraft } from "@shared/structuredDiagnostic";
import {
  STRUCTURED_DIAGNOSTIC_VERSION,
  diagnosticSectionProgress,
  emptyStructuredDiagnosticDraft,
  structuredDiagnosticDraftSchema,
} from "@shared/structuredDiagnostic";

describe("Structured Current State Diagnostic", () => {
  it("starts as a versioned five-section diagnostic without completed sections", () => {
    const draft = emptyStructuredDiagnosticDraft();

    expect(draft.version).toBe(STRUCTURED_DIAGNOSTIC_VERSION);
    expect(draft.activeSection).toBe("confirm");
    expect(diagnosticSectionProgress(draft)).toEqual({ completed: 0, total: 5, activeIndex: 1 });
    expect(structuredDiagnosticDraftSchema.safeParse(draft).success).toBe(true);
  });

  it("tracks completed stages without treating future stages as complete", () => {
    const draft = {
      ...emptyStructuredDiagnosticDraft(),
      completedSections: ["confirm", "shape"] as StructuredDiagnosticDraft["completedSections"],
      activeSection: "numbers" as const,
    };

    expect(diagnosticSectionProgress(draft)).toEqual({ completed: 2, total: 5, activeIndex: 3 });
  });

  it("accepts the typed numbers, founder, and future responses required by the remaining diagnostic sections", () => {
    const draft = {
      ...emptyStructuredDiagnosticDraft(),
      activeSection: "future" as const,
      completedSections: ["confirm", "shape", "numbers", "founder", "future"] as StructuredDiagnosticDraft["completedSections"],
      section3: {
        revenueStage: "Trading with recurring revenue",
        annualRevenueBand: "₦5m–₦25m",
        revenueConfidence: "A reasonable estimate",
        materialNumberSource: "Invoice, sales or payment records",
        cashRunway: "3–6 months",
        materialNumberNote: "Revenue is seasonal.",
      },
      section4: {
        founderCapacity: "I lead with a small dependable team",
        decisionStyle: "I seek input, then decide",
        founderEnergy: "Capable but stretched",
      },
      section5: {
        futureHorizon: "The next 12 months",
        successMeasures: ["Reliable revenue", "A more capable team"],
        strategicPriority: "Build systems and team capacity",
      },
    };

    expect(structuredDiagnosticDraftSchema.safeParse(draft).success).toBe(true);
    expect(diagnosticSectionProgress(draft)).toEqual({ completed: 5, total: 5, activeIndex: 5 });
  });

  it("backfills empty section objects when an earlier saved diagnostic only contains the first two sections", () => {
    const legacyStageOneDraft = {
      version: STRUCTURED_DIAGNOSTIC_VERSION,
      activeSection: "numbers" as const,
      completedSections: ["confirm", "shape"] as StructuredDiagnosticDraft["completedSections"],
      section1: {},
      section2: {},
    };

    const parsed = structuredDiagnosticDraftSchema.parse(legacyStageOneDraft);
    expect(parsed.section3).toEqual({});
    expect(parsed.section4).toEqual({});
    expect(parsed.section5).toEqual({});
  });

  it("accepts respectful defer choices in founder and future sections without blocking diagnostic completion", () => {
    const draft = {
      ...emptyStructuredDiagnosticDraft(),
      activeSection: "future" as const,
      completedSections: ["confirm", "shape", "numbers", "founder", "future"] as StructuredDiagnosticDraft["completedSections"],
      section4: {
        founderCapacity: "I would prefer to explore this in conversation",
        decisionStyle: "I would prefer to explore this in conversation",
        founderEnergy: "I would prefer to explore this in conversation",
      },
      section5: {
        futureHorizon: "I would prefer to explore this in conversation",
        successMeasures: ["I am not ready to define this yet"],
        strategicPriority: "I would prefer to explore this in conversation",
      },
    };

    expect(structuredDiagnosticDraftSchema.safeParse(draft).success).toBe(true);
    expect(diagnosticSectionProgress(draft)).toEqual({ completed: 5, total: 5, activeIndex: 5 });
  });

  it("exposes the consent-gated structured diagnostic procedures alongside preserved legacy assessment routes", () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    expect(caller.participant.getStructuredDiagnostic).toBeDefined();
    expect(caller.participant.saveStructuredDiagnostic).toBeDefined();
    expect(caller.participant.getAssessment).toBeDefined();
  });
});
