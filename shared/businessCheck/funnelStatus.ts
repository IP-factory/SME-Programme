import { PIPELINE_LABELS, type PipelineStage } from "./pipeline";

/**
 * What the admin console calls the state of a business check. This is DISPLAY wording only: the stored pipeline stage
 * (shared/businessCheck/pipeline.ts) is unchanged. In particular the stored stage `call_booked` means the owner only
 * REQUESTED a discovery call (nothing is booked until an administrator records a time), so it is shown as
 * "Call requested", or "Call scheduled" once a time has been recorded.
 */
export const FUNNEL_STATUSES = [
  "in_progress",
  "completed",
  "call_requested",
  "call_scheduled",
  "fit",
  "referred",
  "declined",
  "nurture",
  "won",
  "onboarding",
  "onboarded",
] as const;
export type FunnelStatus = (typeof FUNNEL_STATUSES)[number];

/** `tone` only chooses a colour treatment; it carries no meaning of its own. */
export type FunnelTone = "muted" | "neutral" | "attention" | "info" | "positive" | "negative";

export const FUNNEL_STATUS_LABELS: Record<FunnelStatus, { label: string; tone: FunnelTone }> = {
  in_progress: { label: "Check in progress", tone: "muted" },
  completed: { label: "Check completed", tone: "neutral" },
  call_requested: { label: "Call requested", tone: "attention" },
  call_scheduled: { label: "Call scheduled", tone: "info" },
  fit: { label: "Fit", tone: "positive" },
  referred: { label: "Referred", tone: "info" },
  declined: { label: "Declined", tone: "negative" },
  nurture: { label: "Follow up later", tone: "muted" },
  won: { label: "Won", tone: "positive" },
  onboarding: { label: "Onboarding", tone: "info" },
  onboarded: { label: "Onboarded", tone: "positive" },
};

type Dateish = Date | string | null | undefined;

export function funnelStatus(input: {
  pipelineStage: PipelineStage;
  completedAt?: Dateish;
  callScheduledFor?: Dateish;
  /** The state of the check's most recent onboarding invitation, if there is one. */
  invitationStatus?: "pending" | "accepted" | "revoked" | "expired" | null;
}): FunnelStatus {
  // An invitation that is out, or accepted, is the most advanced thing that can be true of a prospect.
  if (input.invitationStatus === "accepted") return "onboarded";
  if (input.invitationStatus === "pending") return "onboarding";
  switch (input.pipelineStage) {
    case "opportunity": return "fit";
    case "referred": return "referred";
    case "lost": return "declined";
    case "nurture": return "nurture";
    case "won": return "won";
    case "call_booked": return input.callScheduledFor ? "call_scheduled" : "call_requested";
    case "qualified_lead": return "completed";
    case "lead": return input.completedAt ? "completed" : "in_progress";
  }
}

/** A fit who has not been sent an onboarding link yet: the next step is Client Onboarding. */
export const isReadyToOnboard = (status: FunnelStatus) => status === "fit";

export const funnelStatusLabel = (status: FunnelStatus) => FUNNEL_STATUS_LABELS[status].label;

/**
 * The name the admin console gives a stored stage (stage tabs, "Move to" buttons, stage history). It is the agreed
 * pipeline name, except `call_booked`, which reads "Call requested" for the reason above: nothing is booked until a time
 * is recorded. Change it here, and only here, once confirmed bookings (e.g. from Calendly) reach the admin console.
 */
export const stageDisplayName = (stage: PipelineStage) => (stage === "call_booked" ? "Call requested" : PIPELINE_LABELS[stage].name);
