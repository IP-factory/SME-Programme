import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");
const REQUIRED_CHECKS = ["check", "check:tests", "test", "build"];

describe("quality gates (AGENTS.md)", () => {
  it("runs every check, in order, from one command before a push", () => {
    const scripts = JSON.parse(read("package.json")).scripts as Record<string, string>;
    expect(scripts.verify.split("&&").map((step) => step.trim().replace(/^pnpm /, ""))).toEqual(REQUIRED_CHECKS);
    for (const check of REQUIRED_CHECKS) expect(scripts[check], check).toBeTruthy();
  });

  // Parsed as GitHub parses it: an invalid workflow file means CI silently never runs the checks.
  const workflow = () => parseYaml(read(".github/workflows/ci.yml")) as { on: Record<string, unknown>; jobs: { verify: { steps: { run?: string }[] } } };
  const runSteps = () => workflow().jobs.verify.steps.flatMap((step) => (step.run ? [step.run.trim()] : []));

  it("runs the same checks in CI, in order, on every push and pull request", () => {
    expect(Object.keys(workflow().on)).toEqual(expect.arrayContaining(["push", "pull_request"]));
    const checks = runSteps().filter((run) => REQUIRED_CHECKS.some((check) => run === `pnpm ${check}`));
    expect(checks).toEqual(REQUIRED_CHECKS.map((check) => `pnpm ${check}`));
  });

  it("fails CI when the committed Vercel bundle (api/index.js) is older than the source", () => {
    const runs = runSteps();
    const bundleCheck = runs.findIndex((run) => run.includes("git diff --exit-code -- api/index.js"));
    expect(bundleCheck).toBeGreaterThan(runs.indexOf("pnpm build"));
    expect(runs[bundleCheck]).toContain("exit 1");
  });

  it("keeps the agent rules where Claude Code and other agents read them", () => {
    expect(read("AGENTS.md")).toMatch(/ships with tests/);
    expect(read("AGENTS.md")).toMatch(/Nothing is pushed until `pnpm verify` passes/);
    expect(read("CLAUDE.md")).toContain("@AGENTS.md");
  });
});
