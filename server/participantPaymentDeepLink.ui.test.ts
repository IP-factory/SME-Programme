import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("participant Payment-tab deep link", () => {
  it("accepts only recognised portal tabs and supports a direct payment view", () => {
    const source = readFileSync("client/src/pages/ParticipantDashboard.tsx", "utf8");

    expect(source).toContain('new URLSearchParams(window.location.search).get("tab")');
    expect(source).toContain('requestedTab === "payment"');
    expect(source).toContain("useState(getInitialPortalTab)");
    expect(source).toContain("useEffect(() => {");
    expect(source).toContain("setActivePortalTab(getInitialPortalTab())");
    expect(source).toContain('window.addEventListener("popstate", syncRequestedTab)');
    expect(source).toContain('<TabsTrigger value="payment"');
  });
});
