/** @vitest-environment jsdom */

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MotionGlobalConfig } from "framer-motion";
import { evaluate } from "../shared/businessCheck/engine";

MotionGlobalConfig.skipAnimations = true;
// jsdom has no IntersectionObserver; scroll-triggered motion just needs it to exist.
globalThis.IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
} as unknown as typeof IntersectionObserver;

const submit = { isPending: false, mutate: vi.fn(), reset: vi.fn() };
const requestNext = { isPending: false, mutate: vi.fn(), error: null };

vi.mock("@/lib/trpc", () => ({
  trpc: {
    businessCheck: {
      submit: { useMutation: () => submit },
      requestNext: { useMutation: () => requestNext },
    },
  },
}));

import BusinessCheck from "@/pages/BusinessCheck";

const pick = async (label: RegExp | string) => {
  fireEvent.click(await screen.findByRole("button", { name: label }));
};

describe("business check page", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.scrollTo = vi.fn();
    submit.mutate.mockReset();
  });
  afterEach(cleanup);

  it("walks an idea-stage founder through founder readiness and the idea, never the trading questions", async () => {
    render(React.createElement(BusinessCheck));
    await pick(/take the check/i);
    expect(await screen.findByText("What this means")).toBeTruthy();
    await pick(/questions/i);

    await pick(/I have an idea and haven't started/);
    expect(await screen.findByText("How will the business make money?")).toBeTruthy();
    await pick(/We make things/);
    await pick("Food and drink");

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
    await pick("5 or more");

    expect(await screen.findByText("Strategic intent: your idea", { selector: "h2" })).toBeTruthy();
    expect(screen.getByText(/juice brand/)).toBeTruthy();
    expect(screen.queryByText("How long has it been trading?")).toBeNull();
  });

  it("goes back to the previous question", async () => {
    render(React.createElement(BusinessCheck));
    await pick(/take the check/i);
    await pick(/questions/i);
    await pick(/I run my business full-time/);
    await screen.findByText("How long has the business been trading?");
    await pick(/back/i);
    expect(await screen.findByText("Which best describes you today?")).toBeTruthy();
  });

  it("asks for contact details last and sends the cleaned answers", async () => {
    const answers = { p_stage: "operating", p_type: "trader", p_sector: "retail", p_age: "2to5", p_staff: "3to5", p_revenue: "3to5m", p_trend: "flat", f_instinct: "C", f_seen: "S", f_team: "cofounder", f_education: "degree", f_finance: ["pl"], f_hours: "2to4", s1_status: "clear", s2_status: "clear", s3_status: "clear", s4_status: "clear", s5_status: "clear", s6_status: "clear", s7_status: "clear", s8_status: "clear" };
    window.localStorage.setItem("ipf-business-check-v1", JSON.stringify({ started: true, answers, seen: ["profile", "founder", "intent", "market", "offer", "model", "sales", "operations", "finance", "risk"], history: Object.keys(answers), contact: { fullName: "", email: "", whatsapp: "", businessName: "", description: "", heardFrom: "" } }));
    render(React.createElement(BusinessCheck));
    expect(await screen.findByText("Where should we send your summary?")).toBeTruthy();
    const submitButton = screen.getByRole("button", { name: /see my result/i }) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "Ada Example" } });
    fireEvent.change(screen.getAllByRole("textbox")[1], { target: { value: "ada@example.com" } });
    fireEvent.click(submitButton);
    await waitFor(() => expect(submit.mutate).toHaveBeenCalled());
    const sent = submit.mutate.mock.calls[0][0];
    expect(sent.contact).toMatchObject({ fullName: "Ada Example", email: "ada@example.com" });
    expect(sent.answers).toEqual(answers);
  });

  it("shows the summary, the outline and the free call as the next step", async () => {
    const answers = { p_stage: "operating", p_type: "maker", p_age: "2to5", p_staff: "6to10", p_revenue: "3to5m", f_instinct: "S", f_seen: "S", f_team: "solo", f_tough: "nobody", f_hours: "lt2", s7_status: "tight_guess" };
    const result = evaluate(answers);
    const response = { token: "t".repeat(32), result, summary: { found: "Found text for the test.", think: "Think text for the test.", next: "Book the free call.", offerings: [{ id: "financial-performance", name: "Financial Performance & Decision Support", why: "Your prices are guesses." }] }, summarySource: "AI", discoveryCallUrl: "" };
    window.localStorage.setItem("ipf-business-check-v1", JSON.stringify({ started: true, answers, seen: [], history: [], contact: { fullName: "Ada", email: "ada@example.com", whatsapp: "", businessName: "Ada Foods", description: "", heardFrom: "" }, response }));
    render(React.createElement(BusinessCheck));
    expect(screen.getByText("What we found")).toBeTruthy();
    expect(screen.getByText("Think text for the test.")).toBeTruthy();
    expect(screen.getByText("7. Financials")).toBeTruthy();
    expect(screen.getByText(/Nobody in the business reliably makes the hard call/)).toBeTruthy();
    expect(screen.getByText("Finance & Capital")).toBeTruthy();
    expect(screen.getByText(/₦100,000/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /book my free call/i }));
    expect(requestNext.mutate).toHaveBeenCalledWith({ token: "t".repeat(32), choice: "call" });
  });
});
