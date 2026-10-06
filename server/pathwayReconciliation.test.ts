import { describe, expect, it } from "vitest";
import {
  normaliseParticipantIdentity,
  pathwaySupersedes,
  sameParticipantIdentity,
  selectHighestPathway,
} from "../shared/pathwayReconciliation";

describe("participant pathway reconciliation", () => {
  it("retains the highest selected pathway for a multi-pathway participant", () => {
    expect(selectHighestPathway(["Foundation", "Engine Room", "Boardroom"])).toBe("Boardroom");
    expect(selectHighestPathway(["Foundation", "Engine Room"])).toBe("Engine Room");
    expect(pathwaySupersedes("Boardroom", "Foundation")).toBe(true);
    expect(pathwaySupersedes("Foundation", "Boardroom")).toBe(false);
  });

  it("recognises an existing participant despite casing, punctuation, spacing, or a second email address", () => {
    expect(normaliseParticipantIdentity("Marcelle Crown Studio 🍀👑")).toBe("marcellecrownstudio");
    expect(sameParticipantIdentity(
      { email: "marcellecrownstudio@gmail.com", fullName: "Marcelle  Tiogo", businessName: "Marcelle Crown Studio 🍀👑" },
      { email: "different-address@example.com", fullName: "Marcelle Tiogo", businessName: "Marcelle Crown Studio" },
    )).toBe(true);
  });
});
