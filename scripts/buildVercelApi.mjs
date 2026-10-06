import { mkdir } from "node:fs/promises";
import { build } from "esbuild";

await mkdir("api", { recursive: true });

await build({
  entryPoints: ["server/_core/vercelEntry.ts"],
  outfile: "api/index.js",
  platform: "node",
  target: "node22",
  bundle: true,
  packages: "external",
  format: "esm",
  minify: false,
  banner: {
    js: [
      "// GENERATED FILE - DO NOT EDIT DIRECTLY.",
      "// Source: server/_core/vercelEntry.ts",
      "// Regenerate with: pnpm build:vercel-api",
    ].join("\n"),
  },
});

console.log("Wrote api/index.js");
