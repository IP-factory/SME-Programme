/** @vitest-environment jsdom */

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MotionGlobalConfig } from "framer-motion";
import { evaluate } from "@shared/businessCheck/engine";
import { completeWith } from "../fixtures/businessCheckProfiles";

MotionGlobalConfig.skipAnimations = true;
// jsdom has no IntersectionObserver; scroll-triggered motion just needs it to exist.
globalThis.IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
} as unknown as typeof IntersectionObserver;

const TOKEN = "t".repeat(32);

/** Each mutation records its inputs; start answers with a token, like the server. */
const api = vi.hoisted(() => {
  const calls: Record<string, unknown[]> = { start: [], saveProgress: [], submit: [], requestNext: [] };
  const replies: Record<string, ((input: unknown) => unknown) | undefined> = {};
  const mutation = (name: string) => (options?: { onSuccess?: (data: unknown) => void }) => ({
    isPending: false,
    isError: false,
    error: null,
    reset: () => undefined,
    mutate: (input: unknown) => {
      calls[name].push(input);
      const reply = replies[name]?.(input);
      if (reply !== undefined) options?.onSuccess?.(reply);
    },
  });
  return { calls, replies, mutation };
});

vi.mock("@/lib/trpc", () => ({
  trpc: {
    businessCheck: {
      start: { useMutation: api.mutation("start") },
      saveProgress: { useMutation: api.mutation("saveProgress") },
      submit: { useMutation: api.mutation("submit") },
      requestNext: { useMutation: api.mutation("requestNext") },
    },
  },
}));

import BusinessCheck from "@/pages/BusinessCheck";

const STORAGE_KEY = "ipf-business-check-v1";
const pick = async (label: RegExp | string) => {
  fireEvent.click(await screen.findByRole("button", { name: label }));
};
const type = async (label: RegExp | string, value: string) => {
  fireEvent.change(await screen.findByRole("textbox", { name: label }), { target: { value } });
};
const preload = (state: Record<string, unknown>) =>
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ started: true, seen: [], history: [], contact: { fullName: "Ada Example", email: "ada@example.com", whatsapp: "", heardFrom: "" }, ...state }));

async function giveDetails() {
  await pick(/take the check/i);
  expect(await screen.findByText("First, who are we talking to?")).toBeTruthy();
  const boxes = screen.getAllByRole("textbox");
  fireEvent.change(boxes[0], { target: { value: "Ada Example" } });
  fireEvent.change(boxes[1], { target: { value: "ada@example.com" } });
  await pick(/start the check/i);
}

