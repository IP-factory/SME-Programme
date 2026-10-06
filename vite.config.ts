import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";

/** Adds the Umami analytics script only when an endpoint and site id are configured. */
function analyticsPlugin(): Plugin {
  let env: Record<string, string> = {};
  return {
    name: "optional-analytics",
    configResolved(config) {
      env = config.env;
    },
    transformIndexHtml() {
      const endpoint = env.VITE_ANALYTICS_ENDPOINT;
      const websiteId = env.VITE_ANALYTICS_WEBSITE_ID;
      if (!endpoint || !websiteId) return [];
      return [{ tag: "script", attrs: { defer: true, src: `${endpoint.replace(/\/+$/, "")}/umami`, "data-website-id": websiteId }, injectTo: "body" }];
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), analyticsPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: ["localhost", "127.0.0.1"],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
