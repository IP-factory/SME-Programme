import { ENV } from "../server/_core/env";

const redirectUri = "https://developers.google.com/oauthplayground";
const scopes = [
  "https://www.googleapis.com/auth/gmail.readonly",
].join(" ");

if (!ENV.googleClientId) throw new Error("Google OAuth client ID is not configured.");

const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
url.searchParams.set("client_id", ENV.googleClientId);
url.searchParams.set("redirect_uri", redirectUri);
url.searchParams.set("response_type", "code");
url.searchParams.set("scope", scopes);
url.searchParams.set("access_type", "offline");
url.searchParams.set("prompt", "consent");
url.searchParams.set("login_hint", "jump@emmanueltarfa.com");

console.log(url.toString());
