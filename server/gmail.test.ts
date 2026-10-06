import { describe, it, expect } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deliverEmail } from "./email";
import { createRawEmail } from "./gmail";

describe("Gmail Delivery Module", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "test");
  });

  it("should simulate delivery or handle missing credentials gracefully", async () => {
    const result = await deliverEmail({
      to: "test@example.com",
      subject: "JUMP Test Email",
      body: "Hello from JUMP 2026 testing suite.",
    });
    expect(result).toBeDefined();
    expect(["Sent", "Simulated", "Failed"]).toContain(result.status);
  });

  it("keeps the recipient header before the MIME header/body separator", () => {
    const raw = createRawEmail({
      to: "participant@example.com",
      bcc: "owner@example.com",
      subject: "Secure sign-in link",
      body: "A one-time link is ready.",
      replyTo: "admin@emmanueltarfa.com",
    });
    const decoded = Buffer.from(raw.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const headerEnd = decoded.indexOf("\r\n\r\n");

    expect(decoded.indexOf("To: participant@example.com")).toBeGreaterThan(-1);
    expect(decoded.indexOf("To: participant@example.com")).toBeLessThan(headerEnd);
    expect(decoded).toContain("Bcc: owner@example.com\r\nTo: participant@example.com");
  });

  it("retains every monitoring recipient in a two-address blind-copy header", () => {
    const raw = createRawEmail({
      to: "participant@example.com",
      bcc: ["owner@example.com", "records@example.com"],
      subject: "Private portal invitation",
      body: "Your private portal is ready.",
    });
    const decoded = Buffer.from(raw.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");

    expect(decoded).toContain("Bcc: owner@example.com, records@example.com");
  });

  it("creates a multipart alternative email when an HTML version is provided", () => {
    const raw = createRawEmail({
      to: "participant@example.com",
      subject: "JUMP 2026 registration received",
      body: "Plain-text fallback.",
      html: "<p>Polished mobile email.</p>",
    });
    const decoded = Buffer.from(raw.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");

    expect(decoded).toContain("Content-Type: multipart/alternative");
    expect(decoded).toContain("Content-Type: text/plain; charset=UTF-8");
    expect(decoded).toContain("Content-Type: text/html; charset=UTF-8");
    expect(decoded).toContain("Plain-text fallback.");
    expect(decoded).toContain("<p>Polished mobile email.</p>");
  });

  it("nests the text and HTML alternatives correctly when a calendar invite is attached", () => {
    const raw = createRawEmail({
      to: "participant@example.com",
      subject: "Session reminder",
      body: "Plain-text reminder.",
      html: "<p>HTML reminder.</p>",
      icsContent: "BEGIN:VCALENDAR\r\nEND:VCALENDAR",
    });
    const decoded = Buffer.from(raw.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");

    expect(decoded).toContain("Content-Type: multipart/mixed");
    expect(decoded).toContain("Content-Type: multipart/alternative");
    expect(decoded).toContain("Content-Type: text/calendar; charset=UTF-8; method=REQUEST");
    expect(decoded).toContain("<p>HTML reminder.</p>");
  });
});
