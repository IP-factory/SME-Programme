import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const toast = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

import { getOAuthLoginConfig, startLogin } from "@/const";

const location = { pathname: "/admin", search: "?x=1", origin: "https://app.example.test", href: "https://app.example.test/admin" };
let cookies: string[] = [];

beforeEach(() => {
  cookies = [];
  location.href = "https://app.example.test/admin";
  vi.stubGlobal("window", { location });
  vi.stubGlobal("document", { set cookie(value: string) { cookies.push(value); } });
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  toast.error.mockClear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("startLogin never crashes when the legacy OAuth settings are missing or invalid", () => {
  it.each([
    ["both missing", {}],
    ["portal missing", { VITE_APP_ID: "app-1" }],
    ["app id missing", { VITE_OAUTH_PORTAL_URL: "https://portal.example.test" }],
    ["blank values", { VITE_OAUTH_PORTAL_URL: "   ", VITE_APP_ID: "  " }],
    ["not a URL", { VITE_OAUTH_PORTAL_URL: "not a url", VITE_APP_ID: "app-1" }],
    ["a relative path", { VITE_OAUTH_PORTAL_URL: "/portal", VITE_APP_ID: "app-1" }],
    ["a javascript: address", { VITE_OAUTH_PORTAL_URL: "javascript:alert(1)", VITE_APP_ID: "app-1" }],
    ["the literal string 'undefined'", { VITE_OAUTH_PORTAL_URL: "undefined", VITE_APP_ID: "app-1" }],
    ["non-string values", { VITE_OAUTH_PORTAL_URL: 5, VITE_APP_ID: true }],
  ])("returns false without throwing or navigating: %s", (_label, env) => {
    expect(() => startLogin(env)).not.toThrow();
    expect(startLogin(env)).toBe(false);
    expect(location.href).toBe("https://app.example.test/admin");
    expect(cookies).toEqual([]); // no state cookie is minted for a login that cannot start
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/email and password/));
  });

  it("logs a diagnostic that names the settings but never their values", () => {
    startLogin({ VITE_OAUTH_PORTAL_URL: "https://secret-portal.example.test", VITE_APP_ID: "" });
    startLogin({ VITE_OAUTH_PORTAL_URL: "not a url secret-portal", VITE_APP_ID: "super-secret-app-id" });
    const logged = vi.mocked(console.error).mock.calls.flat().join(" ");
    expect(logged).toContain("VITE_OAUTH_PORTAL_URL");
    expect(logged).toContain("VITE_APP_ID");
    expect(logged).not.toContain("secret-portal");
    expect(logged).not.toContain("super-secret-app-id");
  });
});

describe("startLogin with valid settings", () => {
  it("navigates to the portal with the app id, a callback address and a matching state nonce", () => {
    expect(startLogin({ VITE_OAUTH_PORTAL_URL: "https://portal.example.test/", VITE_APP_ID: "app-1" })).toBe(true);
    const target = new URL(location.href);
    expect(target.origin + target.pathname).toBe("https://portal.example.test/app-auth");
    expect(target.searchParams.get("appId")).toBe("app-1");
    expect(target.searchParams.get("redirectUri")).toBe("https://app.example.test/api/oauth/callback");
    expect(target.searchParams.get("type")).toBe("signIn");
    expect(cookies).toHaveLength(1);
    const nonce = /=([^;]+);/.exec(cookies[0])![1];
    expect(JSON.parse(atob(target.searchParams.get("state")!))).toMatchObject({ nonce, redirectPath: "/admin?x=1" });
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe("getOAuthLoginConfig", () => {
  it("accepts http and https only and trims trailing slashes", () => {
    expect(getOAuthLoginConfig({ VITE_OAUTH_PORTAL_URL: " https://portal.example.test// ", VITE_APP_ID: " app " })).toEqual({ portalUrl: "https://portal.example.test", appId: "app" });
    expect(getOAuthLoginConfig({ VITE_OAUTH_PORTAL_URL: "http://localhost:3001", VITE_APP_ID: "app" })).not.toBeNull();
    expect(getOAuthLoginConfig({ VITE_OAUTH_PORTAL_URL: "ftp://portal.example.test", VITE_APP_ID: "app" })).toBeNull();
  });
});
