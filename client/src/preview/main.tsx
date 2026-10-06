/**
 * Entry point for the static, clickable preview (`pnpm build:preview` → dist/preview).
 * Same pages and components as the real app; routing is in memory and the server is simulated,
 * so it runs from any static host or a claude.ai page.
 */
import { trpc } from "@/lib/trpc";
import { BRAND } from "@shared/brand";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { Router, useLocation } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import App from "../App";
import "../index.css";
import { previewLink } from "./previewLink";

// Asset paths are site-absolute in the app; make them relative to wherever the preview is served.
for (const key of ["logoUrl", "logoOnDarkUrl", "markUrl"] as const) {
  (BRAND as Record<string, string>)[key] = `.${BRAND[key]}`;
}

// Same-page links (#how, #questions…) scroll instead of navigating away from the preview.
document.addEventListener("click", (event) => {
  const link = (event.target as HTMLElement).closest?.("a[href^='#']");
  const id = link?.getAttribute("href")?.slice(1);
  if (!id) return;
  event.preventDefault();
  if (id === "top") window.scrollTo({ top: 0, behavior: "smooth" });
  else document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
});

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const trpcClient = trpc.createClient({ links: [previewLink] });
const { hook } = memoryLocation({ path: "/" });

const PAGES = [
  { path: "/", label: "Home" },
  { path: "/admin/login", label: "Admin sign-in" },
  { path: "/portal", label: "Client portal" },
];

function PreviewBar() {
  const [location, setLocation] = useLocation();
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-brand-deep/95 px-4 pt-2 text-[11px] text-paper shadow-lg backdrop-blur"
      style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <span className="font-semibold uppercase tracking-widest text-highlight">Preview</span>
      <span className="text-on-dark-muted">Forms are simulated: nothing is saved or sent.</span>
      <span className="flex gap-3">
        {PAGES.map((page) => (
          <button
            key={page.path}
            type="button"
            onClick={() => { setLocation(page.path); window.scrollTo({ top: 0 }); }}
            className={location === page.path ? "font-semibold text-paper underline underline-offset-4" : "text-on-dark-muted hover:text-paper"}
          >
            {page.label}
          </button>
        ))}
      </span>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <Router hook={hook}>
        <App />
        <PreviewBar />
      </Router>
    </QueryClientProvider>
  </trpc.Provider>,
);
