import { describe, expect, it } from "vitest";
import {
  normaliseParticipantIdentity,
  pathwaySupersedes,
  sameParticipantIdentity,
  selectHighestPathway,
} from "@shared/pathwayReconciliation";

describe("participant pathway reconciliation", () => {
  it("retains the highest selected pathway for a multi-pathway participant", () => {
    expect(selectHighestPathway(["Foundation", "Engine Room", "Boardroom"])).toBe("Boardroom");
    expect(selectHighestPathway(["Foundation", "Engine Room"])).toBe("Engine Room");
    expect(pathwaySupersedes("Boardroom", "Foundation")).toBe(true);
    expect(pathwaySupersedes("Foundation", "Boardroom")).toBe(false);
  });

  it("recognises an existing participant despite casing, punctuation, spacing, or a second email address", () => {
    expect(normaliseParticipantIdentity("Tobi Bloom Studio 🍀👑")).toBe("tobibloomstudio");
    expect(sameParticipantIdentity(
      { email: "tobibloomstudio@example.com", fullName: "Tobi  Adeyemi", businessName: "Tobi Bloom Studio 🍀👑" },
      { email: "different-address@example.com", fullName: "Tobi Adeyemi", businessName: "Tobi Bloom Studio" },
    )).toBe(true);
  });
});
