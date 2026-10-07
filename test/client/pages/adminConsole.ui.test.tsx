/** @vitest-environment jsdom */

import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminCan, visibleAdminSections } from "@/lib/adminSections";

const hoisted = vi.hoisted(() => {
  const api = {
  checks: [] as unknown[],
  calls: [] as unknown[],
  clients: [] as unknown[],
  candidates: [] as unknown[],
  invitations: [] as unknown[],
  metrics: { businessChecks: 3, users: 2, portalUsers: 1, businesses: 1, memberships: 1, pendingInvitations: 0, platformRoleAssignments: 0 },
  error: undefined as { message: string } | undefined,
  mutations: { schedule: [] as unknown[], outcome: [] as unknown[], invite: [] as unknown[], revoke: [] as unknown[] },
  inviteResult: { invitationUrl: "https://app.example.test/onboarding/TOKEN123", deliveryStatus: "Simulated", expiresAt: new Date(), invitationId: 1 } as Record<string, unknown>,
};
  const query = (key: "checks" | "calls" | "clients" | "candidates" | "invitations" | "metrics") => () => ({ data: api[key], isLoading: false, error: api.error });
  const mutation = (bucket: keyof typeof api.mutations, result?: () => unknown) => (options?: { onSuccess?: (data: unknown, variables: unknown) => void }) => ({
    isPending: false,
    mutate: (input: unknown) => {
      api.mutations[bucket].push(input);
      options?.onSuccess?.(result?.() ?? { success: true }, input);
    },
  });
  const invalidate = { invalidate: () => undefined };
  return { api, query, mutation, invalidate };
});
const { api } = hoisted;

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ businessSupport: { discoveryCalls: hoisted.invalidate, checks: hoisted.invalidate }, onboarding: { candidates: hoisted.invalidate, invitations: hoisted.invalidate, metrics: hoisted.invalidate } }),
    businessSupport: {
      checks: { useQuery: hoisted.query("checks") },
      discoveryCalls: { useQuery: hoisted.query("calls") },
      clients: { useQuery: hoisted.query("clients") },
      scheduleCall: { useMutation: hoisted.mutation("schedule") },
      recordOutcome: { useMutation: hoisted.mutation("outcome") },
    },
    onboarding: {
      candidates: { useQuery: hoisted.query("candidates") },
      invitations: { useQuery: hoisted.query("invitations") },
      metrics: { useQuery: hoisted.query("metrics") },
      invite: { useMutation: hoisted.mutation("invite", () => hoisted.api.inviteResult) },
      revoke: { useMutation: hoisted.mutation("revoke") },
    },
  },
}));

import BusinessSupportConsole from "@/components/admin/BusinessSupportConsole";

const SUPER = { isSuperAdmin: true, isOwner: true, permissions: ["manage_client_onboarding", "view_participants"], platformPermissions: ["manage_client_onboarding", "view_all_businesses"], email: "owner@example.test", platformRoles: ["super_admin", "admin"] };
const check = (over: Record<string, unknown> = {}) => ({
  id: 1, fullName: "Ada Okafor", businessName: "Ada Foods", email: "ada@example.test", whatsapp: "+2348000000001", stage: "operating", route: "programme", readiness: "intermediate", primaryArea: 7,
  pipelineStage: "call_booked", callRequestedAt: new Date("2026-10-05T10:00:00Z"), callScheduledFor: null, reportRequestedAt: null, completedAt: new Date("2026-10-05T09:00:00Z"), createdAt: new Date("2026-10-05T08:00:00Z"), invitationStatus: null, ...over,
});
const renderConsole = (access: Record<string, unknown> = SUPER) =>
  render(<BusinessSupportConsole access={access as never} team={<div>TEAM PANEL</div>} jump={<div>JUMP REGISTRATION DESK</div>} />);
const tabs = () => within(screen.getByRole("navigation", { name: "Admin sections" })).getAllByRole("button").map(button => button.textContent);

beforeEach(() => {
  api.checks = [check(), check({ id: 2, fullName: "Bola Quiet", businessName: "Bola Bakes", email: "bola@example.test", whatsapp: null, pipelineStage: "qualified_lead", callRequestedAt: null })];
  api.calls = [check()];
  api.clients = [];
  api.candidates = [check()];
  api.invitations = [];
  api.error = undefined;
  api.mutations = { schedule: [], outcome: [], invite: [], revoke: [] };
  api.inviteResult = { invitationUrl: "https://app.example.test/onboarding/TOKEN123", deliveryStatus: "Simulated", expiresAt: new Date(), invitationId: 1 };
});
afterEach(cleanup);

