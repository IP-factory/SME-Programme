import { describe, expect, it } from "vitest";
import {
  PARTICIPANT_PASSWORD_MIN_LENGTH,
  buildParticipantPasswordLinkEmail,
  buildParticipantPasswordUrl,
  hashParticipantPassword,
  normalizeParticipantEmail,
  validateParticipantPassword,
  verifyParticipantPasswordHash,
} from "./participantAuth";

describe("participant password authentication", () => {
  it("normalizes participant email addresses before lookup so stored casing does not block access", () => {
    expect(normalizeParticipantEmail("  TobiBloomStudio@Example.com ")).toBe("tobibloomstudio@example.com");
    expect(normalizeParticipantEmail("tobibloomstudio@example.com")).toBe("tobibloomstudio@example.com");
  });

  it("accepts any five-character password and rejects only shorter credentials", () => {
    expect(validateParticipantPassword("hello")).toBeNull();
    expect(validateParticipantPassword("12345")).toBeNull();
    expect(validateParticipantPassword("word!")).toBeNull();
    expect(validateParticipantPassword("four")).toBe(`Use at least ${PARTICIPANT_PASSWORD_MIN_LENGTH} characters.`);
  });

  it("hashes passwords with a salted scrypt representation and verifies without accepting the wrong password", () => {
    const hash = hashParticipantPassword("StrongPass123!");
    expect(hash).toMatch(/^scrypt\$[^$]+\$[^$]+$/);
    expect(verifyParticipantPasswordHash("StrongPass123!", hash)).toBe(true);
    expect(verifyParticipantPasswordHash("WrongPass123!", hash)).toBe(false);
  });

  it("builds a password-only secure link and makes the setup purpose explicit", () => {
    const link = buildParticipantPasswordUrl("https://emmanueltarfa.com", "password-token");
    const email = buildParticipantPasswordLinkEmail("Amina Example", link, "setup");
    expect(link).toBe("https://emmanueltarfa.com/portal/password?token=password-token");
    expect(email.subject).toContain("Set your JUMP 2026 participant password");
    expect(email.body).toContain("expires in 20 minutes");
    expect(email.body).toContain("sign in normally");
    expect(email.body).not.toContain("bookingToken");
  });

  it("does not reveal whether an account lacks a password through the credential verifier", () => {
    const hash = hashParticipantPassword("StrongPass123!");
    expect(verifyParticipantPasswordHash("A different password", hash)).toBe(false);
  });
});