// The idea-stage test walks a whole question path in jsdom and takes about 4.5 s even on a quiet machine, so the default
// 5 s ceiling flaps with CPU load. Assertions are unchanged; this only stops a slow machine failing a correct test.
describe("business check page", { timeout: 20_000 }, () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.scrollTo = vi.fn();
    for (const name of Object.keys(api.calls)) api.calls[name] = [];
    api.replies.start = () => ({ token: TOKEN });
    api.replies.submit = undefined;
    api.replies.requestNext = (input) => ({ success: true, choice: (input as { choice: string }).choice });
  });
  afterEach(cleanup);

  it("asks who the owner is first, records them as a lead, then starts the questions", async () => {
    render(React.createElement(BusinessCheck));
    await pick(/take the check/i);
    expect(await screen.findByText("First, who are we talking to?")).toBeTruthy();
    expect(screen.getByText(/so our team can follow up if you don't finish/)).toBeTruthy();
    const start = screen.getByRole("button", { name: /start the check/i }) as HTMLButtonElement;
    expect(start.disabled).toBe(true);

    const boxes = screen.getAllByRole("textbox");
    fireEvent.change(boxes[0], { target: { value: " Ada Example " } });
    fireEvent.change(boxes[1], { target: { value: "ada@example.com" } });
    fireEvent.change(boxes[2], { target: { value: "+2348000000000" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "LinkedIn" } });
    fireEvent.click(start);

    expect(api.calls.start).toEqual([{ fullName: "Ada Example", email: "ada@example.com", whatsapp: "+2348000000000", heardFrom: "LinkedIn" }]);
    expect(await screen.findByText("What this means")).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).token).toBe(TOKEN);
  });

  it("asks the business's name and what it does inside the check, worded for an idea, and uses the name", async () => {
    render(React.createElement(BusinessCheck));
    await giveDetails();
    await pick(/questions/i);

    await pick(/I have an idea and haven't started/);
    await type("Does the idea have a name yet?", "Zobo Express");
    await pick(/^Continue/);
    expect(await screen.findByText("How will the business make money?")).toBeTruthy();
    expect(screen.getByText("Outline for Zobo Express")).toBeTruthy();
    await pick(/We make things/);
    await pick("Food and drink");
    expect(await screen.findByText("In one line, what is the idea?")).toBeTruthy();
    await pick(/^Skip/);

    // Founder readiness opens with its meaning and an example for someone leaving a job.
    expect(await screen.findByText("Founder readiness", { selector: "h2" })).toBeTruthy();
    expect(screen.getByText(/do well in a job/)).toBeTruthy();
    await pick(/questions/i);
    await pick(/Take charge/);
    await pick(/Direct and results-driven/);
    await pick("On my own");
    await pick(/comes naturally/);
    await pick(/learned by doing/);
    await pick(/Read a profit and loss statement/);
    await pick(/^Continue/);
    await pick(/^5 or more/);

    expect(await screen.findByText("Strategic intent: your idea", { selector: "h2" })).toBeTruthy();
    expect(screen.getByText(/juice brand/)).toBeTruthy();
    expect(screen.queryByText("How long has it been trading?")).toBeNull();
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).answers;
    expect(saved).toMatchObject({ p_stage: "idea", p_name: "Zobo Express", p_description: "" });
  });

  it("saves progress to the server shortly after each answer", async () => {
    render(React.createElement(BusinessCheck));
    await giveDetails();
    await pick(/questions/i);
    await pick(/I run my business full-time/);
    await waitFor(() => expect(api.calls.saveProgress.length).toBeGreaterThan(0), { timeout: 3000 });
    expect(api.calls.saveProgress.at(-1)).toEqual({ token: TOKEN, answers: { p_stage: "operating" } });
  });

  it("goes back to the previous question", async () => {
    render(React.createElement(BusinessCheck));
    await giveDetails();
    await pick(/questions/i);
    await pick(/I run my business full-time/);
    await screen.findByText("What is the business called?");
    await pick(/back/i);
    expect(await screen.findByText("Which best describes you today?")).toBeTruthy();
  });

  it("asks for the details first when resuming a check started before they were given", async () => {
    preload({ answers: { p_stage: "operating" }, history: ["p_stage"], seen: ["profile"] });
    render(React.createElement(BusinessCheck));
    expect(await screen.findByText("First, who are we talking to?")).toBeTruthy();
  });

  it("sends the check straight after the last question, with no form at the end", async () => {
    const answers = completeWith({ p_stage: "operating", p_type: "trader", p_sector: "retail", p_age: "2to5", p_staff: "3to5", p_revenue: "3to5m", p_trend: "flat" });
    preload({ token: TOKEN, answers, history: Object.keys(answers), seen: ["profile", "founder", "intent", "market", "offer", "model", "sales", "operations", "finance", "risk"] });
    render(React.createElement(BusinessCheck));
    expect(await screen.findByText("Reading your answers")).toBeTruthy();
    await waitFor(() => expect(api.calls.submit).toEqual([{ token: TOKEN, answers }]));
    expect(screen.queryByText("Where should we send your summary?")).toBeNull();
  });

  it("shows the summary, the outline and the free call as the next step", async () => {
    const answers = { p_stage: "operating", p_name: "Ada Foods", p_type: "maker", p_age: "2to5", p_staff: "6to10", p_revenue: "3to5m", f_instinct: "S", f_seen: "S", f_team: "solo", f_tough: "nobody", f_hours: "lt2", s7_status: "tight_guess" };
    const result = evaluate(answers);
    const response = { token: TOKEN, result, summary: { found: "Found text for the test.", think: "Think text for the test.", next: "Book the free call.", offerings: [{ id: "financial-performance", name: "Financial Performance & Decision Support", why: "Your prices are guesses." }] }, summarySource: "AI", discoveryCallUrl: "", emailStatus: "Sent" };
    preload({ token: TOKEN, answers, response });
    render(React.createElement(BusinessCheck));
    expect(screen.getByText("What we found")).toBeTruthy();
    expect(screen.getByText(/Your business check · Ada Foods/)).toBeTruthy();
    expect(screen.getByText("Think text for the test.")).toBeTruthy();
    expect(screen.getByText("7. Financials")).toBeTruthy();
    expect(screen.getByText(/Nobody in the business reliably makes the hard call/)).toBeTruthy();
    expect(screen.getByText("Finance & Capital")).toBeTruthy();
    expect(screen.getByText(/₦100,000/)).toBeTruthy();
    // With no booking page, the button says what it does: it requests a call, it does not book one.
    expect(screen.queryByRole("button", { name: /book my free call/i })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /request my free 20-minute call/i }));
    expect(api.calls.requestNext).toEqual([{ token: TOKEN, choice: "call" }]);
  });

  describe("result page, honest about email and about the call", () => {
    const answers = { p_stage: "operating", p_name: "Ada Foods", p_type: "maker", p_age: "2to5", p_staff: "6to10", p_revenue: "3to5m", f_instinct: "S", f_seen: "S", f_team: "solo", f_tough: "nobody", f_hours: "lt2", s7_status: "tight_guess" };
    const responseWith = (extra: Record<string, unknown>) => ({ token: TOKEN, result: evaluate(answers), summary: { found: "Found.", think: "Think.", next: "Next.", offerings: [] }, summarySource: "Rules", discoveryCallUrl: "", ...extra });

    it("says a copy was sent only when the email was actually sent", () => {
      preload({ token: TOKEN, answers, response: responseWith({ emailStatus: "Sent" }) });
      render(React.createElement(BusinessCheck));
      expect(screen.getByText(/A copy has been sent to/)).toBeTruthy();
      expect(screen.queryByText(/Email delivery is not active yet/)).toBeNull();
    });

    it.each([["Simulated"], ["Failed"], [undefined]])("does not claim an email was sent when delivery was %s", status => {
      preload({ token: TOKEN, answers, response: responseWith({ emailStatus: status }) });
      render(React.createElement(BusinessCheck));
      expect(screen.getByText("Your result has been saved. Email delivery is not active yet.")).toBeTruthy();
      expect(screen.queryByText(/on its way/)).toBeNull();
      expect(screen.queryByText(/A copy has been sent/)).toBeNull();
    });

    it("confirms the request without claiming a time has been booked", async () => {
      preload({ token: TOKEN, answers, response: responseWith({ emailStatus: "Simulated" }) });
      api.replies.requestNext = () => ({ success: true, choice: "call" });
      render(React.createElement(BusinessCheck));
      fireEvent.click(screen.getByRole("button", { name: /request my free 20-minute call/i }));
      expect(await screen.findByText(/Thank you\. Your request has been sent to the IPF team\. We will contact you by (WhatsApp or )?email to agree a time\./)).toBeTruthy();
      expect(document.body.textContent).not.toMatch(/within one working day|your slot|is booked|has been booked/i);
    });
  });
});
