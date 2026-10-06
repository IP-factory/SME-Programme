import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getTrustedApplicationOrigin,
  isPrivateParticipantStorageKey,
  isTrustedBrowserOrigin,
  normalizeStorageProxyKey,
  participantCanReadPrivateStorageKey,
} from "./security";

const participantRouterSource = readFileSync(resolve(process.cwd(), "server/routers/participant.ts"), "utf8");
const registrationRouterSource = readFileSync(resolve(process.cwd(), "server/routers/registration.ts"), "utf8");
const adminRouterSource = readFileSync(resolve(process.cwd(), "server/routers/adminAccess.ts"), "utf8");
const scheduledReminderSource = readFileSync(resolve(process.cwd(), "server/scheduledReminder.ts"), "utf8");

describe("JUMP defensive security controls", () => {
  it("uses an allowlisted production origin rather than a request-controlled host", () => {
    expect(getTrustedApplicationOrigin("production")).toBe("https://emmanueltarfa.com");
    expect(isTrustedBrowserOrigin("https://emmanueltarfa.com", "production")).toBe(true);
    expect(isTrustedBrowserOrigin("https://attacker.example", "production")).toBe(false);
    expect(isTrustedBrowserOrigin("https://3000-example.us2.manus.computer", "development")).toBe(true);
    expect(isTrustedBrowserOrigin("https://attacker.example", "development")).toBe(false);
    expect(adminRouterSource).toContain("getTrustedApplicationOrigin()");
    expect(adminRouterSource).not.toContain("ctx.req.get(\"host\")");
  });

  it("validates private-file keys and limits each participant to their own upload prefixes", () => {
    expect(normalizeStorageProxyKey("participant-assignments/10/report.pdf")).toBe("participant-assignments/10/report.pdf");
    expect(normalizeStorageProxyKey("participant-assignments/%2e%2e/secret.pdf")).toBeNull();
    expect(isPrivateParticipantStorageKey("payment-receipts/10/receipt.pdf")).toBe(true);
    expect(participantCanReadPrivateStorageKey("payment-receipts/10/receipt.pdf", 10)).toBe(true);
    expect(participantCanReadPrivateStorageKey("payment-receipts/10/receipt.pdf", 11)).toBe(false);
  });

  it("binds the legacy consulting endpoints to the authenticated participant, not an input booking token", () => {
    const consultingSection = participantRouterSource.slice(participantRouterSource.indexOf("getConsultingChat:"));
    expect(consultingSection).toContain("const applicant = ctx.participant;");
    expect(consultingSection).not.toContain("eq(registrations.bookingToken, input.token)");
  });

  it("does not mark a payment paid from a simulated or unverified reference", () => {
    const paystackSection = registrationRouterSource.slice(registrationRouterSource.indexOf("initializePaystack:"));
    expect(paystackSection).toContain("PAYSTACK_COMMITMENT_AMOUNTS");
    expect(paystackSection).toContain("data.data?.amount === expectedAmount");
    expect(paystackSection).toContain("providerRegistrationId === input.registrationId");
    expect(paystackSection).not.toContain("input.reference.startsWith(\"jump_sim_\")");
  });

  it("does not expose callback stack traces to the caller", () => {
    const errorSection = scheduledReminderSource.slice(scheduledReminderSource.lastIndexOf("} catch (error)"));
    expect(errorSection).toContain("[Scheduled reminder] Callback failed");
    expect(errorSection).not.toContain("stack:");
    expect(errorSection).not.toContain("String(error)");
  });
});
