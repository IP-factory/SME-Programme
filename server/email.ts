import { ENV } from "./_core/env";
import { buildPlainTextEmailHtml } from "./emailTemplates";

export const JUMP_PROGRAMME_MAILBOX = "jump@emmanueltarfa.com";
export const JUMP_PROGRAMME_SENDER = `Emmanuel Tarfa | JUMP 2026 <${JUMP_PROGRAMME_MAILBOX}>`;
export const JUMP_ADMINISTRATION_MAILBOX = "admin@emmanueltarfa.com";
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

export async function deliverEmail(input: {
  to: string;
  bcc?: string | string[];
  subject: string;
  body: string;
  html?: string;
  icsContent?: string;
  icsFilename?: string;
  attachments?: EmailAttachment[];
}): Promise<EmailDeliveryResult> {
  if (process.env.NODE_ENV === "test" || process.env.VITEST || process.env.VITEST_WORKER_ID) {
    return { status: "Simulated", reason: "test_sender" };
  }

  const apiKey = ENV.resendApiKey;
  if (!apiKey) return { status: "Failed", reason: "JUMP programme email delivery is not configured" };

  const html = input.html || buildPlainTextEmailHtml(input.body);
  const from = getJumpProgrammeSender();
  const replyTo = getJumpProgrammeReplyTo();

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
        "user-agent": "jump-2026-registration/1.0",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        bcc: input.bcc ? (Array.isArray(input.bcc) ? input.bcc : [input.bcc]) : undefined,
        subject: input.subject,
        text: input.body,
        html,
        reply_to: replyTo,
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
      }),
    });
    const data = (await response.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
    if (response.ok) return { status: "Sent", providerMessageId: data.id };
    return { status: "Failed", reason: data.message || data.name || `Resend API error: HTTP ${response.status}` };
  } catch (error) {
    return { status: "Failed", reason: error instanceof Error ? error.message : "Unknown error during JUMP email delivery" };
  }
}
