import { describe, expect, it } from "vitest";
import { buildWorkingDiagnosticReport, renderWorkingDiagnosticReportPdf } from "./workingDiagnosticReport";
import type { Registration } from "../drizzle/schema";
import type { StructuredDiagnosticDraft } from "../shared/structuredDiagnostic";

const applicant = {
  fullName: "Amina Example",
  businessName: "Northstar Foods",
  package: "Foundation",
  businessModel: "Food processing",
} as Registration;

const draft = {
  activeSection: "future",
  completedSections: ["confirm", "shape", "numbers", "founder", "future"],
  section1: {
    businessName: "Northstar Foods",
    businessDescription: "A packaged-food business.",
    businessAge: "1 to 3 years",
    engine: "Makers",
    primaryConstraint: "Working capital discipline",
  },
  section2: { payers: ["Retail customers"], legalStructure: "Limited company", ownership: "Founder-led", paymentApproval: "Founder approval", fullTimeTeam: "3", partTimeTeam: "1", contractors: "0" },
  section3: { revenueStage: "Consistent early revenue", annualRevenueBand: "Under ₦10m", revenueConfidence: "Moderate confidence", materialNumberSource: "Sales records", cashRunway: "3 to 6 months" },
  section4: { founderCapacity: "Strong but stretched", decisionStyle: "Evidence-led", founderEnergy: "Sustainable" },
  section5: { futureHorizon: "Next 12 months", successMeasures: ["Clearer priorities", "Better decisions"], strategicPriority: "Focus the growth strategy" },
} as StructuredDiagnosticDraft;

describe("working diagnostic report", () => {
  it("turns supplied registration and diagnostic responses into clearly qualified working hypotheses", () => {
    const report = buildWorkingDiagnosticReport(applicant, draft);

    expect(report.type).toBe("structured-working-report-v1");
    expect(report.participant).toEqual({ fullName: "Amina Example", businessName: "Northstar Foods", pathway: "Foundation" });
    expect(report.currentPosition).toContainEqual({ label: "Revenue position", value: "Consistent early revenue" });
    expect(report.workingHypotheses.join(" ")).toContain("working capital discipline");
    expect(report.workingHypotheses.join(" ")).toContain("working hypothesis");
    expect(report.evidenceNote).toContain("not an audit");
  });

  it("renders a PDF document for the private report snapshot", async () => {
    const report = buildWorkingDiagnosticReport(applicant, draft);
    const pdf = await renderWorkingDiagnosticReportPdf(report);

    expect(pdf.subarray(0, 4).toString("utf8")).toBe("%PDF");
    expect(pdf.length).toBeGreaterThan(1000);
  });
});
