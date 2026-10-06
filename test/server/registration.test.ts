import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BOARDROOM_CAPACITY, buildRegistrationInsertFields, registrationInputSchema, registrationStatusForBoardroom } from "@server/routers/registration";

const registrationRouterSource = readFileSync(resolve(process.cwd(), "server/routers/registration.ts"), "utf8");
const participantAuthSource = readFileSync(resolve(process.cwd(), "server/participantAuth.ts"), "utf8");

describe("JUMP registration rules", () => {
  it("keeps the exact public option labels", () => {
    const result = registrationInputSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+234 800 000 0000",
      businessName: "Analytical Engines",
      businessDescription: "A business building practical tools for operators.",
      businessModel: "Maker",
      package: "Engine Room",
      question: "What should I prepare?",
    });

    expect(result.success).toBe(true);
  });

  it("rejects unsupported business model and package values", () => {
    const result = registrationInputSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+234 800 000 0000",
      businessName: "Analytical Engines",
      businessDescription: "A business building practical tools for operators.",
      businessModel: "Builder",
      package: "Premier",
    });

    expect(result.success).toBe(false);
  });

  it("keeps Boardroom open below eight and waitlists at eight", () => {
    expect(BOARDROOM_CAPACITY).toBe(8);
    expect(registrationStatusForBoardroom(7)).toBe("Pending");
    expect(registrationStatusForBoardroom(8)).toBe("Waitlisted");
    expect(registrationStatusForBoardroom(15)).toBe("Waitlisted");
  });

  it("builds the live registration payload with bookingToken rather than the retired portalToken field", () => {
    const input = registrationInputSchema.parse({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+234 800 000 0000",
      businessName: "Analytical Engines",
      businessDescription: "A business building practical tools for operators.",
      businessModel: "Maker",
      package: "Foundation",
    });

    const { registrationFields } = buildRegistrationInsertFields(input, "audit-booking-token");
    expect(registrationFields).toMatchObject({
      email: "ada@example.com",
      bookingToken: "audit-booking-token",
      package: "Foundation",
    });
    expect(registrationFields).not.toHaveProperty("portalToken");
  });

  it("keeps participant password-link and sign-in lookups case-insensitive", () => {
    expect(registrationRouterSource).toContain("normalizeParticipantEmail(row.email) === email");
    expect(participantAuthSource).toContain("normalizeParticipantEmail(record.email) === normalized");
  });
});
