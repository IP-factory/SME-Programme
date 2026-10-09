import { afterEach, describe, expect, it } from "vitest";
import { ENV } from "@server/_core/env";
import { BUSINESS_SUPPORT_SENDER, getBusinessSupportSender, JUMP_PROGRAMME_MAILBOX, JUMP_PROGRAMME_SENDER, resendRequestBody } from "@server/email";

describe("Business Support (business check) email sender", () => {
  it("sends as IP Factory from info@ipfactory.co by default", () => {
    expect(BUSINESS_SUPPORT_SENDER).toBe("IP Factory <info@ipfactory.co>");
    expect(getBusinessSupportSender("")).toBe(BUSINESS_SUPPORT_SENDER);
  });

  it("uses EMAIL_FROM, such as Resend's test address before ipfactory.co is verified", () => {
    expect(getBusinessSupportSender("IP Factory <onboarding@resend.dev>")).toBe("IP Factory <onboarding@resend.dev>");
    expect(getBusinessSupportSender(" IP Factory \\u003cinfo@ipfactory.co\\u003e ")).toBe("IP Factory <info@ipfactory.co>");
  });

  it("ignores a leftover JUMP or personal sender", () => {
    expect(getBusinessSupportSender("Emmanuel Tarfa | JUMP 2026 <jump@emmanueltarfa.com>")).toBe(BUSINESS_SUPPORT_SENDER);
    expect(getBusinessSupportSender("admin@emmanueltarfa.com")).toBe(BUSINESS_SUPPORT_SENDER);
  });
});

describe("the Resend request", () => {
  const original = ENV.emailFrom;
  afterEach(() => {
    ENV.emailFrom = original;
  });

  it("sends business check email from EMAIL_FROM with replies to info@ipfactory.co", () => {
    ENV.emailFrom = "IP Factory <onboarding@resend.dev>";
    const body = resendRequestBody({ to: "ada@example.com", subject: "Your business check", body: "Hello", sender: "business_support" });
    expect(body).toMatchObject({ from: "IP Factory <onboarding@resend.dev>", to: ["ada@example.com"], reply_to: "info@ipfactory.co", subject: "Your business check", text: "Hello" });
    expect(body.html).toContain("Hello");
  });

  it("lays out business check email as The Shift, by IP Factory, not as JUMP", () => {
    const body = resendRequestBody({ to: "info@ipfactory.co", subject: "Business check", body: "Ada Example asked for the full business check report.\n\nEmail: ada@example.com\nBusiness: Example Stores", sender: "business_support" });
    expect(body.html).toContain("The Shift");
    expect(body.html).toContain("by IP Factory");
    expect(body.html).toContain("info@ipfactory.co");
    expect(body.html).not.toMatch(/JUMP|Genius Track|Emmanuel Tarfa/);
  });

  it("keeps an HTML version the caller wrote", () => {
    expect(resendRequestBody({ to: "ada@example.com", subject: "Hi", body: "Hello", html: "<p>Own</p>", sender: "business_support" }).html).toBe("<p>Own</p>");
  });

  it("keeps JUMP programme email on the JUMP mailbox whatever EMAIL_FROM says", () => {
    ENV.emailFrom = "IP Factory <onboarding@resend.dev>";
    const body = resendRequestBody({ to: "participant@example.com", subject: "JUMP", body: "Hello" });
    expect(body.from).toBe(JUMP_PROGRAMME_SENDER);
    expect(body.reply_to).toBe(JUMP_PROGRAMME_MAILBOX);
    expect(body.html).toContain("JUMP 2026");
  });
});
