import { describe, expect, it } from "vitest";
import { getPrivatePaymentGuidance } from "@server/paymentGuidance";

describe("private participant payment guidance", () => {
  it("returns Foundation 40/30/30 terms and payment routes only through authenticated portal guidance", () => {
    const guidance = getPrivatePaymentGuidance("Foundation", "Ada Example");

    expect(guidance.commitmentPayment).toBe("₦230,000");
    expect(guidance.firstInstalment).toBe("₦172,500");
    expect(guidance.secondInstalment).toBe("₦172,500");
    expect(guidance.fullUpfrontFee).toBe("₦517,500");
    expect(guidance.fullUpfrontNote).toContain("10% discount");
    expect(guidance.paymentInstructions).toContain("authenticated JUMP portal");
    expect(guidance.paymentRoutes).toHaveLength(3);
    expect(guidance.paymentRoutes.find((route) => route.id === "nigeria_access_bank")?.details).toContainEqual({ label: "Account number", value: "0021722315" });
    expect(guidance.paymentRoutes.find((route) => route.id === "uk_wise")?.details).toContainEqual({ label: "IBAN", value: "GB64 TRWI 6084 6418 5388 12" });
    const northAmerica = guidance.paymentRoutes.find((route) => route.id === "north_america");
    expect(northAmerica?.details).toContainEqual({ label: "Payment route", value: "Paystack online checkout" });
    expect(northAmerica?.details).toContainEqual({ label: "How to pay", value: "Choose the Paystack row above that matches your pathway and payment option." });
    expect(northAmerica?.note).toContain("approved commitment and full-payment checkout links");
    expect(northAmerica?.title).toBe("Paystack");
    expect(guidance.paymentRoutes.map((route) => route.id)).toEqual(["north_america", "nigeria_access_bank", "uk_wise"]);
    expect(guidance.paymentRoutes.some((route) => `${route.title} ${route.note}`.includes("Western Union"))).toBe(false);
    expect(guidance.paymentRoutes.some((route) => route.title.includes("Cleva") || route.title.includes("PayPal"))).toBe(false);
    expect(guidance.paystackOptions).toEqual([
      { packageName: "Foundation", lineItem: "Commitment", naira: "₦350,000", usd: "$250.00", url: "https://paystack.shop/pay/sm7k5rn3ql" },
      { packageName: "Foundation", lineItem: "Full payment (10% discount)", naira: "₦517,500", usd: "$369.90", url: "https://paystack.shop/pay/rklvj6ssz2" },
      { packageName: "Engine Room", lineItem: "Commitment", naira: "₦350,000", usd: "$250.00", url: "https://paystack.shop/pay/b8zgluv9j3" },
      { packageName: "Engine Room", lineItem: "Full payment (10% discount)", naira: "₦787,500", usd: "$562.50", url: "https://paystack.shop/pay/ghptqiitwh" },
      { packageName: "Boardroom", lineItem: "Commitment", naira: "₦600,000", usd: "$428.40", url: "https://paystack.shop/pay/udn97fzul-" },
      { packageName: "Boardroom", lineItem: "Full payment (10% discount)", naira: "₦1,350,000", usd: "$963.90", url: "https://paystack.shop/pay/5o7l3kq66m" },
    ]);
  });

  it("keeps Boardroom payment calculations package-specific", () => {
    const guidance = getPrivatePaymentGuidance("Boardroom", "Board Member");

    expect(guidance.commitmentPayment).toBe("₦600,000");
    expect(guidance.firstInstalment).toBe("₦450,000");
    expect(guidance.fullUpfrontFee).toBe("₦1,350,000");
  });

  it("returns Engine Room 40/30/30 terms and the full-upfront discount", () => {
    const guidance = getPrivatePaymentGuidance("Engine Room", "Engine Participant");

    expect(guidance.fullProgrammeFee).toBe("₦875,000");
    expect(guidance.commitmentPayment).toBe("₦350,000");
    expect(guidance.firstInstalment).toBe("₦262,500");
    expect(guidance.secondInstalment).toBe("₦262,500");
    expect(guidance.fullUpfrontFee).toBe("₦787,500");
  });
});
