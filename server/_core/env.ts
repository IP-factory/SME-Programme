import { BRAND } from "../../shared/brand";
function originOf(value: string) {
  return new URL(value).origin;
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? `${BRAND.senderDisplayName} <${BRAND.administrationMailbox}>`,
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN ?? "",
  jumpGmailRefreshToken: process.env.JUMP_GMAIL_REFRESH_TOKEN ?? "",
  googleCalendarId: process.env.GOOGLE_CALENDAR_ID ?? "primary",
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY ?? "",
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY ?? "",
  /** Canonical public origin (scheme + host) used for emailed links and CSRF checks in production. */
  appOrigin: originOf(process.env.APP_ORIGIN ?? "https://emmanueltarfa.com"),
  /** Further production origins accepted for browser requests, comma-separated (e.g. the www host). */
  appAlternateOrigins: (process.env.APP_ALTERNATE_ORIGINS ?? "https://www.emmanueltarfa.com")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map(originOf),
  /** Email address of the permanent Super Admin. */
  ownerAdminEmail: (process.env.OWNER_ADMIN_EMAIL ?? "emmanueltarfa@gmail.com").trim().toLowerCase(),
  emailReplyTo: process.env.EMAIL_REPLY_TO ?? BRAND.administrationMailbox,
};
