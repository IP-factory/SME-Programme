import { describe, expect, it } from "vitest";
import { buildParticipantInboxQuery, parseWorkspaceMailboxMessage } from "./workspaceMailbox";

describe("workspace mailbox parser", () => {
  it("extracts a participant address, subject, preview, and plain-text body from a Gmail response", () => {
    const message = parseWorkspaceMailboxMessage({
      id: "gmail-message-1",
      threadId: "thread-1",
      snippet: "Thank you for the payment information.",
      internalDate: "1787530000000",
      payload: {
        headers: [
          { name: "From", value: "Catherine Udofia <eleeoglobal@gmail.com>" },
          { name: "Subject", value: "Re: Additional payment information" },
        ],
        mimeType: "multipart/alternative",
        parts: [{ mimeType: "text/plain", body: { data: Buffer.from("Thank you for the payment information.").toString("base64url") } }],
      },
    });
    expect(message).toMatchObject({
      id: "gmail-message-1",
      threadId: "thread-1",
      senderEmail: "eleeoglobal@gmail.com",
      senderName: "Catherine Udofia",
      subject: "Re: Additional payment information",
      body: "Thank you for the payment information.",
    });
  });

  it("rejects a message without a usable sender address", () => {
    expect(parseWorkspaceMailboxMessage({ id: "message-without-from", payload: { headers: [] } })).toBeNull();
  });

  it("builds an inbox query that limits retrieval to registered participant senders", () => {
    expect(buildParticipantInboxQuery(["EleeoGlobal@gmail.com", "eleeoglobal@gmail.com", "not-an-email"])).toBe(
      "in:inbox newer_than:365d (from:eleeoglobal@gmail.com)",
    );
    expect(buildParticipantInboxQuery([])).toBeNull();
  });
});