describe("which sections each person sees (decided from what the server resolved)", () => {
  it("shows the Super Admin every section, in funnel order, opening on Business Checks", () => {
    expect(visibleAdminSections(SUPER).map(section => section.id)).toEqual(["checks", "calls", "onboarding", "clients", "team", "jump"]);
    renderConsole();
    expect(tabs()).toEqual(["Business Checks", "Discovery Calls", "Client Onboarding", "Clients", "Admin Team", "JUMP programme (legacy)"]);
    expect(screen.getByRole("button", { name: "Business Checks" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("heading", { name: "Business Checks" })).toBeTruthy();
    expect(screen.queryByText("JUMP REGISTRATION DESK")).toBeNull();
  });

  it("keeps the JUMP desk, unmixed, in its own legacy section", () => {
    renderConsole();
    expect(screen.queryByText("JUMP REGISTRATION DESK")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "JUMP programme (legacy)" }));
    expect(screen.getByText("JUMP REGISTRATION DESK")).toBeTruthy();
    expect(screen.queryByText("Ada Okafor")).toBeNull();
  });

  it("shows the Client Onboarding section to the Super Admin without any hardcoded identity", () => {
    renderConsole();
    fireEvent.click(screen.getByRole("button", { name: "Client Onboarding" }));
    expect(screen.getByRole("heading", { name: "Client Onboarding" })).toBeTruthy();
    // Even a Super Admin reported only by the flag (no listed permissions) sees it: the server's answer decides.
    expect(adminCan({ isSuperAdmin: true, permissions: [] }, "manage_client_onboarding")).toBe(true);
    expect(visibleAdminSections({ isSuperAdmin: true, permissions: [] }).map(section => section.id)).toContain("onboarding");
  });

  it("shows an administrator only what they were granted", () => {
    const onboarding = { permissions: ["manage_client_onboarding"], platformPermissions: ["manage_client_onboarding"] };
    expect(visibleAdminSections(onboarding).map(section => section.id)).toEqual(["checks", "calls", "onboarding"]);
    expect(visibleAdminSections({ permissions: [], platformPermissions: ["view_all_businesses"] }).map(section => section.id)).toEqual(["clients"]);
    expect(visibleAdminSections({ permissions: ["view_participants"] }).map(section => section.id)).toEqual(["jump"]);
    expect(visibleAdminSections({ permissions: [] })).toEqual([]);
    expect(visibleAdminSections(undefined)).toEqual([]);
    expect(adminCan({ permissions: [], isOwner: false }, "manage_client_onboarding")).toBe(false);
  });

  it("says plainly when an account has no responsibilities yet, instead of showing an empty console", () => {
    renderConsole({ permissions: [], platformPermissions: [], email: "analyst@example.test", platformRoles: ["analyst"] });
    expect(screen.getByRole("note").textContent).toMatch(/no admin responsibilities/);
    expect(screen.queryByRole("navigation", { name: "Admin sections" })).toBeNull();
    expect(screen.getByText(/analyst@example\.test · analyst/)).toBeTruthy();
  });

  it("tells the person who is signed in and with which roles", () => {
    renderConsole();
    expect(screen.getByText("Signed in as owner@example.test · super admin, admin")).toBeTruthy();
  });
});

