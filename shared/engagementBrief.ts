import { buildBrandedEmailHtml } from "../server/emailTemplates";
import { BRAND } from "./brand";

export const ENGAGEMENT_BRIEF_VERSION = "2026.2";

export type EngagementPackage = "Foundation" | "Engine Room" | "Boardroom";

type BriefInput = {
  fullName: string;
  businessName: string;
  packageName: EngagementPackage;
  businessModel: "Maker" | "Trader" | "Expert";
  businessDescription?: string | null;
  question?: string | null;
  diagnosticConstraint?: string | null;
  diagnosticFocusSessions?: string[];
};

const packageFees: Record<EngagementPackage, number> = {
  Foundation: 575_000,
  "Engine Room": 875_000,
  Boardroom: 1_500_000,
};

const packageAccess: Record<EngagementPackage, { heading: string; summary: string; included: string[] }> = {
  Foundation: {
    heading: "Foundation — the full applied strategy journey",
    summary:
      `Foundation gives you the complete five-class ${BRAND.programmeShortName} experience: structured teaching, live questions, recordings, practical frameworks, slides and curated resources. It is designed for founders who want a serious structure for better strategic choices.`,
    included: ["Five live applied strategy classes", "Open Office and deep-dive question time", "Session recordings, slides and curated resources", "A tailored diagnostic direction after your Current State Assessment"],
  },
  "Engine Room": {
    heading: "Engine Room — the full journey with deeper operating work",
    summary:
      "Engine Room includes everything in Foundation and adds two focused advisory sessions around the way your business makes money. The work goes further into positioning, peer diagnosis, unit economics and the application of the frameworks to your own commercial model.",
    included: ["Everything in Foundation", "Two additional Engine Room advisory sessions", "Work tailored to the Maker, Trader or Expert commercial model", "Deeper work on positioning, economics and operating choices"],
  },
  Boardroom: {
    heading: `Boardroom — the complete ${BRAND.programmeShortName} advisory engagement`,
    summary:
      `Boardroom is the full, cumulative ${BRAND.programmeShortName} engagement. It includes Foundation and Engine Room access, plus three private 90-minute strategy sessions with ${BRAND.facilitatorFirstName} and written action points after each session. It is intentionally limited so that the individual work remains substantive.`,
    included: ["Everything in Foundation and Engine Room", "Three private 90-minute strategy sessions", "Written action points after each private session", "Priority space for the decisions that matter most to your business"],
  },
};

function naira(value: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
}

const modelWorkingHypotheses: Record<BriefInput["businessModel"], { challenge: string; sessions: string[] }> = {
  Maker: {
    challenge: "how the offer, commercial model and delivery capacity can support repeatable, profitable growth",
    sessions: ["Class 2 · The Business Model", "Class 4 · The Operating Engine"],
  },
  Trader: {
    challenge: "how the commercial model, market position and operating choices can create more reliable demand and margin",
    sessions: ["Class 2 · The Business Model", "Class 3 · The Growth Engine"],
  },
  Expert: {
    challenge: "how personal expertise can be translated into a clearer offer, a stronger commercial model and sustainable capacity beyond the founder",
    sessions: ["Class 2 · The Business Model", "Class 4 · The Operating Engine"],
  },
};

function buildInitialPerspective(input: BriefInput) {
  const modelLens = modelWorkingHypotheses[input.businessModel];
  const description = input.businessDescription?.trim();
  const question = input.question?.trim();
  const statedContext = description
    ? `You described ${input.businessName} as ${description}`
    : `You are joining ${BRAND.programmeName} with a ${input.businessModel.toLowerCase()} business model.`;
  const questionLine = question
    ? ` You also highlighted this for consideration: “${question}”`
    : "";
  const constraint = input.diagnosticConstraint?.trim();
  const focusSessions = input.diagnosticFocusSessions?.filter(Boolean).slice(0, 2) ?? modelLens.sessions;

  return {
    heading: "Our understanding so far",
    summary: `${statedContext}.${questionLine} This is our starting understanding from your registration, which you can refine as the engagement begins.`,
    potentialChallenge: constraint
      ? `You identified “${constraint}” as a current pressure point. At this stage, we are treating it as a working hypothesis to explore, not a final diagnosis.`
      : `One potential challenge to explore is ${modelLens.challenge}. This is a working hypothesis based on your registration and selected business model, not a final diagnosis.`,
    exploration: `The early sessions will test this understanding against the reality of your business, particularly through ${focusSessions.join(" and ")}. Your Current Status Assessment will add the detail needed to refine the priorities and advisory direction.`,
    focusSessions,
  };
}

