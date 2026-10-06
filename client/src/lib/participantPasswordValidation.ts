export const PARTICIPANT_PASSWORD_HELP = "Use at least 5 characters. A simple word is fine.";

export function validateParticipantPassword(password: string, confirmPassword: string): string | null {
  if (password.length < 5) {
    return "Your password needs at least 5 characters.";
  }

  if (password !== confirmPassword) {
    return "The two passwords do not match. Please enter the same password in both fields.";
  }

  return null;
}

export function getParticipantPasswordRecoveryMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("too_small") || normalized.includes("at least 5") || normalized.includes("minimum\"")) {
    return "Your password needs at least 5 characters. Please update both fields and try again.";
  }

  if (normalized.includes("expired") || normalized.includes("single-use") || normalized.includes("token") || normalized.includes("password link")) {
    return "This secure password link is no longer valid. Return to JUMP sign in and request a new password link using your registered email address.";
  }

  return "We could not set your password just now. Please check both fields and try again. If the issue continues, return to JUMP sign in and request a new secure password link.";
}
