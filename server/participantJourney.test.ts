import { describe, expect, it } from "vitest";
import { deriveParticipantJourney } from "../shared/participantJourney";

describe("participant journey summary", () => {
  it("keeps receipt review separate from payment confirmation", () => {
    expect(deriveParticipantJourney({
      applicationStatus: "Accepted",
      depositPaid: "Pending",
      instalment1: "Pending",
      instalment2: "Pending",
      assessmentStatus: "Submitted",
      receiptStatuses: ["Submitted"],
    })).toMatchObject({ receipt: "Receipt submitted", payment: "Awaiting payment", nextAction: "Review payment receipt" });
  });

  it("shows assessment work before payment follow-through", () => {
    expect(deriveParticipantJourney({
      applicationStatus: "Accepted",
      depositPaid: "Pending",
      instalment1: "Pending",
      instalment2: "Pending",
      assessmentStatus: "Draft",
      receiptStatuses: [],
    })).toMatchObject({ assessment: "In progress", nextAction: "Await Current State Assessment" });
  });

  it("shows a fully paid participant as ready for scheduling", () => {
    expect(deriveParticipantJourney({
      applicationStatus: "Accepted",
      depositPaid: "Paid",
      instalment1: "Paid",
      instalment2: "Paid",
      assessmentStatus: "Submitted",
      receiptStatuses: ["Confirmed"],
    })).toMatchObject({ payment: "Paid in full", nextAction: "Ready for scheduling" });
  });
});
