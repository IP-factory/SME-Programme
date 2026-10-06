import { ENV } from "./_core/env";

type GmailHeader = { name?: string; value?: string };
type GmailPart = { mimeType?: string; body?: { data?: string }; parts?: GmailPart[] };

export type WorkspaceMailboxMessage = {
  id: string;
  threadId?: string;
  senderEmail: string;
  senderName: string | null;
  subject: string;
  preview: string;
  body: string;
  receivedAt: Date;
};

export function isJumpMailboxSyncConfigured() {
  return Boolean(ENV.googleClientId && ENV.googleClientSecret && ENV.jumpGmailRefreshToken);
}

export function buildParticipantInboxQuery(allowedSenderEmails: readonly string[]) {
  const participantEmails = Array.from(new Set(
    allowedSenderEmails
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.includes("@")),
  ));
  if (participantEmails.length === 0) return null;
  return `in:inbox newer_than:365d (${participantEmails.map((email) => `from:${email}`).join(" OR ")})`;
}

function decodeBase64Url(value: string | undefined) {
  if (!value) return "";
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function getHeader(headers: GmailHeader[] | undefined, target: string) {
  return headers?.find((header) => header.name?.toLowerCase() === target.toLowerCase())?.value?.trim() ?? "";
}

function parseMailboxAddress(value: string) {
  const bracketed = value.match(/^(.*)<([^>]+)>$/);
  const email = (bracketed?.[2] ?? value).trim().toLowerCase();
  const displayName = bracketed?.[1]?.trim().replace(/^"|"$/g, "") || null;
  return { email, displayName };
}

function findPlainTextBody(part: GmailPart | undefined): string {
  if (!part) return "";
  if (part.mimeType === "text/plain") return decodeBase64Url(part.body?.data);
  for (const child of part.parts ?? []) {
    const body = findPlainTextBody(child);
    if (body) return body;
  }
  return "";
}

export function parseWorkspaceMailboxMessage(message: {
  id?: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string;
  payload?: { headers?: GmailHeader[]; mimeType?: string; body?: { data?: string }; parts?: GmailPart[] };
}): WorkspaceMailboxMessage | null {
  if (!message.id) return null;
  const sender = parseMailboxAddress(getHeader(message.payload?.headers, "From"));
  if (!sender.email || !sender.email.includes("@")) return null;
  const timestamp = Number(message.internalDate ?? "0");
  return {
    id: message.id,
    threadId: message.threadId,
    senderEmail: sender.email,
    senderName: sender.displayName,
    subject: getHeader(message.payload?.headers, "Subject") || "(No subject)",
    preview: message.snippet?.trim() || "(No preview available)",
    body: (findPlainTextBody(message.payload) || message.snippet || "(No message text available)").slice(0, 15000),
    receivedAt: Number.isFinite(timestamp) && timestamp > 0 ? new Date(timestamp) : new Date(),
  };
}

async function getWorkspaceAccessToken() {
  if (!isJumpMailboxSyncConfigured()) throw new Error("The jump@ mailbox has not yet been connected for secure reply tracking.");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      refresh_token: ENV.jumpGmailRefreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) throw new Error(`Google mailbox authorisation failed (${response.status}).`);
  const result = (await response.json()) as { access_token?: string };
  if (!result.access_token) throw new Error("Google mailbox authorisation did not return an access token.");
  return result.access_token;
}

export async function getJumpMailboxMessages(allowedSenderEmails: readonly string[]) {
  const inboxQuery = buildParticipantInboxQuery(allowedSenderEmails);
  if (!inboxQuery) return [];
  const accessToken = await getWorkspaceAccessToken();
  const listParams = new URLSearchParams({ maxResults: "100", q: inboxQuery });
  const listResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${listParams.toString()}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!listResponse.ok) throw new Error(`Google inbox listing failed (${listResponse.status}).`);
  const list = (await listResponse.json()) as { messages?: Array<{ id: string; threadId?: string }> };
  const messages: WorkspaceMailboxMessage[] = [];
  for (const item of list.messages ?? []) {
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(item.id)}?format=full`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) continue;
    const parsed = parseWorkspaceMailboxMessage(await response.json());
    if (parsed) messages.push(parsed);
  }
  return messages;
}
