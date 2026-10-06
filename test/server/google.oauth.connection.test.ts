import { describe, expect, it } from "vitest";

// Live Google call: runs only when explicitly opted in (VALIDATE_GOOGLE_CALENDAR=1) and credentials exist.
const hasGoogleCredentials = Boolean(
  process.env.VALIDATE_GOOGLE_CALENDAR === "1" &&
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN,
);

describe("Google OAuth background connection", () => {
  it.skipIf(!hasGoogleCredentials)("refreshes an access token with the approved Calendar scopes", async () => {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
        grant_type: "refresh_token",
      }),
    });

    const payload = (await response.json()) as {
      access_token?: string;
      scope?: string;
      error?: string;
    };

    expect(response.ok, payload.error ?? "Google OAuth token refresh failed").toBe(true);
    expect(payload.access_token).toBeTruthy();
    expect(payload.scope).toContain("https://www.googleapis.com/auth/calendar.events");
  });
});
