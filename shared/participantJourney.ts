export type AssessmentJourneyStatus = "Not started" | "In progress" | "Complete";
export type ReceiptJourneyStatus = "No receipt" | "Receipt submitted" | "Receipt confirmed" | "Receipt declined";
export type PaymentJourneyStatus = "Awaiting payment" | "Deposit confirmed" | "Part payment confirmed" | "Paid in full";

type PaymentMilestoneStatus = "Pending" | "Paid";
type ApplicationDecision = "Pending" | "Accepted" | "Rejected" | "Waitlisted";
type ReceiptReviewStatus = "Submitted" | "Confirmed" | "Declined";

export interface ParticipantJourneyInput {
  applicationStatus: ApplicationDecision;
  depositPaid: PaymentMilestoneStatus;
  instalment1: PaymentMilestoneStatus;
  instalment2: PaymentMilestoneStatus;
  assessmentStatus?: "Draft" | "Submitted" | null;
  receiptStatuses: ReceiptReviewStatus[];
}

export interface ParticipantJourneySummary {
  assessment: AssessmentJourneyStatus;
  receipt: ReceiptJourneyStatus;
  payment: PaymentJourneyStatus;
  nextAction: string;
}

export function deriveParticipantJourney(input: ParticipantJourneyInput): ParticipantJourneySummary {
  const assessment: AssessmentJourneyStatus = input.assessmentStatus === "Submitted"
    ? "Complete"
    : input.assessmentStatus === "Draft"
      ? "In progress"
      : "Not started";

  const receipt: ReceiptJourneyStatus = input.receiptStatuses.includes("Confirmed")
    ? "Receipt confirmed"
    : input.receiptStatuses.includes("Submitted")
      ? "Receipt submitted"
      : input.receiptStatuses.includes("Declined")
        ? "Receipt declined"
        : "No receipt";

  const paidMilestones = [input.depositPaid, input.instalment1, input.instalment2].filter((status) => status === "Paid").length;
  const payment: PaymentJourneyStatus = paidMilestones === 3
    ? "Paid in full"
    : input.depositPaid === "Paid"
      ? paidMilestones > 1 ? "Part payment confirmed" : "Deposit confirmed"
      : "Awaiting payment";

  const nextAction = input.applicationStatus === "Pending"
    ? "Review application"
    : input.applicationStatus === "Waitlisted"
      ? "Decision recorded — waitlisted"
      : input.applicationStatus === "Rejected"
        ? "Decision recorded — not proceeding"
        : assessment !== "Complete"
          ? "Await Current State Assessment"
          : receipt === "Receipt submitted"
            ? "Review payment receipt"
            : receipt === "Receipt declined"
              ? "Await replacement receipt"
              : payment === "Paid in full"
                ? "Ready for scheduling"
                : receipt === "No receipt"
                  ? "Await payment receipt"
                  : "Confirm payment milestone";

  return { assessment, receipt, payment, nextAction };
}
