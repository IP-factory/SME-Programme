import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

/**
 * Static, clickable preview of the site with a simulated server (client/src/preview).
 * Output in dist/preview uses relative paths, so it can be opened from any static host.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  base: "./",
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/preview"),
    emptyOutDir: true,
    rollupOptions: { input: path.resolve(import.meta.dirname, "client", "preview.html") },
  },
});
