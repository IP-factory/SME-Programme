import { ENV } from "./_core/env";
import { buildBusinessSupportEmailHtml, buildPlainTextEmailHtml } from "./emailTemplates";
import { BRAND } from "../shared/brand";

export const JUMP_PROGRAMME_MAILBOX = BRAND.programmeMailbox;
export const JUMP_PROGRAMME_SENDER = `${BRAND.senderDisplayName} <${JUMP_PROGRAMME_MAILBOX}>`;
export const JUMP_ADMINISTRATION_MAILBOX = BRAND.administrationMailbox;
/** Where IP Factory Business Support is told about business checks. Separate from the JUMP programme mailbox. */
export const BUSINESS_SUPPORT_MAILBOX = BRAND.businessSupportMailbox;
/** A single audited copy of each operational JUMP email is retained in the programme administration mailbox. */
export const JUMP_MONITORING_BCC: string[] = [JUMP_ADMINISTRATION_MAILBOX];

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type EmailDeliveryResult =
  | { status: "Sent"; providerMessageId?: string }
  | { status: "Simulated"; reason: "missing_credentials" | "test_sender" }
  | { status: "Failed"; reason: string };

/** Retained for delivery-status reporting compatibility. */
export function shouldUseResendFallback(gmailStatus: EmailDeliveryResult["status"]): boolean {
  return gmailStatus !== "Sent";
}

/** Retained for delivery-status reporting compatibility. */
export function shouldUseGmailFallback(resendStatus: EmailDeliveryResult["status"]): boolean {
  return resendStatus !== "Sent";
}

export function normalizeEmailHeaderValue(value: string): string {
  return value
    .replace(/\\u003c/gi, "<")
    .replace(/\\u003e/gi, ">");
}

/**
 * Participant communication must always originate from the JUMP programme mailbox.
 * A stale admin or personal configuration is deliberately ignored rather than used.
 */
export function getJumpProgrammeSender(configuredFrom = ENV.emailFrom): string {
  const normalised = normalizeEmailHeaderValue(configuredFrom || "");
  const lower = normalised.toLowerCase();
  return lower.includes(`<${JUMP_PROGRAMME_MAILBOX}>`) || lower === JUMP_PROGRAMME_MAILBOX
    ? normalised
    : JUMP_PROGRAMME_SENDER;
}

export function getJumpProgrammeReplyTo(_configuredReplyTo = ENV.emailReplyTo): string {
  return JUMP_PROGRAMME_MAILBOX;
}

/** Default sender for IP Factory Business Support (business check) email. */
export const BUSINESS_SUPPORT_SENDER = `${BRAND.organisationName} <${BUSINESS_SUPPORT_MAILBOX}>`;

/**
 * Business check email is sent as IP Factory, not as the JUMP programme. EMAIL_FROM names the sending address Resend
 * has verified (Resend's test address, onboarding@resend.dev, until ipfactory.co is verified). A leftover JUMP or
 * personal address is ignored in favour of info@ipfactory.co.
 */
export function getBusinessSupportSender(configuredFrom = ENV.emailFrom): string {
  const normalised = normalizeEmailHeaderValue(configuredFrom || "").trim();
  if (!normalised || /emmanueltarfa\.com/i.test(normalised)) return BUSINESS_SUPPORT_SENDER;
  return normalised;
}

/** Which identity an email is sent under. JUMP programme email keeps its own mailbox. */
export type EmailSender = "jump" | "business_support";

/** The Resend request body. Pure, so the sender and reply-to rules can be tested without sending anything. */
export function resendRequestBody(input: {
  to: string;
  bcc?: string | string[];
  subject: string;
  body: string;
  html?: string;
  icsContent?: string;
  icsFilename?: string;
  attachments?: EmailAttachment[];
  sender?: EmailSender;
}) {
  const businessSupport = input.sender === "business_support";
  return {
    from: businessSupport ? getBusinessSupportSender() : getJumpProgrammeSender(),
    to: [input.to],
    bcc: input.bcc ? (Array.isArray(input.bcc) ? input.bcc : [input.bcc]) : undefined,
    subject: input.subject,
    text: input.body,
    html: input.html || (businessSupport ? buildBusinessSupportEmailHtml(input.body) : buildPlainTextEmailHtml(input.body)),
    reply_to: businessSupport ? BUSINESS_SUPPORT_MAILBOX : getJumpProgrammeReplyTo(),
    attachments: [
      ...(input.attachments || []).map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content.toString("base64"),
        content_type: attachment.contentType,
      })),
      ...(input.icsContent
        ? [{ filename: input.icsFilename || "session-invite.ics", content: Buffer.from(input.icsContent).toString("base64"), content_type: "text/calendar" }]
        : []),
    ],
  };
}

export async function deliverEmail(input: {
  to: string;
  bcc?: string | string[];
  subject: string;
  body: string;
  html?: string;
  icsContent?: string;
  icsFilename?: string;
  attachments?: EmailAttachment[];
  /** Defaults to the JUMP programme; business check email passes "business_support". */
  sender?: EmailSender;
}): Promise<EmailDeliveryResult> {
  if (process.env.NODE_ENV === "test" || process.env.VITEST || process.env.VITEST_WORKER_ID) {
    return { status: "Simulated", reason: "test_sender" };
  }

  const apiKey = ENV.resendApiKey;
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY is not set, so no email was sent.");
    return { status: "Failed", reason: `${BRAND.programmeShortName} programme email delivery is not configured` };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
        "user-agent": "jump-2026-registration/1.0",
      },
      body: JSON.stringify(resendRequestBody(input)),
    });
    const data = (await response.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
    if (response.ok) return { status: "Sent", providerMessageId: data.id };
    const reason = data.message || data.name || `Resend API error: HTTP ${response.status}`;
    // Visible in the hosting logs (e.g. an unverified domain); never includes the API key.
    console.warn(`[Email] Resend refused an email (HTTP ${response.status}): ${reason}`);
    return { status: "Failed", reason };
  } catch (error) {
    return { status: "Failed", reason: error instanceof Error ? error.message : `Unknown error during ${BRAND.programmeShortName} email delivery` };
  }
}
