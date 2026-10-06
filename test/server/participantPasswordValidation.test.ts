import { describe, expect, it } from "vitest";
import { getParticipantPasswordRecoveryMessage, validateParticipantPassword } from "@/lib/participantPasswordValidation";

describe("participant password validation", () => {
  it("explains the five-character minimum before a request is made", () => {
    expect(validateParticipantPassword("four", "four")).toBe("Your password needs at least 5 characters.");
  });

  it("accepts a five-letter word without requiring character variety", () => {
    expect(validateParticipantPassword("hello", "hello")).toBeNull();
  });

  it("explains a confirmation mismatch", () => {
    expect(validateParticipantPassword("ValidPassword1", "ValidPassword2")).toContain("do not match");
  });

  it("does not expose raw Zod validation data to participants", () => {
    expect(getParticipantPasswordRecoveryMessage('[{"code":"too_small","minimum":5}]')).toBe("Your password needs at least 5 characters. Please update both fields and try again.");
  });
});
