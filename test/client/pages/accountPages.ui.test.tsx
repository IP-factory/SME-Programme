/** @vitest-environment jsdom */

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import type { AccountSessionView } from "@shared/auth";

const SESSION: AccountSessionView = {
  user: { id: 1, fullName: "Richie Okafor", email: "richie@example.com" },
  memberships: [{ businessId: 7, businessName: "Richie Tech", role: "owner", profileComplete: false }],
  activeBusiness: { businessId: 7, businessName: "Richie Tech", role: "owner", profileComplete: false },
};

const api = vi.hoisted(() => {
  const state = { me: null as unknown, loading: false, preview: undefined as unknown, previewLoading: false, acceptCalls: [] as unknown[], signInCalls: [] as unknown[], signOutCalls: 0, setData: [] as unknown[] };
  const replies: { accept?: unknown; signIn?: unknown; acceptError?: string; signInError?: string } = {};
  return { state, replies };
});

vi.mock("@/lib/trpc", () => ({
  trpc: {
    onboarding: {
      preview: { useQuery: () => ({ data: api.state.preview, isLoading: api.state.previewLoading }) },
      accept: {
        useMutation: (options: { onSuccess?: (v: unknown) => void; onError?: (e: Error) => void }) => ({
          isPending: false,
          mutate: (input: unknown) => {
            api.state.acceptCalls.push(input);
            if (api.replies.acceptError) options.onError?.(new Error(api.replies.acceptError));
            else options.onSuccess?.(api.replies.accept);
          },
        }),
      },
    },
    useUtils: () => ({ account: { me: { setData: (_: unknown, value: unknown) => api.state.setData.push(value) } } }),
    account: {
      me: { useQuery: () => ({ data: api.state.me, isLoading: api.state.loading, refetch: () => undefined }) },
      signIn: {
        useMutation: (options: { onSuccess?: (v: unknown) => void; onError?: (e: Error) => void }) => ({
          isPending: false,
          mutate: (input: unknown) => {
            api.state.signInCalls.push(input);
            if (api.replies.signInError) options.onError?.(new Error(api.replies.signInError));
            else options.onSuccess?.(api.replies.signIn);
          },
        }),
      },
      signOut: {
        useMutation: (options: { onSuccess?: () => void }) => ({
          isPending: false,
          mutate: () => {
            api.state.signOutCalls += 1;
            options.onSuccess?.();
          },
        }),
      },
    },
  },
}));

import OnboardingPage from "@/pages/OnboardingPage";
import LoginPage from "@/pages/LoginPage";
import AccountDashboard from "@/pages/AccountDashboard";

function renderAt(path: string, element: React.ReactElement) {
  const location = memoryLocation({ path, record: true });
  render(<Router hook={location.hook}>{element}</Router>);
  return location;
}

const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => {
  api.state.me = null;
  api.state.loading = false;
  api.state.preview = undefined;
  api.state.previewLoading = false;
  api.state.acceptCalls = [];
  api.state.signInCalls = [];
  api.state.signOutCalls = 0;
  api.state.setData = [];
  delete api.replies.accept;
  delete api.replies.signIn;
  delete api.replies.acceptError;
  delete api.replies.signInError;
});
afterEach(cleanup);

const INVITED = { available: true, email: "richie@example.com", fullName: "Richie Okafor", businessName: "Richie Tech" };
const renderOnboarding = () => renderAt("/onboarding/abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG", <Route path="/onboarding/:token" component={OnboardingPage} />);

describe("onboarding screen (invitation only)", () => {
  it("shows the five account fields, pre-filled from the invitation, with the email locked", () => {
    api.state.preview = INVITED;
    renderOnboarding();
    expect(screen.getByText("Create your account")).toBeTruthy();
    expect(Array.from(document.querySelectorAll("label")).map(label => label.textContent)).toEqual(["Full name", "Email", "Password", "Confirm password", "Business name"]);
    expect((screen.getByLabelText("Full name") as HTMLInputElement).value).toBe("Richie Okafor");
    expect((screen.getByLabelText("Business name") as HTMLInputElement).value).toBe("Richie Tech");
    const email = screen.getByLabelText("Email") as HTMLInputElement;
    expect(email.value).toBe("richie@example.com");
    expect(email.readOnly).toBe(true);
    expect(screen.getByRole("button", { name: "Create account" })).toBeTruthy();
  });

  it("asks for nothing beyond the account and the business name", () => {
    api.state.preview = INVITED;
    renderOnboarding();
    for (const unwanted of [/sector/i, /website/i, /year founded/i, /revenue/i, /phone/i, /address/i, /logo/i]) expect(screen.queryByLabelText(unwanted)).toBeNull();
  });

  it("validates in the browser before calling the server", () => {
    api.state.preview = INVITED;
    renderOnboarding();
    fill("Password", "short1");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByRole("alert").textContent).toMatch(/at least 10/);
    fill("Password", "correct horse 42");
    fill("Confirm password", "different 12345");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByRole("alert").textContent).toMatch(/does not match/);
    expect(api.state.acceptCalls).toEqual([]);
  });

  it("submits with the invitation token and the locked email, stores the session and lands on the dashboard", async () => {
    api.state.preview = INVITED;
    api.replies.accept = SESSION;
    const location = renderOnboarding();
    fill("Business name", "Richie Tech Ltd");
    fill("Password", "correct horse 42");
    fill("Confirm password", "correct horse 42");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(location.history.at(-1)).toBe("/dashboard"));
    expect(api.state.acceptCalls).toEqual([{ token: "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG", email: "richie@example.com", fullName: "Richie Okafor", businessName: "Richie Tech Ltd", password: "correct horse 42", confirmPassword: "correct horse 42" }]);
    expect(api.state.setData).toEqual([SESSION]);
  });

  it("shows the server's message and stays put when the invitation cannot be used", () => {
    api.state.preview = INVITED;
    api.replies.acceptError = "This invitation is unavailable. It may have expired or already been used. Ask the IPF team for a new link.";
    const location = renderOnboarding();
    fill("Password", "correct horse 42");
    fill("Confirm password", "correct horse 42");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByRole("alert").textContent).toContain("unavailable");
    expect(location.history.at(-1)).toContain("/onboarding/");
  });

  it("shows a clear message, and no form, for an invalid, expired, used or revoked link", () => {
    api.state.preview = { available: false };
    renderOnboarding();
    expect(screen.getByText("Invitation unavailable")).toBeTruthy();
    expect(screen.queryByLabelText("Password")).toBeNull();
    expect(screen.queryByRole("button", { name: "Create account" })).toBeNull();
  });

  it("waits for the server's answer before showing anything", () => {
    api.state.previewLoading = true;
    renderOnboarding();
    expect(screen.getByText("Checking your invitation…")).toBeTruthy();
    expect(screen.queryByLabelText("Password")).toBeNull();
  });

  it("sends an already signed-in visitor to the dashboard", async () => {
    api.state.me = SESSION;
    api.state.preview = INVITED;
    const location = renderOnboarding();
    await waitFor(() => expect(location.history.at(-1)).toBe("/dashboard"));
  });
});

