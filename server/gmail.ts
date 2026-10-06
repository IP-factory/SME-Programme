import { ENV } from "./_core/env";
export type GmailDeliveryResult =
  | { status: "Sent"; providerMessageId?: string }
  | { status: "Simulated"; reason: "missing_credentials" | "test_sender" }
  | { status: "Failed"; reason: string };

export type GmailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

function isGmailConfigured() {
  return Boolean(ENV.googleClientId && ENV.googleClientSecret && ENV.googleRefreshToken);
}

async function getAccessToken(): Promise<string | null> {
  if (!isGmailConfigured()) return null;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      refresh_token: ENV.googleRefreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google OAuth token refresh failed (${response.status}): ${errorText}`);
  }
  const body = (await response.json()) as { access_token?: string };
  if (!body.access_token) {
    throw new Error("Google OAuth response did not include an access token");
  }
  return body.access_token;
}

/**
 * Encode an email message to RFC 2822 format (with optional ICS attachment) and base64url-encode it for the Gmail API.
 */
export function createRawEmail(input: {
  to: string;
  bcc?: string | string[];
  subject: string;
  body: string;
  html?: string;
  from?: string;
  replyTo?: string;
  icsContent?: string;
  icsFilename?: string;
  attachments?: GmailAttachment[];
}): string {
  const fromHeader = input.from ? `From: ${input.from}` : "";
  const replyToHeader = input.replyTo ? `Reply-To: ${input.replyTo}` : "";
  const bccHeader = input.bcc ? `Bcc: ${Array.isArray(input.bcc) ? input.bcc.join(", ") : input.bcc}` : "";
  const utf8Subject = `=?UTF-8?B?${Buffer.from(input.subject).toString("base64")}?=`;

  const alternativeBoundary = `----=_JUMP_Alternative_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const alternativePart = input.html ? [
    `--${alternativeBoundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    input.body,
    ``,
    `--${alternativeBoundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    input.html,
    ``,
    `--${alternativeBoundary}--`,
  ] : [
    input.body,
  ];

  const attachments: GmailAttachment[] = [
    ...(input.attachments || []),
    ...(input.icsContent
      ? [{ filename: input.icsFilename || "session-invite.ics", content: Buffer.from(input.icsContent), contentType: "text/calendar; charset=UTF-8; method=REQUEST" }]
      : []),
  ];

  if (attachments.length) {
    const boundary = `----=_JUMP_Mixed_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const headers = [
      fromHeader,
      replyToHeader,
      bccHeader,
      `To: ${input.to}`,
      `Subject: ${utf8Subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ].filter(Boolean);

    const rawMessage = [
      ...headers,
      ``,
      `--${boundary}`,
      ...(input.html ? [`Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`, ``, ...alternativePart] : [`Content-Type: text/plain; charset=UTF-8`, `Content-Transfer-Encoding: 8bit`, ``, ...alternativePart]),
      ``,
      ...attachments.flatMap((attachment) => [
        `--${boundary}`,
        `Content-Type: ${attachment.contentType || "application/octet-stream"}`,
        `Content-Transfer-Encoding: base64`,
        `Content-Disposition: attachment; filename="${attachment.filename}"`,
        ``,
        attachment.content.toString("base64"),
        ``,
      ]),
      `--${boundary}--`,
    ].join("\r\n");

    return Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  const headers = [
    fromHeader,
    replyToHeader,
    bccHeader,
    `To: ${input.to}`,
    `Subject: ${utf8Subject}`,
    `MIME-Version: 1.0`,
    ...(input.html
      ? [`Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`]
      : [`Content-Type: text/plain; charset=UTF-8`, `Content-Transfer-Encoding: 8bit`]),
  ].filter(Boolean);

  const rawMessage = [
    ...headers,
    ``,
    ...alternativePart,
  ].join("\r\n");

  return Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendEmailViaGmail(input: {
  to: string;
  bcc?: string | string[];
  subject: string;
  body: string;
  html?: string;
  replyTo?: string;
  icsContent?: string;
  icsFilename?: string;
  attachments?: GmailAttachment[];
}): Promise<GmailDeliveryResult> {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    return { status: "Simulated", reason: "test_sender" };
  }

  if (!isGmailConfigured()) {
    return { status: "Simulated", reason: "missing_credentials" };
  }

  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return { status: "Simulated", reason: "missing_credentials" };
    }

    const raw = createRawEmail({
      to: input.to,
      bcc: input.bcc,
      subject: input.subject,
      body: input.body,
      html: input.html,
      replyTo: input.replyTo || ENV.emailReplyTo || "admin@emmanueltarfa.com",
      icsContent: input.icsContent,
      icsFilename: input.icsFilename,
      attachments: input.attachments,
    });

    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });

    const payload = (await response.json().catch(() => ({}))) as { id?: string; error?: { message?: string; code?: number } };
    if (!response.ok) {
      const errorMsg = payload.error?.message ?? `HTTP ${response.status}`;
      return { status: "Failed", reason: `Gmail API Error: ${errorMsg}` };
    }

    return { status: "Sent", providerMessageId: payload.id };
  } catch (error) {
    return { status: "Failed", reason: error instanceof Error ? error.message : "Unknown Gmail delivery error" };
  }
}
