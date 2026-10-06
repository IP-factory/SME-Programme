import { ENV } from "../server/_core/env";

async function main() {
  if (!ENV.googleClientId || !ENV.googleClientSecret || !ENV.googleRefreshToken) {
    throw new Error("Google OAuth credentials are not configured.");
  }
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      refresh_token: ENV.googleRefreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!tokenResponse.ok) throw new Error(`Google token refresh failed (${tokenResponse.status}).`);
  const token = (await tokenResponse.json()) as { access_token?: string };
  if (!token.access_token) throw new Error("Google token response did not contain an access token.");
  const profileResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: { authorization: `Bearer ${token.access_token}` },
  });
  if (!profileResponse.ok) throw new Error(`Gmail profile lookup failed (${profileResponse.status}).`);
  const profile = (await profileResponse.json()) as { emailAddress?: string };
  console.log(JSON.stringify({ mailbox: profile.emailAddress ?? null }));
}

void main();
