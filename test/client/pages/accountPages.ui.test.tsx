/** @vitest-environment jsdom */

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import type { AccountSessionView } from "@shared/auth";

const SESSION: AccountSessionView = {
  user: { id: 1, fullName: "Richie Okafor", email: "richie@example.com" },
  memberships: [{ businessId: 7, businessName: "Richie Tech", role: "owner", profileComplete: false }],
  activeBusiness: { businessId: 7, businessName: "Richie Tech", role: "owner", profileComplete: false },
};

const api = vi.hoisted(() => {
  const state = { me: null as unknown, loading: false, signUpCalls: [] as unknown[], signInCalls: [] as unknown[], signOutCalls: 0, setData: [] as unknown[] };
  const replies: { signUp?: unknown; signIn?: unknown; signUpError?: string; signInError?: string } = {};
  return { state, replies };
});

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ account: { me: { setData: (_: unknown, value: unknown) => api.state.setData.push(value) } } }),
    account: {
      me: { useQuery: () => ({ data: api.state.me, isLoading: api.state.loading, refetch: () => undefined }) },
      signUp: {
        useMutation: (options: { onSuccess?: (v: unknown) => void; onError?: (e: Error) => void }) => ({
          isPending: false,
          mutate: (input: unknown) => {
            api.state.signUpCalls.push(input);
            if (api.replies.signUpError) options.onError?.(new Error(api.replies.signUpError));
            else options.onSuccess?.(api.replies.signUp);
          },
        }),
      },
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

import SignUpPage from "@/pages/SignUpPage";
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
  api.state.signUpCalls = [];
  api.state.signInCalls = [];
  api.state.signOutCalls = 0;
  api.state.setData = [];
  delete api.replies.signUp;
  delete api.replies.signIn;
  delete api.replies.signUpError;
  delete api.replies.signInError;
});
afterEach(cleanup);

describe("sign-up screen", () => {
  it("shows exactly the five requested fields and nothing else", () => {
    renderAt("/signup", <SignUpPage />);
    expect(screen.getByText("Create your account")).toBeTruthy();
    const labels = Array.from(document.querySelectorAll("label")).map(label => label.textContent);
    expect(labels).toEqual(["Full name", "Email", "Password", "Confirm password", "Business name"]);
    expect(screen.getByRole("button", { name: "Create account" })).toBeTruthy();
  });

  it("validates in the browser before calling the server", () => {
    renderAt("/signup", <SignUpPage />);
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByRole("alert").textContent).toMatch(/full name/i);
    fill("Full name", "Ada Example");
    fill("Email", "ada@example.com");
    fill("Password", "short1");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByRole("alert").textContent).toMatch(/at least 10/);
    fill("Password", "correct horse 42");
    fill("Confirm password", "different 12345");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByRole("alert").textContent).toMatch(/does not match/);
    expect(api.state.signUpCalls).toEqual([]);
  });

  it("submits, stores the returned session and lands on the dashboard", async () => {
    api.replies.signUp = SESSION;
    const location = renderAt("/signup", <SignUpPage />);
    fill("Full name", "Richie Okafor");
    fill("Email", "richie@example.com");
    fill("Password", "correct horse 42");
    fill("Confirm password", "correct horse 42");
    fill("Business name", "Richie Tech");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(location.history.at(-1)).toBe("/dashboard"));
    expect(api.state.signUpCalls).toEqual([{ fullName: "Richie Okafor", email: "richie@example.com", password: "correct horse 42", confirmPassword: "correct horse 42", businessName: "Richie Tech" }]);
    expect(api.state.setData).toEqual([SESSION]);
  });

  it("shows the server's message, for example a duplicate email, and stays put", () => {
    api.replies.signUpError = "An account with this email already exists. Try signing in.";
    const location = renderAt("/signup", <SignUpPage />);
    fill("Full name", "Richie Okafor");
    fill("Email", "richie@example.com");
    fill("Password", "correct horse 42");
    fill("Confirm password", "correct horse 42");
    fill("Business name", "Richie Tech");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByRole("alert").textContent).toContain("already exists");
    expect(location.history.at(-1)).toBe("/signup");
  });

  it("sends an already signed-in visitor to the dashboard instead of the form", async () => {
    api.state.me = SESSION;
    const location = renderAt("/signup", <SignUpPage />);
    await waitFor(() => expect(location.history.at(-1)).toBe("/dashboard"));
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
