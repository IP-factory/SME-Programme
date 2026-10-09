import { describe, expect, it } from "vitest";
import { PRICES } from "@shared/businessSupport";
import { describePayment, PAYMENT_ITEM_DETAILS, PAYMENT_STATUS_LABELS, paymentReference } from "@shared/payments";

describe("what an owner can pay for before Current State", () => {
  it("takes its prices from the one price list", () => {
    expect(PAYMENT_ITEM_DETAILS.full_report.amount).toBe(PRICES.fullReport);
    expect(PAYMENT_ITEM_DETAILS.current_state.amount).toBe(PRICES.currentState);
    expect(describePayment("full_report")).toBe("₦100,000 for your full business check report");
    expect(describePayment("current_state")).toBe("₦500,000 for Current State");
  });

  it("gives each business check one short, distinct transfer reference per item", () => {
    expect(paymentReference("full_report", 123)).toBe("TS-R-000123");
    expect(paymentReference("current_state", 123)).toBe("TS-CS-000123");
    expect(paymentReference("current_state", 1234567)).toBe("TS-CS-1234567");
    expect(paymentReference("full_report", 1).length).toBeLessThanOrEqual(32);
  });

  it("names each status in plain words", () => {
    expect(PAYMENT_STATUS_LABELS).toEqual({ requested: "Awaiting payment", proof_received: "Proof received", confirmed: "Paid" });
  });
});
