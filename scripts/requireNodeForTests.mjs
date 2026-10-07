// Runs before `pnpm test` (npm "pretest" hook) so a wrong Node version stops with one clear instruction instead of a
// wall of unhandled-error output. It changes nothing about how the tests run.
import { isSupportedNode, unsupportedNodeMessage } from "./nodeVersion.mjs";

if (!isSupportedNode(process.versions.node)) {
  console.error(unsupportedNodeMessage(process.versions.node));
  process.exit(1);
}
