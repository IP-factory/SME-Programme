import { describe, expect, it } from "vitest";
import {
  REFERRAL_CREDIT_PERCENTAGE,
  REFERRAL_MAX_APPROVED_CREDITS,
  REFERRAL_POLICY_SUMMARY,
  referralCreditIsAvailable,
  referralIsEligibleForQualification,
} from "@shared/referrals";

describe("JUMP referral policy", () => {
  it("qualifies a referral only after the referred business is accepted and the first commitment is paid", () => {
    expect(referralIsEligibleForQualification("Accepted", "Paid")).toBe(true);
    expect(referralIsEligibleForQualification("Pending", "Paid")).toBe(false);
    expect(referralIsEligibleForQualification("Accepted", "Pending")).toBe(false);
  });

  it("caps approved credits and keeps the approved percentage explicit", () => {
    expect(referralCreditIsAvailable(REFERRAL_MAX_APPROVED_CREDITS - 1)).toBe(true);
    expect(referralCreditIsAvailable(REFERRAL_MAX_APPROVED_CREDITS)).toBe(false);
    expect(REFERRAL_CREDIT_PERCENTAGE).toBe(5);
    expect(REFERRAL_POLICY_SUMMARY).toContain("Emmanuel approves");
  });
});
