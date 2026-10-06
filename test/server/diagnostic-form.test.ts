import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dialogSource = readFileSync(new URL("../../client/src/components/DiagnosticRegistrationDialog.tsx", import.meta.url), "utf8");

describe("diagnostic competency choices", () => {
  it("renders the weak-area bucket only once", () => {
    expect(dialogSource).not.toContain('renderChips(weakAreaOptions, "", () => undefined)');
    expect(dialogSource.match(/weakAreaOptions\.map\(\(option\) =>/g)).toHaveLength(1);
  });
});
