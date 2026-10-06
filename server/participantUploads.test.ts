import { describe, expect, it } from "vitest";
import { buildParticipantUploadKey, getParticipantUploadValidationError, participantUploadPolicy } from "./participantUploads";

describe("participant assignment upload policy", () => {
  it("accepts the documented file formats within the private upload size limit", () => {
    expect(getParticipantUploadValidationError({ mimetype: "application/pdf", size: participantUploadPolicy.maxBytes })).toBeNull();
    expect(getParticipantUploadValidationError({ mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 1024 })).toBeNull();
  });

  it("rejects unsupported formats and oversize files before storage", () => {
    expect(getParticipantUploadValidationError({ mimetype: "application/zip", size: 1024 })).toMatch(/PDF, image, Word, Excel, or plain-text/i);
    expect(getParticipantUploadValidationError({ mimetype: "application/pdf", size: participantUploadPolicy.maxBytes + 1 })).toMatch(/15 MB/i);
  });

  it("scopes each stored object to the authenticated participant and sanitises the supplied filename", () => {
    expect(buildParticipantUploadKey(600001, "My brief (final).pdf", 1724112000000)).toBe(
      "participant-assignments/600001/1724112000000-My-brief-final-.pdf",
    );
  });
});