describe("Business Checks view", () => {
  it("lists prospects with the details the team needs", () => {
    renderConsole();
    const row = screen.getByText("Ada Okafor").closest("tr")!;
    for (const text of ["Ada Foods", "ada@example.test", "+2348000000001", "5 Oct 2026", "Financials", "Yes, 5 Oct 2026", "Call booked"]) expect(row.textContent).toContain(text);
    expect(row.textContent).toMatch(/Intermediate|intermediate/);
    expect(within(screen.getByText("Bola Quiet").closest("tr")!).getByText("No")).toBeTruthy();
  });

  it("searches and filters without any new data", () => {
    renderConsole();
    fireEvent.change(screen.getByLabelText("Search business checks"), { target: { value: "bola" } });
    expect(screen.queryByText("Ada Okafor")).toBeNull();
    expect(screen.getByText("Bola Quiet")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Search business checks"), { target: { value: "" } });
    fireEvent.click(screen.getByLabelText("Call requested only"));
    expect(screen.queryByText("Bola Quiet")).toBeNull();
    expect(screen.getByText("Ada Okafor")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Call requested only"));
    fireEvent.change(screen.getByLabelText("Filter by stage"), { target: { value: "qualified_lead" } });
    expect(screen.queryByText("Ada Okafor")).toBeNull();
    expect(screen.getByText("Bola Quiet")).toBeTruthy();
  });

  it("shows an unfinished check as not finished", () => {
    api.checks = [check({ completedAt: null, readiness: null, route: null, primaryArea: null, pipelineStage: "lead", callRequestedAt: null })];
    renderConsole();
    expect(screen.getByText("Not finished")).toBeTruthy();
  });

  it("shows the server's refusal", () => {
    api.error = { message: "Your role does not include this responsibility." };
    renderConsole();
    expect(screen.getByRole("alert").textContent).toContain("does not include");
  });
});

describe("Discovery Calls view", () => {
  const open = () => { renderConsole(); fireEvent.click(screen.getByRole("button", { name: "Discovery Calls" })); };

  it("lists people who asked for a call, with the actions to run it", () => {
    open();
    const row = screen.getByText("Ada Okafor").closest("tr")!;
    expect(row.textContent).toContain("Not scheduled");
    for (const name of ["Mark call scheduled", "Mark fit", "Refer", "Decline"]) expect(within(row).getByRole("button", { name })).toBeTruthy();
    expect(screen.queryByText("Bola Quiet")).toBeNull();
  });

  it("records the agreed time only once a time is chosen", () => {
    open();
    const schedule = screen.getByRole("button", { name: "Mark call scheduled" }) as HTMLButtonElement;
    expect(schedule.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Call time for Ada Okafor"), { target: { value: "2026-10-12T14:30" } });
    expect(schedule.disabled).toBe(false);
    fireEvent.click(schedule);
    expect(api.mutations.schedule).toEqual([{ businessCheckId: 1, scheduledFor: new Date("2026-10-12T14:30") }]);
  });

  it.each([["Mark fit", "fit"], ["Refer", "refer"], ["Decline", "decline"]])("%s records the outcome", (label, outcome) => {
    open();
    fireEvent.click(screen.getByRole("button", { name: label }));
    expect(api.mutations.outcome).toEqual([{ businessCheckId: 1, outcome }]);
  });

  it("says so when no one has asked yet", () => {
    api.calls = [];
    open();
    expect(screen.getByText("No one has asked for a discovery call yet.")).toBeTruthy();
  });
});

describe("Client Onboarding view", () => {
  const open = () => { renderConsole(); fireEvent.click(screen.getByRole("button", { name: "Client Onboarding" })); };

  it("warns that payment is not automated before any link is generated", () => {
    open();
    expect(screen.getByRole("note").textContent).toBe("Payment confirmation is not automated yet. Confirm the client is approved to proceed before generating an onboarding link.");
  });

  it("shows the call, the stage, the email and the link state for each business check", () => {
    api.candidates = [check({ invitationStatus: "pending" }), check({ id: 2, fullName: "Bola Quiet", email: "bola@example.test", callRequestedAt: null, pipelineStage: "qualified_lead", invitationStatus: null })];
    open();
    const ada = screen.getByText("Ada Okafor").closest("tr")!;
    for (const text of ["Ada Foods", "ada@example.test", "Requested 5 Oct 2026", "Call requested", "Link sent, waiting"]) expect(ada.textContent).toContain(text);
    const bola = screen.getByText("Bola Quiet").closest("tr")!;
    for (const text of ["Not requested", "Qualified lead", "None"]) expect(bola.textContent).toContain(text);
  });

  it("generates a link and, when no email went out, says to copy it and send it manually", () => {
    open();
    fireEvent.click(screen.getAllByRole("button", { name: "Invite to onboard" })[0]);
    expect(api.mutations.invite).toEqual([{ businessCheckId: 1 }]);
    const link = screen.getByLabelText("Onboarding link") as HTMLInputElement;
    expect(link.value).toBe("https://app.example.test/onboarding/TOKEN123");
    expect(screen.getByRole("status").textContent).toContain("Email not sent. Copy this secure link and send it to the client manually.");
    expect(screen.getByRole("button", { name: "Copy" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(screen.queryByLabelText("Onboarding link")).toBeNull();
  });

  it("does not tell the admin to send it manually when the email really went out", () => {
    api.inviteResult = { ...api.inviteResult, deliveryStatus: "Sent" };
    open();
    fireEvent.click(screen.getAllByRole("button", { name: "Invite to onboard" })[0]);
    const status = screen.getByRole("status").textContent!;
    expect(status).toContain("also emailed to the client");
    expect(status).not.toContain("Email not sent");
  });

  it("separates the people and workspaces from the prospects in the counts", () => {
    open();
    const counts = Object.fromEntries(Array.from(document.querySelectorAll("dl > div")).map(item => [item.querySelector("dt")!.textContent, item.querySelector("dd")!.textContent]));
    expect(counts).toMatchObject({ "Business checks": "3", "Portal users": "1", Businesses: "1", Memberships: "1" });
  });
});

describe("Clients view", () => {
  it("lists onboarded businesses and their people, never prospects", () => {
    api.clients = [{ membershipId: 1, businessId: 7, businessName: "Richie Tech", businessStatus: "active", userId: 3, userName: "Richie Okafor", email: "richie@example.test", role: "owner", membershipStatus: "active", joinedAt: new Date("2026-10-06T10:00:00Z"), businessCreatedAt: new Date("2026-10-06T10:00:00Z") }];
    renderConsole();
    fireEvent.click(screen.getByRole("button", { name: "Clients" }));
    const row = screen.getByText("Richie Tech").closest("tr")!;
    for (const text of ["Richie Okafor", "richie@example.test", "Owner", "6 Oct 2026"]) expect(row.textContent).toContain(text);
    expect(screen.getByText(/1 business, 1 membership\./)).toBeTruthy();
    expect(screen.queryByText("Ada Okafor")).toBeNull();
  });

  it("says so when there are no clients yet", () => {
    renderConsole();
    fireEvent.click(screen.getByRole("button", { name: "Clients" }));
    expect(screen.getByText("No clients have been onboarded yet.")).toBeTruthy();
  });
});
