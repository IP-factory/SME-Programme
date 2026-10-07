import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isSupportedNode, parseNodeVersion, unsupportedNodeMessage } from "../../scripts/nodeVersion.mjs";

const root = process.cwd();
const jsdomEngines = (JSON.parse(readFileSync(resolve(root, "node_modules/jsdom/package.json"), "utf8")) as { engines: { node: string } }).engines.node;

describe("the Node version the tests need", () => {
  it.each([
    ["v20.20.1", false],
    ["20.11.0", false],
    ["22.12.0", false],
    ["22.19.0", false],
    ["22.22.1", false],
    ["22.22.2", true],
    ["22.23.3", true],
    ["23.5.0", false],
    ["24.14.9", false],
    ["24.15.0", true],
    ["24.20.1", true],
    ["25.1.0", false],
    ["26.0.0", true],
    ["28.1.0", true],
    ["not-a-version", false],
    ["", false],
  ])("%s -> supported: %s", (version, supported) => {
    expect(isSupportedNode(version)).toBe(supported);
  });

  it("matches what jsdom itself declares, so the two cannot drift apart unnoticed", () => {
    expect(jsdomEngines).toBe("^22.22.2 || ^24.15.0 || >=26.0.0");
  });

  it("parses a version and explains the fix in one message", () => {
    expect(parseNodeVersion("v22.23.3")).toEqual({ major: 22, minor: 23, patch: 3 });
    expect(parseNodeVersion("nope")).toBeNull();
    const message = unsupportedNodeMessage("v20.20.1");
    expect(message).toContain("Node 20.20.1");
    expect(message).toContain("nvm install 22 && nvm use");
    expect(message).toContain("markAsUncloneable");
  });

  it("is running on a supported Node right now (otherwise these tests could not have loaded jsdom)", () => {
    expect(isSupportedNode(process.versions.node)).toBe(true);
  });

  it("passes the pre-test guard on this Node", () => {
    const result = spawnSync(process.execPath, ["scripts/requireNodeForTests.mjs"], { cwd: root, encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });
});

describe("the repository pins the same Node everywhere it matters", () => {
  const read = (file: string) => readFileSync(resolve(root, file), "utf8");

  it("uses Node 22 in .nvmrc and CI, and runs the guard before the tests", () => {
    expect(read(".nvmrc").trim()).toBe("22");
    expect(read(".github/workflows/ci.yml")).toMatch(/node-version:\s*22\b/);
    const scripts = JSON.parse(read("package.json")).scripts as Record<string, string>;
    expect(scripts.pretest).toBe("node scripts/requireNodeForTests.mjs");
    expect(scripts.test).toBe("vitest run");
    expect(scripts.verify.split("&&").map(step => step.trim())).toContain("pnpm test");
  });

  it("does not set package.json engines, which Vercel would read to choose the production runtime", () => {
    expect(JSON.parse(read("package.json")).engines).toBeUndefined();
  });
});
