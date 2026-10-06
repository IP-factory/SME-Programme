import { writeFile } from "node:fs/promises";
import { ENV } from "../server/_core/env";

const authorizationCode = process.argv[2];
if (!authorizationCode) throw new Error("An OAuth authorization code is required.");

const response = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    code: authorizationCode,
    client_id: ENV.googleClientId,
    client_secret: ENV.googleClientSecret,
    redirect_uri: "https://developers.google.com/oauthplayground",
    grant_type: "authorization_code",
  }),
});
if (!response.ok) throw new Error(`Google jump mailbox authorisation exchange failed (${response.status}): ${await response.text()}`);
const payload = (await response.json()) as { refresh_token?: string; scope?: string };
if (!payload.refresh_token) throw new Error("Google did not return a refresh token. Repeat authorisation with prompt=consent.");
await writeFile("/tmp/jump-mailbox-refresh-token.json", JSON.stringify({ refreshToken: payload.refresh_token, scope: payload.scope ?? "" }, null, 2));
console.log("JUMP mailbox authorisation exchanged successfully.");
