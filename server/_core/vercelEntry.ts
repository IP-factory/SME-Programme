import { createApp } from "./app";
import { createVercelGateway } from "./vercelGateway";

// Source of truth for the Vercel Function. `pnpm build:vercel-api` bundles this file into
// api/index.js: vercel.json rewrites every server-controlled prefix there, and the gateway
// restores the original URL before the shared Express app routes it.
export default createVercelGateway(createApp());
