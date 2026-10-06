/** @vitest-environment jsdom */

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyStructuredDiagnosticDraft } from "../shared/structuredDiagnostic";

const saveMutation = { isPending: false, mutate: vi.fn() };
const reportMutation = { isPending: false, mutate: vi.fn() };
const workingReportQuery = { data: null, isFetching: false, refetch: vi.fn() };
const reportPdfQuery = { isFetching: false, refetch: vi.fn() };
const queryData = {
  draft: {
    ...emptyStructuredDiagnosticDraft(),
    activeSection: "numbers" as const,
    completedSections: ["confirm", "shape"] as const,
    section1: {
      businessName: "Test Business",
      businessDescription: "A clear test business description.",
      businessAge: "1 to 3 years",
      engine: "Experts",
      primaryConstraint: "Need a clearer route to growth.",
    },
    section2: {
      payers: ["Consumers"],
      legalStructure: "Limited company",
      ownership: "I own all of it",
      paymentApproval: "Only me",
      fullTimeTeam: "2 to 5",
      partTimeTeam: "None",
      contractors: "1",
    },
  },
};

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ participant: { getStructuredDiagnostic: { invalidate: vi.fn() } } }),
    participant: {
      getStructuredDiagnostic: { useQuery: () => ({ data: queryData, isLoading: false, error: null }) },
      saveStructuredDiagnostic: { useMutation: () => saveMutation },
      getWorkingDiagnosticReport: { useQuery: () => workingReportQuery },
      generateWorkingDiagnosticReport: { useMutation: () => reportMutation },
      downloadWorkingDiagnosticReportPdf: { useQuery: () => reportPdfQuery },
      emailWorkingDiagnosticReport: { useMutation: () => reportMutation },
    },
  },
}));

import { StructuredDiagnostic } from "@/components/StructuredDiagnostic";

describe("structured diagnostic continuation", () => {
  afterEach(() => cleanup());

  it("opens the Numbers questions with a clear forward action instead of the former first-stage placeholder", () => {
    render(<StructuredDiagnostic />);

    expect(screen.getByText("The numbers", { exact: true })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue to founder context" })).toBeTruthy();
    expect(screen.queryByText("Your first two sections are safely saved")).toBeNull();
    expect(screen.queryByText(/being prepared as the next stage/i)).toBeNull();
  });

  it("moves a completed numbers section into the founder questions", () => {
    render(<StructuredDiagnostic />);

    for (const option of ["Trading with recurring revenue", "₦5m–₦25m", "A reasonable estimate", "A working forecast or budget", "3–6 months"]) {
      fireEvent.click(screen.getByRole("radio", { name: option }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Continue to founder context" }));

    expect(screen.getByText("You, the founder", { exact: true })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue to future direction" })).toBeTruthy();
  });
});