describe("no public registration", () => {
  const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

  it("has no sign-up page, and /signup goes to sign-in instead of a form", () => {
    expect(existsSync(resolve(process.cwd(), "client/src/pages/SignUpPage.tsx"))).toBe(false);
    const app = read("client/src/App.tsx");
    expect(app).not.toMatch(/SignUpPage/);
    expect(app).toMatch(/<Route path="\/signup">\{\(\) => <Redirect to="\/login" \/>\}<\/Route>/);
    expect(app).toMatch(/<Route path="\/onboarding\/:token" component=\{OnboardingPage\} \/>/);
  });

  it("does not offer account creation on the sign-in page", () => {
    renderAt("/login", <LoginPage />);
    expect(screen.getByText("Client access is created during onboarding.")).toBeTruthy();
    expect(screen.queryByText(/create your account/i)).toBeNull();
    expect(document.querySelector('a[href="/signup"]')).toBeNull();
  });
});

describe("sign-in screen", () => {
  it("signs in and opens the dashboard", async () => {
    api.replies.signIn = SESSION;
    const location = renderAt("/login", <LoginPage />);
    fill("Email", "richie@example.com");
    fill("Password", "correct horse 42");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(location.history.at(-1)).toBe("/dashboard"));
    expect(api.state.signInCalls).toEqual([{ email: "richie@example.com", password: "correct horse 42" }]);
  });

  it("shows the generic failure message", () => {
    api.replies.signInError = "Your email or password is not correct.";
    renderAt("/login", <LoginPage />);
    fill("Email", "x@example.com");
    fill("Password", "whatever 12");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByRole("alert").textContent).toBe("Your email or password is not correct.");
  });

  it("does not loop: a signed-in visitor goes to the dashboard, an anonymous one stays", async () => {
    const anonymous = renderAt("/login", <LoginPage />);
    expect(anonymous.history).toEqual(["/login"]);
    cleanup();
    api.state.me = SESSION;
    const signedIn = renderAt("/login", <LoginPage />);
    await waitFor(() => expect(signedIn.history.at(-1)).toBe("/dashboard"));
  });
});

describe("account dashboard", () => {
  it("welcomes the person and shows their business workspace and incomplete profile", () => {
    api.state.me = SESSION;
    renderAt("/dashboard", <AccountDashboard />);
    expect(screen.getByRole("heading", { name: "Welcome, Richie" })).toBeTruthy();
    expect(screen.getByText("Richie Tech")).toBeTruthy();
    expect(screen.getByText("Incomplete")).toBeTruthy();
    expect(screen.getByText("richie@example.com")).toBeTruthy();
    expect(screen.getByText(/Your account is you\. Your business is the workspace/)).toBeTruthy();
    const complete = screen.getByRole("button", { name: "Complete business profile" }) as HTMLButtonElement;
    expect(complete.disabled).toBe(true);
    expect(screen.queryByText(/switch/i)).toBeNull();
  });

  it("redirects an anonymous visitor to the sign-in screen", async () => {
    const location = renderAt("/dashboard", <AccountDashboard />);
    await waitFor(() => expect(location.history.at(-1)).toBe("/login"));
  });

  it("waits for the server before deciding", () => {
    api.state.loading = true;
    const location = renderAt("/dashboard", <AccountDashboard />);
    expect(location.history).toEqual(["/dashboard"]);
    expect(screen.getByText("Loading…")).toBeTruthy();
  });

  it("signs out through the server and returns to sign-in", async () => {
    api.state.me = SESSION;
    const location = renderAt("/dashboard", <AccountDashboard />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(location.history.at(-1)).toBe("/login"));
    expect(api.state.signOutCalls).toBe(1);
    expect(api.state.setData).toEqual([null]);
  });

  it("lists businesses without a switcher when the person belongs to several", () => {
    api.state.me = { ...SESSION, activeBusiness: null, memberships: [...SESSION.memberships, { businessId: 8, businessName: "Second Co", role: "member", profileComplete: false }] };
    renderAt("/dashboard", <AccountDashboard />);
    expect(screen.getByText("Second Co")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /switch/i })).toBeNull();
  });
});
