/**
 * The Node versions the TEST environment supports. The browser-like tests run in jsdom 30, which declares
 * `engines.node: ^22.22.2 || ^24.15.0 || >=26.0.0` and depends on undici 8, which needs `node:worker_threads`
 * `markAsUncloneable` (Node 22.19+). Node 20 lacks it, so jsdom fails to load with
 * "webidl.util.markAsUncloneable is not a function" and Vitest reports unhandled errors.
 * Keep this in step with jsdom's `engines` when jsdom is upgraded.
 */
export const REQUIRED_NODE_DESCRIPTION = "Node 22.22.2 or newer 22.x (or 24.15+, 26+)";

export function parseNodeVersion(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(String(version));
  return match ? { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) } : null;
}

const atLeast = (parsed, minor, patch) => parsed.minor > minor || (parsed.minor === minor && parsed.patch >= patch);

export function isSupportedNode(version) {
  const parsed = parseNodeVersion(version);
  if (!parsed) return false;
  if (parsed.major === 22) return atLeast(parsed, 22, 2);
  if (parsed.major === 24) return atLeast(parsed, 15, 0);
  return parsed.major >= 26;
}

export function unsupportedNodeMessage(version) {
  return [
    `The tests need ${REQUIRED_NODE_DESCRIPTION}, but this shell is running Node ${String(version).replace(/^v/, "")}.`,
    "On an older Node the browser-like tests fail with 'webidl.util.markAsUncloneable is not a function' and Vitest reports unhandled errors.",
    "Fix: run `nvm install 22 && nvm use` (the repository's .nvmrc says 22), then run the command again.",
  ].join("\n");
}
