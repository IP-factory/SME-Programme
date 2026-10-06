export const REFERRAL_CREDIT_PERCENTAGE = 5;
export const REFERRAL_MAX_APPROVED_CREDITS = 2;

export const REFERRAL_POLICY_SUMMARY = `A referral earns a ${REFERRAL_CREDIT_PERCENTAGE}% credit against the referrer's outstanding JUMP programme balance only after the referred business is accepted, its first commitment payment is marked Paid, and Emmanuel approves the credit. Credits are not cash, cannot be transferred, and are capped at ${REFERRAL_MAX_APPROVED_CREDITS} approved referrals per participant.`;

export function referralCreditIsAvailable(approvedReferralCount: number) {
  return approvedReferralCount < REFERRAL_MAX_APPROVED_CREDITS;
}

export function referralIsEligibleForQualification(status: string, depositPaid: string) {
  return status === "Accepted" && depositPaid === "Paid";
}
