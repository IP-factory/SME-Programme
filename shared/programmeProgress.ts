export type ProgrammeMilestoneState = "complete" | "available" | "locked";

export type ProgrammeMilestone = {
  title: string;
  state: ProgrammeMilestoneState;
  note: string;
};

export type ProgrammeSession = {
  title: string;
  focus: string;
};

export const participantTechnicalSupportNotice = "This portal was designed for JUMP 2026 and is continually being improved. If you encounter any technical issue, kindly take a screenshot and email Emmanuel directly. He reads every participant email and will have the technical team review it.";

export const programmeSessions: ProgrammeSession[] = [
  { title: "Class 1 · Clarity", focus: "Strategic intent and the decisions that matter now" },
  { title: "Class 2 · The Business Model", focus: "Revenue logic, commercial choices and the model underneath growth" },
  { title: "Class 3 · The Growth Engine", focus: "Market, positioning and the practical route to demand" },
  { title: "Class 4 · The Operating Engine", focus: "Operating discipline, execution and organisational capacity" },
  { title: "Class 5 · A Durable Business", focus: "Financial resilience, risk and the foundations for durability" },
];

export const programmeFormat = {
  heading: "How the engagement works",
  body: "The five sessions are one connected advisory journey. Start by completing your Current State Assessment after consent; this adds depth to your registration and helps Emmanuel focus the discussion. Payment guidance is available in parallel, while eligible calendar slots open once the 40% commitment is confirmed. Each live session includes focused questions, applied teaching and a deep-dive discussion; recordings are released afterwards.",
};

export type ProgrammePathway = "Foundation" | "Engine Room" | "Boardroom";

export const programmePathwayDelivery: Record<ProgrammePathway, { label: string; title: string; body: string; inclusions: readonly string[] }> = {
  Foundation: {
    label: "Foundation group engagement",
    title: "You will work in the Foundation cohort",
    body: "Foundation is a shared advisory experience. You will join the other Foundation participants for the five core group sessions, working through the common strategic questions while applying them to your own business.",
    inclusions: ["Five shared Foundation group sessions", "A personalised engagement brief and opening diagnostic", "Class materials, recordings, and recommendations in this portal"],
  },
  "Engine Room": {
    label: "Foundation + Engine Room working sessions",
    title: "You have the Foundation journey plus deeper working sessions",
    body: "Engine Room includes the full shared Foundation experience, followed by the additional Engine Room working sessions for participants who need more time to translate insight into operating choices.",
    inclusions: ["Everything in Foundation", "Additional Engine Room working sessions", "A more detailed operating-focus advisory layer"],
  },
  Boardroom: {
    label: "Full advisory pathway",
    title: "You have the complete Foundation, Engine Room, and Boardroom pathway",
    body: "Boardroom brings together the shared Foundation journey, the additional Engine Room work, and dedicated Boardroom advisory time. Its private Boardroom sessions are distinct from the shared Foundation classes.",
    inclusions: ["Everything in Foundation and Engine Room", "Dedicated Boardroom advisory sessions", "A private decision-making layer for your business"],
  },
};

export function getGettingStartedMilestones(briefAcknowledged: boolean): ProgrammeMilestone[] {
  return [
    { title: "Registered", state: "complete", note: "Your place is recorded." },
    { title: "Read your engagement brief", state: briefAcknowledged ? "complete" : "available", note: briefAcknowledged ? "Your personalised brief has been acknowledged." : "Your personalised brief is ready below." },
    { title: "Complete the Current State Assessment", state: briefAcknowledged ? "available" : "locked", note: briefAcknowledged ? "Available now after consent; it does not wait for payment." : "Available once you have read and consented to your engagement brief." },
    { title: "Review payment guidance", state: "available", note: "Available now in your private portal. A 40% commitment unlocks session selection." },
    { title: "Choose eligible session slots", state: "locked", note: "Opens after the 40% commitment payment is confirmed." },
  ];
}
