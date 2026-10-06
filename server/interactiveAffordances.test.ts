import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("interactive cursor affordances", () => {
  it("marks active controls as clickable and disabled controls as unavailable", () => {
    const stylesheet = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

    expect(stylesheet).toContain("button:not(:disabled)");
    expect(stylesheet).toContain('[role="button"]:not([aria-disabled="true"])');
    expect(stylesheet).toContain("a[href]");
    expect(stylesheet).toContain("cursor: pointer");
    expect(stylesheet).toContain("button:disabled");
    expect(stylesheet).toContain("cursor: not-allowed");
  });
});
