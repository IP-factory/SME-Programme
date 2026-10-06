import PDFDocument from "pdfkit";
import type { Registration } from "../drizzle/schema";
import type { StructuredDiagnosticDraft } from "../shared/structuredDiagnostic";

export type WorkingDiagnosticReport = {
  type: "structured-working-report-v1";
  generatedAt: string;
  participant: { fullName: string; businessName: string; pathway: string };
  executiveReadout: string;
  currentPosition: Array<{ label: string; value: string }>;
  workingHypotheses: string[];
  decisionPriorities: string[];
  advisoryFocus: string[];
  evidenceNote: string;
};

const valueOrDeferred = (value: string | undefined, deferred = "To explore in conversation") =>
  value?.trim() || deferred;

export function buildWorkingDiagnosticReport(applicant: Registration, draft: StructuredDiagnosticDraft): WorkingDiagnosticReport {
  const businessName = valueOrDeferred(draft.section1.businessName, applicant.businessName);
  const priorities = [
    draft.section5.strategicPriority && `Prioritise a decision on ${draft.section5.strategicPriority.toLowerCase()}.`,
    draft.section1.primaryConstraint && `Test the stated constraint: ${draft.section1.primaryConstraint}.`,
    draft.section3.materialNumberSource && `Ground the financial discussion in ${draft.section3.materialNumberSource.toLowerCase()}.`,
  ].filter((item): item is string => Boolean(item));

  const hypotheses = [
    draft.section1.primaryConstraint && `The most immediate working constraint appears to be ${draft.section1.primaryConstraint.toLowerCase()}. This is a working hypothesis for discussion, not a conclusion.`,
    draft.section3.revenueStage && `The commercial starting point is described as “${draft.section3.revenueStage}”; the advisory work should calibrate priorities to that stage.`,
    draft.section4.founderCapacity && `Founder capacity is currently described as “${draft.section4.founderCapacity}”, which should shape the pace and ownership of recommendations.`,
  ].filter((item): item is string => Boolean(item));

  const successMeasures = draft.section5.successMeasures?.length
    ? draft.section5.successMeasures.join("; ")
    : "To be clarified in conversation";

  return {
    type: "structured-working-report-v1",
    generatedAt: new Date().toISOString(),
    participant: { fullName: applicant.fullName, businessName, pathway: applicant.package },
    executiveReadout: `${businessName} is entering JUMP at a point where the immediate advisory task is to convert the participant’s stated context into clearer decisions, sequenced priorities, and practical next actions. This working report reflects the initial Current State Assessment and will be refined through the engagement.`,
    currentPosition: [
      { label: "Business stage", value: valueOrDeferred(draft.section1.businessAge) },
      { label: "Commercial model", value: valueOrDeferred(draft.section1.engine, applicant.businessModel) },
      { label: "Revenue position", value: valueOrDeferred(draft.section3.revenueStage) },
      { label: "Financial confidence", value: valueOrDeferred(draft.section3.revenueConfidence) },
      { label: "Decision pattern", value: valueOrDeferred(draft.section4.decisionStyle) },
      { label: "Priority horizon", value: valueOrDeferred(draft.section5.futureHorizon) },
      { label: "What success should improve", value: successMeasures },
    ],
    workingHypotheses: hypotheses.length ? hypotheses : ["A fuller working hypothesis will be shaped once the participant’s priorities are explored in the advisory sessions."],
    decisionPriorities: priorities.length ? priorities : ["Clarify the highest-value decision to address first in the next JUMP working session."],
    advisoryFocus: [
      "Separate facts, estimates, and assumptions before using them to make commercial decisions.",
      "Translate the stated priority into a small number of sequenced decisions and owners.",
      "Use the participant’s success measures as the practical test for each recommendation.",
    ],
    evidenceNote: "This is an initial working diagnostic, not an audit, valuation, medical or psychological assessment, or guarantee of a business outcome. It is based only on the participant’s registration and Current State Assessment responses, and is designed to improve the focus of the JUMP advisory conversations.",
  };
}

function writeSection(doc: PDFKit.PDFDocument, title: string, items: string[]) {
  doc.moveDown(0.8).font("Helvetica-Bold").fontSize(13).fillColor("#163859").text(title);
  doc.moveDown(0.3).font("Helvetica").fontSize(10).fillColor("#1E293B");
  for (const item of items) {
    doc.text(`• ${item}`, { indent: 10, lineGap: 3 });
  }
}

export function renderWorkingDiagnosticReportPdf(report: WorkingDiagnosticReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 54, info: { Title: `JUMP 2026 Working Diagnostic — ${report.participant.businessName}` } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.rect(0, 0, doc.page.width, 142).fill("#163859");
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(11).text("JUMP 2026", 54, 42);
    doc.fontSize(24).text("Current State Working Diagnostic", 54, 64, { width: 480 });
    doc.font("Helvetica").fontSize(10).text(`Prepared for ${report.participant.fullName} · ${report.participant.businessName}`, 54, 106);
    doc.fillColor("#1E293B").font("Helvetica").fontSize(10).text(`Generated ${new Date(report.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, 54, 168);
    doc.moveDown(2.5).font("Helvetica-Bold").fontSize(13).fillColor("#163859").text("Executive readout");
    doc.moveDown(0.4).font("Helvetica").fontSize(10).fillColor("#1E293B").text(report.executiveReadout, { lineGap: 4 });
    writeSection(doc, "Current position", report.currentPosition.map((item) => `${item.label}: ${item.value}`));
    writeSection(doc, "Working hypotheses to test", report.workingHypotheses);
    writeSection(doc, "Decision priorities", report.decisionPriorities);
    writeSection(doc, "Early advisory focus", report.advisoryFocus);
    doc.moveDown(1.2).font("Helvetica-Oblique").fontSize(8.5).fillColor("#475569").text(report.evidenceNote, { lineGap: 3 });
    doc.end();
  });
}
