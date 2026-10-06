import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/components/FacilitatorVideo.tsx", import.meta.url), "utf8");

describe("FacilitatorVideo", () => {
  it("keeps the requested MP4 behaviour available while lazily loading only the Instagram fallback", () => {
    expect(source).toContain("controls");
    expect(source).toContain("playsInline");
    expect(source).toContain('preload="metadata"');
    expect(source).toContain("DEFAULT_FACILITATOR_POSTER");
    expect(source).toContain("IntersectionObserver");
    expect(source).toContain("https://www.instagram.com/embed.js");
    expect(source).toContain("DbIe9w9s_1L");
    expect(source).not.toContain("instagram.com/explore");
  });
});
