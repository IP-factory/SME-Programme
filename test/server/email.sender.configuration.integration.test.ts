import { describe, expect, it } from "vitest";
import { normalizeEmailHeaderValue } from "@server/email";

// Live Resend call: runs only when explicitly opted in (VALIDATE_RESEND_CREDENTIALS=1) and configuration exists.
const hasResendConfiguration = Boolean(
  process.env.VALIDATE_RESEND_CREDENTIALS === "1" &&
    process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.EMAIL_REPLY_TO,
);

describe("JUMP sender configuration", () => {
  it.skipIf(!hasResendConfiguration)("uses the confirmed JUMP mailbox and reply route with an authenticated Resend account", async () => {
    expect(normalizeEmailHeaderValue(process.env.EMAIL_FROM!)).toBe("Emmanuel Tarfa <jump@emmanueltarfa.com>");
    expect(normalizeEmailHeaderValue(process.env.EMAIL_REPLY_TO!)).toBe("jump@emmanueltarfa.com");

    const response = await fetch("https://api.resend.com/domains", {
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      signal: AbortSignal.timeout(12_000),
    });
    expect(response.ok).toBe(true);
    const payload = await response.json() as { data?: Array<{ name?: string; status?: string }> };
    const programmeDomain = payload.data?.find((domain) => domain.name === "emmanueltarfa.com");
    expect(programmeDomain?.status).toBe("verified");
  }, 15_000);
});
