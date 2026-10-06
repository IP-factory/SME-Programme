// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyStructuredDiagnosticDraft } from "../shared/structuredDiagnostic";

const completeDiagnostic = {
  draft: {
    ...emptyStructuredDiagnosticDraft(),
    activeSection: "future" as const,
    completedSections: ["confirm", "shape", "numbers", "founder", "future"] as const,
  },
};

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ participant: { getStructuredDiagnostic: { invalidate: vi.fn() } } }),
    participant: {
      getStructuredDiagnostic: { useQuery: () => ({ data: completeDiagnostic, isLoading: false, error: null }) },
      saveStructuredDiagnostic: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      getWorkingDiagnosticReport: { useQuery: () => ({ data: null, isFetching: false, refetch: vi.fn() }) },
      generateWorkingDiagnosticReport: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      downloadWorkingDiagnosticReportPdf: { useQuery: () => ({ isFetching: false, refetch: vi.fn() }) },
      emailWorkingDiagnosticReport: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
    },
  },
}));

import { StructuredDiagnostic } from "@/components/StructuredDiagnostic";

describe("working diagnostic report controls", () => {
  afterEach(() => cleanup());

  it("offers the participant a qualified working-report action only after every diagnostic section is complete", () => {
    render(<StructuredDiagnostic />);

    expect(screen.getByText("Your Current State Working Diagnostic")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create my working diagnostic" })).toBeTruthy();
    expect(screen.getByText(/not a final strategy, audit, valuation/i)).toBeTruthy();
  });
});
