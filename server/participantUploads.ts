export const participantUploadPolicy = {
  maxBytes: 15 * 1024 * 1024,
  supportedMimeTypes: new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/heic",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ]),
} as const;

export function getParticipantUploadValidationError(file: { mimetype: string; size: number }) {
  if (!participantUploadPolicy.supportedMimeTypes.has(file.mimetype)) {
    return "Please upload a PDF, image, Word, Excel, or plain-text file.";
  }
  if (file.size > participantUploadPolicy.maxBytes) {
    return "Please upload a file no larger than 15 MB.";
  }
  return null;
}

export function buildParticipantUploadKey(participantId: number, originalName: string, timestamp = Date.now()) {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120) || "assignment";
  return `participant-assignments/${participantId}/${timestamp}-${safeName}`;
}

export function buildPaymentReceiptUploadKey(participantId: number, originalName: string, timestamp = Date.now()) {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120) || "payment-receipt";
  return `payment-receipts/${participantId}/${timestamp}-${safeName}`;
}
