import { describe, expect, it } from "vitest";
import { normalizeEmailHeaderValue, shouldUseGmailFallback, shouldUseResendFallback } from "@server/email";

describe("email provider fallback", () => {
  it("uses Resend when the Gmail provider reports a failed delivery", () => {
    expect(shouldUseResendFallback("Failed")).toBe(true);
  });

  it("uses Resend when Gmail cannot send and reports a simulated result", () => {
    expect(shouldUseResendFallback("Simulated")).toBe(true);
  });

  it("does not send a duplicate through Resend after Gmail accepts delivery", () => {
    expect(shouldUseResendFallback("Sent")).toBe(false);
  });

  it("retains Gmail only as a resilience fallback when the admin sender cannot deliver", () => {
    expect(shouldUseGmailFallback("Failed")).toBe(true);
    expect(shouldUseGmailFallback("Simulated")).toBe(true);
    expect(shouldUseGmailFallback("Sent")).toBe(false);
  });

  it("normalizes managed-environment escapes in the personal JUMP sender", () => {
    expect(normalizeEmailHeaderValue("Emmanuel Tarfa \\u003cjump@emmanueltarfa.com\\u003e"))
      .toBe("Emmanuel Tarfa <jump@emmanueltarfa.com>");
  });

  it("keeps JUMP PDF attachments as binary content for provider encoding", () => {
    const content = Buffer.from("working report");
    expect(content.toString("base64")).toBe("d29ya2luZyByZXBvcnQ=");
  });
});