export function getEngagementBrief(input: BriefInput) {
  const fee = packageFees[input.packageName];
  const access = packageAccess[input.packageName];
  const firstName = input.fullName.trim().split(/\s+/)[0] || input.fullName;

  return {
    version: ENGAGEMENT_BRIEF_VERSION,
    firstName,
    selectedPackage: input.packageName,
    businessName: input.businessName,
    businessModel: input.businessModel,
    welcome: `Welcome, ${firstName}. This private brief is for ${input.businessName}. It explains how ${BRAND.programmeName} will work with your selected ${input.packageName} pathway before you move into the rest of your participant portal.`,
    initialPerspective: buildInitialPerspective(input),
    programme: {
      heading: "The advisory engagement",
      body:
        `${BRAND.programmeName} — Strategy & Innovation Genius Track is an applied advisory engagement for one real business, not a generic lecture series. The work is designed to strengthen clarity, improve the quality of decisions, and convert strategic thinking into practical action in your enterprise.`,
      outcomes: [
        "Sharper strategic clarity about what you are building and why it matters",
        "A more disciplined basis for commercial and operating decisions",
        "A clearer view of the business model, market position, growth engine and operating engine",
        "A practical direction for the next phase of work, shaped by your diagnostic responses",
      ],
    },
    journey: [
      "Strategic intent and the decisions that matter now",
      "Business model, revenue logic and commercial choices",
      "Market, positioning and the growth engine",
      "Operating discipline, execution and capacity",
      "Financial resilience and building a durable enterprise",
    ],
    sessionDesign:
      "Each live session is deliberately structured: the room opens 15 minutes early for focused questions, followed by a 60-minute applied masterclass and a 30-minute deep-dive discussion. The emphasis is on using the ideas against your own business, not merely collecting notes.",
    package: access,
    diagnostic:
      `The Current State Assessment is your first step after consent. It adds colour and detail to your application so that ${BRAND.facilitatorFirstName} can understand your founder context, business, market and strategic constraints. Your responses inform the diagnostic and how the engagement is shaped; they do not repeat your registration questions.`,
    calendar: {
      heading: "Programme calendar, recordings and flexibility",
      body:
        `The programme is currently scheduled to open on Friday, 4 September 2026. The live calendar and eligible session slots will be available within this portal. ${BRAND.facilitatorFirstName} will communicate any unforeseen schedule adjustment at least 72 hours in advance and advise the rescheduled date. Every call will be recorded for participants who miss a session, and an additional make-up class may be arranged where there is significant absence. The process is designed to be flexible while retaining the rigour of the work.`,
    },
    payment: {
      fullFee: naira(fee),
      commitment: naira(fee * 0.4),
      second: naira(fee * 0.3),
      final: naira(fee * 0.3),
      upfront: naira(fee * 0.9),
      body: `Your selected ${input.packageName} package is ${naira(fee)}. The standard payment schedule is a 40% commitment payment of ${naira(fee * 0.4)} before classes begin, 30% (${naira(fee * 0.3)}) by the end of September, and the final 30% (${naira(fee * 0.3)}) by mid-October. A 10% full-upfront discount makes the total ${naira(fee * 0.9)}. Direct-transfer instructions will be confirmed by ${BRAND.facilitatorFirstName}, while a Paystack payment route for international payments will be made available before the end of the week.`,
    },
    technicalSupport:
      `This portal was designed specifically for ${BRAND.programmeName} and will continue to improve during the programme. We are transparent that new technology can occasionally have glitches. If you experience a difficulty, kindly take a screenshot and email ${BRAND.facilitatorFirstName} directly. He reads every participant email and will have the technical team investigate promptly.`,
    consentStatement:
      `I confirm that I have read this personalised ${BRAND.programmeName} engagement brief, understand my selected package and the published payment, recording, scheduling and portal-support arrangements, and consent to proceed to the next steps in my participant portal.`,
  };
}

export function buildConsentConfirmationEmail(input: BriefInput & { acknowledgedAt: Date }) {
  const brief = getEngagementBrief(input);
  const date = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(input.acknowledgedAt);

  return {
    subject: `${BRAND.programmeName} — Your engagement brief acknowledgement`,
    body: `Dear ${brief.firstName},\n\nI trust this meets you well and in good health.\n\nThis email confirms that on ${date} you read and acknowledged version ${brief.version} of your personalised ${BRAND.programmeName} engagement brief for ${brief.businessName}. Your selected pathway is ${brief.selectedPackage}.\n\nYour private payment guidance remains available in your participant portal. Your Current State Assessment is now open, and eligible session scheduling will open after the 40% commitment payment is confirmed. The assessment is the first step in adding the detail that will shape the advisory work around your business.\n\nIf you encounter any technical difficulty, kindly take a screenshot and email ${BRAND.facilitatorFirstName} directly. He reads every participant email and will ensure the technical team reviews it.\n\nWarm regards,\n\n${BRAND.facilitatorName}\nFacilitator, ${BRAND.programmeName} — Strategy & Innovation Genius Track`,
    html: buildBrandedEmailHtml({
      label: `${brief.selectedPackage} engagement`,
      title: "Your engagement brief is acknowledged",
      preheader: `Your personalised ${BRAND.programmeName} engagement brief acknowledgement is recorded.`,
      greeting: `Dear ${brief.firstName},\n\nI trust this meets you well and in good health.`,
      paragraphs: [
        `This email confirms that on ${date} you read and acknowledged version ${brief.version} of your personalised ${BRAND.programmeName} engagement brief for ${brief.businessName}.`,
        "Your private payment guidance remains available in your participant portal. Your Current State Assessment is now open, and eligible session scheduling will open after the 40% commitment payment is confirmed. The assessment is the first step in adding the detail that will shape the advisory work around your business.",
      ],
      details: [
        { label: "Selected pathway", value: brief.selectedPackage },
        { label: "Engagement brief version", value: brief.version },
      ],
      footerNote: `If you encounter a technical difficulty, kindly take a screenshot and email ${BRAND.facilitatorFirstName} directly. He reads every participant email and will ensure the technical team reviews it.`,
    }),
  };
}
