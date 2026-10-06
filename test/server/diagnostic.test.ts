import { describe, expect, it } from "vitest";
import { deriveDiagnostic, deriveEngineRoom, deriveStage, type DiagnosticInput } from "@server/diagnostic";

const baseInput: DiagnosticInput = {
  businessAge: "3 to 7 years",
  revenueBand: "₦10m to ₦50m",
  teamSize: "6 to 20",
  trajectory: "Growing steadily",
  moneyMechanism: "I turn input into units, I make things",
  primaryConstraint: "Cash is always tight",
  weakAreas: ["Strategy and direction", "Finance, cash and funding"],
  urgency: "A big decision in the next 90 days",
  packageInterest: "Boardroom",
  boardroomDecision: "Whether to open a second location",
  source: "LinkedIn",
  consent: true,
};

describe("JUMP diagnostic mirror", () => {
  it("applies the stage precedence rules", () => {
    expect(deriveStage({ businessAge: "Idea stage, not trading yet", revenueBand: "₦10m to ₦50m", trajectory: "Growing fast" })).toBe("Pre-launch");
    expect(deriveStage({ businessAge: "3 to 7 years", revenueBand: "₦10m to ₦50m", trajectory: "Declining" })).toBe("Under pressure");
    expect(deriveStage({ businessAge: "3 to 7 years", revenueBand: "₦10m to ₦50m", trajectory: "Flat, stuck at the same level" })).toBe("Plateaued");
    expect(deriveStage({ businessAge: "3 to 7 years", revenueBand: "₦10m to ₦50m", trajectory: "Growing fast" })).toBe("Scaling");
  });

  it("maps business mechanics to the Engine Room", () => {
    expect(deriveEngineRoom("I buy, move and sell, I trade things")).toBe("Traders");
    expect(deriveEngineRoom("I sell expertise, something you cannot hold")).toBe("Experts");
    expect(deriveEngineRoom("A mix, and I am not sure which dominates")).toBe("To be placed after a short conversation");
  });

  it("reflects the primary constraint and recommends two classes", () => {
    const readout = deriveDiagnostic(baseInput);
    expect(readout.stage).toBe("Established and steady");
    expect(readout.engineRoom).toBe("Makers");
    expect(readout.constraintMeaning).toContain("Profit and cash are different things");
    expect(readout.classes).toEqual(["05 · A Durable Business", "01 · Clarity"]);
    expect(readout.urgencyLine).toContain("Boardroom");
  });
});
