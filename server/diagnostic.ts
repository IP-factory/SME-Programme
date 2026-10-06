import { z } from "zod";

export const diagnosticInputSchema = z.object({
  businessAge: z.enum(["Idea stage, not trading yet", "Less than a year", "1 to 3 years", "3 to 7 years", "7 to 15 years", "More than 15 years"]),
  revenueBand: z.enum(["No revenue yet", "Under ₦10m", "₦10m to ₦50m", "₦50m to ₦250m", "₦250m to ₦1bn", "Above ₦1bn", "I would rather not say"]),
  teamSize: z.enum(["Just me", "2 to 5", "6 to 20", "21 to 50", "51 to 200", "More than 200"]),
  trajectory: z.enum(["Growing fast", "Growing steadily", "Flat, stuck at the same level", "Declining", "Too early to tell"]),
  moneyMechanism: z.enum(["I turn input into units, I make things", "I buy, move and sell, I trade things", "I sell expertise, something you cannot hold", "A mix, and I am not sure which dominates"]),
  primaryConstraint: z.enum(["Not enough customers", "We sell, but we do not make money", "Cash is always tight", "Everything runs through me", "We cannot deliver consistently", "We have no plan, just activity", "We are stuck at a ceiling", "Something else"]),
  weakAreas: z.array(z.enum(["Strategy and direction", "Business model and pricing", "Market and competition", "Brand, marketing and sales", "Operations and systems", "Finance, cash and funding", "People and organisation", "Risk and what could go wrong", "Exit and succession"])).length(2),
  urgency: z.enum(["We are in trouble now", "A big decision in the next 90 days", "Building towards next year", "I simply want to learn this properly"]),
  packageInterest: z.enum(["Foundation", "Engine Room", "Boardroom", "Not sure yet"]),
  boardroomDecision: z.string().max(1000).optional(),
  source: z.enum(["A past participant", "Emmanuel directly", "LinkedIn", "WhatsApp", "Instagram or Facebook", "Somewhere else"]),
  consent: z.literal(true),
});

export type DiagnosticInput = z.infer<typeof diagnosticInputSchema>;

const constraintMeaning: Record<DiagnosticInput["primaryConstraint"], string> = {
  "Not enough customers": "Before we add customers we check whether the ones you already have are profitable. Growth on a broken model only loses money faster.",
  "We sell, but we do not make money": "This is almost always a pricing and unit-economics problem wearing a sales costume. More salespeople will not fix it.",
  "Cash is always tight": "Profit and cash are different things. Most businesses that fail were profitable on paper the month before they stopped.",
  "Everything runs through me": "Founder dependency is a question of organisational design and decision rights. It is not a question of discipline or effort.",
  "We cannot deliver consistently": "Consistency is a process and capacity question long before it is an effort question.",
  "We have no plan, just activity": "Activity without a plan feels productive, which is exactly what makes it the most expensive habit in business.",
  "We are stuck at a ceiling": "A ceiling is usually the model, not the market. The same model rarely carries a business through two orders of magnitude.",
  "Something else": "We will start by finding the real constraint, which is precisely what the first class is for.",
};

const weakAreaClass: Record<DiagnosticInput["weakAreas"][number], string> = {
  "Strategy and direction": "01 · Clarity",
  "Business model and pricing": "02 · The Business Model",
  "Market and competition": "02 · The Business Model",
  "Brand, marketing and sales": "03 · The Growth Engine",
  "Operations and systems": "04 · The Operating Engine",
  "People and organisation": "04 · The Operating Engine",
  "Finance, cash and funding": "05 · A Durable Business",
  "Risk and what could go wrong": "05 · A Durable Business",
  "Exit and succession": "05 · A Durable Business",
};

const constraintClass: Record<DiagnosticInput["primaryConstraint"], string> = {
  "Not enough customers": "03 · The Growth Engine",
  "We sell, but we do not make money": "03 · The Growth Engine",
  "Cash is always tight": "05 · A Durable Business",
  "Everything runs through me": "04 · The Operating Engine",
  "We cannot deliver consistently": "04 · The Operating Engine",
  "We have no plan, just activity": "01 · Clarity",
  "We are stuck at a ceiling": "02 · The Business Model",
  "Something else": "01 · Clarity",
};

export type DiagnosticReadout = {
  stage: "Pre-launch" | "Early days" | "Under pressure" | "Plateaued" | "Scaling" | "Established and steady";
  engineRoom: "Makers" | "Traders" | "Experts" | "To be placed after a short conversation";
  constraint: string;
  constraintMeaning: string;
  classes: [string, string];
  urgencyLine?: string;
};

export function deriveStage(input: Pick<DiagnosticInput, "businessAge" | "revenueBand" | "trajectory">): DiagnosticReadout["stage"] {
  if (input.businessAge === "Idea stage, not trading yet" || input.revenueBand === "No revenue yet") return "Pre-launch";
  if (input.businessAge === "Less than a year") return "Early days";
  if (input.trajectory === "Declining") return "Under pressure";
  if (input.trajectory === "Flat, stuck at the same level") return "Plateaued";
  if (input.trajectory === "Growing fast") return "Scaling";
  return "Established and steady";
}

export function deriveEngineRoom(moneyMechanism: DiagnosticInput["moneyMechanism"]): DiagnosticReadout["engineRoom"] {
  if (moneyMechanism === "I turn input into units, I make things") return "Makers";
  if (moneyMechanism === "I buy, move and sell, I trade things") return "Traders";
  if (moneyMechanism === "I sell expertise, something you cannot hold") return "Experts";
  return "To be placed after a short conversation";
}

export function deriveDiagnostic(input: DiagnosticInput): DiagnosticReadout {
  const secondaryClass = weakAreaClass[input.weakAreas[0]] === constraintClass[input.primaryConstraint]
    ? weakAreaClass[input.weakAreas[1]]
    : weakAreaClass[input.weakAreas[0]];
  const urgencyLine = input.urgency === "We are in trouble now"
    ? "Do not wait for the reply email; put this in your note and we will call you."
    : input.urgency === "A big decision in the next 90 days"
      ? "With a decision that close, the Boardroom track is the one built for you."
      : undefined;

  return {
    stage: deriveStage(input),
    engineRoom: deriveEngineRoom(input.moneyMechanism),
    constraint: input.primaryConstraint,
    constraintMeaning: constraintMeaning[input.primaryConstraint],
    classes: [constraintClass[input.primaryConstraint], secondaryClass] as [string, string],
    urgencyLine,
  };
}
