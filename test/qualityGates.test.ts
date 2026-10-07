import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");
const REQUIRED_CHECKS = ["check", "check:tests", "test", "build"];

describe("quality gates (AGENTS.md)", () => {
  it("runs every check, in order, from one command before a push", () => {
    const scripts = JSON.parse(read("package.json")).scripts as Record<string, string>;
    expect(scripts.verify.split("&&").map((step) => step.trim().replace(/^pnpm /, ""))).toEqual(REQUIRED_CHECKS);
    for (const check of REQUIRED_CHECKS) expect(scripts[check], check).toBeTruthy();
  });

  it("runs the same checks in CI on every push and pull request", () => {
    const ci = read(".github/workflows/ci.yml");
    for (const check of REQUIRED_CHECKS) expect(ci).toContain(`- run: pnpm ${check}\n`);
    expect(ci).toMatch(/push:/);
    expect(ci).toMatch(/pull_request:/);
  });

  it("keeps the agent rules where Claude Code and other agents read them", () => {
    expect(read("AGENTS.md")).toMatch(/ships with tests/);
    expect(read("AGENTS.md")).toMatch(/Nothing is pushed until `pnpm verify` passes/);
    expect(read("CLAUDE.md")).toContain("@AGENTS.md");
  });
});
