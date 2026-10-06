import { z } from "zod";

export const STRUCTURED_DIAGNOSTIC_VERSION = 2;

export const DIAGNOSTIC_SECTION_IDS = ["confirm", "shape", "numbers", "founder", "future"] as const;
export type StructuredDiagnosticSectionId = (typeof DIAGNOSTIC_SECTION_IDS)[number];

export const SECTION_LABELS: Record<StructuredDiagnosticSectionId, { number: string; title: string; duration: string }> = {
  confirm: { number: "01", title: "What we already know", duration: "About 2 minutes" },
  shape: { number: "02", title: "The shape of the business", duration: "About 4 minutes" },
  numbers: { number: "03", title: "The numbers", duration: "About 8 minutes" },
  founder: { number: "04", title: "You, the founder", duration: "About 5 minutes" },
  future: { number: "05", title: "Where you are going", duration: "About 4 minutes" },
};

export const PAYERS = ["Consumers", "Small businesses", "Large companies", "Government", "Other businesses’ customers"] as const;
export const LEGAL_STRUCTURES = ["Registered business name", "Limited company", "Not yet registered", "Other"] as const;
export const OWNERSHIP_OPTIONS = ["I own all of it", "I have partners", "There are outside shareholders", "Not sure"] as const;
export const PAYMENT_APPROVAL_OPTIONS = ["Only me", "One other person", "Two or more people", "We have no threshold"] as const;
export const TEAM_SIZE_BANDS = ["None", "1", "2 to 5", "6 to 20", "21 to 50", "More than 50"] as const;
export const REVENUE_STAGE_OPTIONS = ["Pre-launch", "Trading, but revenue is irregular", "Trading with recurring revenue", "Not sure yet"] as const;
export const REVENUE_BAND_OPTIONS = ["Not applicable yet", "Under ₦1m", "₦1m–₦5m", "₦5m–₦25m", "₦25m–₦100m", "Over ₦100m", "Prefer not to say"] as const;
export const REVENUE_CONFIDENCE_OPTIONS = ["Tracked and verified", "A reasonable estimate", "A rough directional view", "I do not know yet"] as const;
export const MATERIAL_NUMBER_SOURCE_OPTIONS = ["Management accounts or bank records", "Invoice, sales or payment records", "A working forecast or budget", "Customer research, pilots or pre-orders", "Founder estimate or market assumption", "Not applicable yet — pre-launch"] as const;
export const CASH_RUNWAY_OPTIONS = ["Not applicable yet", "Less than 3 months", "3–6 months", "6–12 months", "More than 12 months", "I do not know yet"] as const;
export const FOUNDER_CAPACITY_OPTIONS = ["I am largely driving it alone", "I lead with a small dependable team", "I need to delegate more effectively", "I have leadership depth but need alignment", "I would prefer to explore this in conversation"] as const;
export const DECISION_STYLE_OPTIONS = ["I decide quickly and act", "I research deeply before deciding", "I seek input, then decide", "Important decisions are often delayed", "I would prefer to explore this in conversation"] as const;
export const FOUNDER_ENERGY_OPTIONS = ["Energised and focused", "Capable but stretched", "Managing too many competing priorities", "I need clarity before I can move confidently", "I would prefer to explore this in conversation"] as const;
export const FUTURE_HORIZON_OPTIONS = ["The next 90 days", "The next 12 months", "The next 2–3 years", "I need to clarify the direction first", "I would prefer to explore this in conversation"] as const;
export const SUCCESS_MEASURE_OPTIONS = ["Reliable revenue", "Profitability and cash discipline", "A stronger market position", "A more capable team", "Founder time and decision clarity", "Readiness to scale or raise capital", "I am not ready to define this yet"] as const;
export const STRATEGIC_PRIORITY_OPTIONS = ["Clarify the offer and target customer", "Win more customers", "Improve pricing or revenue quality", "Build systems and team capacity", "Prepare for growth, partnership, or investment", "I would prefer to explore this in conversation"] as const;

export type StructuredDiagnosticDraft = {
  version: typeof STRUCTURED_DIAGNOSTIC_VERSION;
  activeSection: StructuredDiagnosticSectionId;
  completedSections: StructuredDiagnosticSectionId[];
  section1: {
    businessName?: string;
    businessDescription?: string;
    businessAge?: string;
    engine?: string;
    primaryConstraint?: string;
  };
  section2: {
    payers?: string[];
    legalStructure?: string;
    ownership?: string;
    paymentApproval?: string;
    fullTimeTeam?: string;
    partTimeTeam?: string;
    contractors?: string;
  };
  section3: {
    revenueStage?: string;
    annualRevenueBand?: string;
    revenueConfidence?: string;
    materialNumberSource?: string;
    cashRunway?: string;
    materialNumberNote?: string;
  };
  section4: {
    founderCapacity?: string;
    decisionStyle?: string;
    founderEnergy?: string;
    leadershipConstraint?: string;
  };
  section5: {
    futureHorizon?: string;
    successMeasures?: string[];
    strategicPriority?: string;
    successDescription?: string;
  };
};

export const structuredDiagnosticDraftSchema = z.object({
  version: z.literal(STRUCTURED_DIAGNOSTIC_VERSION),
  activeSection: z.enum(DIAGNOSTIC_SECTION_IDS),
  completedSections: z.array(z.enum(DIAGNOSTIC_SECTION_IDS)).default([]),
  section1: z.object({
    businessName: z.string().max(255).optional(),
    businessDescription: z.string().max(1200).optional(),
    businessAge: z.string().max(100).optional(),
    engine: z.string().max(100).optional(),
    primaryConstraint: z.string().max(500).optional(),
  }).default({}),
  section2: z.object({
    payers: z.array(z.string().max(100)).max(PAYERS.length).optional(),
    legalStructure: z.string().max(100).optional(),
    ownership: z.string().max(100).optional(),
    paymentApproval: z.string().max(100).optional(),
    fullTimeTeam: z.string().max(100).optional(),
    partTimeTeam: z.string().max(100).optional(),
    contractors: z.string().max(100).optional(),
  }).default({}),
  section3: z.object({
    revenueStage: z.string().max(100).optional(),
    annualRevenueBand: z.string().max(100).optional(),
    revenueConfidence: z.string().max(100).optional(),
    materialNumberSource: z.string().max(150).optional(),
    cashRunway: z.string().max(100).optional(),
    materialNumberNote: z.string().max(500).optional(),
  }).default({}),
  section4: z.object({
    founderCapacity: z.string().max(150).optional(),
    decisionStyle: z.string().max(150).optional(),
    founderEnergy: z.string().max(150).optional(),
    leadershipConstraint: z.string().max(500).optional(),
  }).default({}),
  section5: z.object({
    futureHorizon: z.string().max(150).optional(),
    successMeasures: z.array(z.string().max(150)).max(SUCCESS_MEASURE_OPTIONS.length).optional(),
    strategicPriority: z.string().max(200).optional(),
    successDescription: z.string().max(500).optional(),
  }).default({}),
});

export function emptyStructuredDiagnosticDraft(): StructuredDiagnosticDraft {
  return {
    version: STRUCTURED_DIAGNOSTIC_VERSION,
    activeSection: "confirm",
    completedSections: [],
    section1: {},
    section2: {},
    section3: {},
    section4: {},
    section5: {},
  };
}

export function diagnosticSectionProgress(draft: StructuredDiagnosticDraft) {
  return {
    completed: draft.completedSections.length,
    total: DIAGNOSTIC_SECTION_IDS.length,
    activeIndex: DIAGNOSTIC_SECTION_IDS.indexOf(draft.activeSection) + 1,
  };
}
