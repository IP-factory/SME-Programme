/** @vitest-environment jsdom */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    registration: {
      submit: {
        useMutation: () => ({ isPending: false, mutate: vi.fn() }),
      },
    },
  },
}));

import DiagnosticRegistrationDialog from "@/components/DiagnosticRegistrationDialog";

const weakAreaOptions = [
  "Strategy and direction",
  "Business model and pricing",
  "Market and competition",
  "Brand, marketing and sales",
  "Operations and systems",
  "Finance, cash and funding",
  "People and organisation",
  "Risk and what could go wrong",
  "Exit and succession",
];

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
});

describe("diagnostic form competency choices", () => {
  it("renders every weak-area option exactly once on Step 3", () => {
    render(
      React.createElement(DiagnosticRegistrationDialog, {
        open: true,
        onOpenChange: vi.fn(),
        selectedPackage: "Foundation",
      }),
    );

    fireEvent.change(screen.getByPlaceholderText("Your full name"), { target: { value: "Test Applicant" } });
    fireEvent.change(screen.getByPlaceholderText("you@company.com"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("+234 ..."), { target: { value: "+2348000000000" } });
    fireEvent.change(screen.getByPlaceholderText("Your business name"), { target: { value: "Test Business" } });
    fireEvent.change(screen.getByPlaceholderText("One plain-language sentence. No adjectives."), { target: { value: "We make useful things for growing businesses." } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    for (const option of [
      "Idea stage, not trading yet",
      "No revenue yet",
      "Just me",
      "Growing fast",
      "I turn input into units, I make things",
    ]) {
      fireEvent.click(screen.getByRole("button", { name: option }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    for (const option of weakAreaOptions) {
      expect(screen.getAllByRole("button", { name: option })).toHaveLength(1);
    }
  });
});
