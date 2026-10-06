import { describe, expect, it } from "vitest";
import { firstNameFromFullName, paymentInstructionTemplateLibrary, renderPaymentInstruction } from "@shared/paymentInstructionTemplates";

describe("payment instruction templates", () => {
  it("offers the approved Nigeria, North America, and U.K. owner-only payment routes", () => {
    expect(paymentInstructionTemplateLibrary()).toEqual([
      { id: "nigeria_access_bank", label: "Nigeria — NGN via Access Bank", routeLabel: "NGN / Nigeria" },
      { id: "north_america", label: "North America — USD via Paystack", routeLabel: "USD / North America" },
      { id: "uk_wise", label: "United Kingdom — GBP via Wise", routeLabel: "GBP / United Kingdom" },
    ]);
  });

  it("provides a Paystack-only North America route and private payment-tab guidance", () => {
    const message = renderPaymentInstruction("north_america", "Amaka Eze", "https://emmanueltarfa.com");
    expect(message.body).toContain("https://emmanueltarfa.com/portal?tab=payment");
    expect(message.body).toContain("approved commitment and full-payment amounts");
    expect(message.body).toContain("Dear Amaka,");
    expect(message.body).not.toContain("Western Union");
    expect(message.body).not.toContain("ABNGNGLA");
    expect(message.body).not.toContain("CITIUS33");
    expect(message.body).not.toContain("BKTRUS33");
  });

  it("personalises the U.K. template and distinguishes local from international transfer identifiers", () => {
    const message = renderPaymentInstruction("uk_wise", "Tobi Adeyemi", "https://emmanueltarfa.com");
    expect(message.subject).toContain("U.K.");
    expect(message.body).toContain("Dear Tobi,");
    expect(message.body).toContain("Sort code: 60-84-64");
    expect(message.body).toContain("Swift/BIC: TRWIGB2LXXX");
  });

  it("uses the first available name for a warmer recipient greeting", () => {
    expect(firstNameFromFullName("  Emmanuel Tarfa ")).toBe("Emmanuel");
  });
});
