import { describe, expect, it } from "vitest";
import { toggleVisibleApplicantSelection } from "@shared/applicantSelection";

describe("filtered applicant selection", () => {
  it("selects only the applicants in the current filtered result", () => {
    expect(toggleVisibleApplicantSelection([91], [12, 14])).toEqual([91, 12, 14]);
  });

  it("clears only the visible filtered applicants while preserving a selection from another filter", () => {
    expect(toggleVisibleApplicantSelection([91, 12, 14], [12, 14])).toEqual([91]);
  });

  it("does not alter the selection when no applicants are visible", () => {
    expect(toggleVisibleApplicantSelection([12], [])).toEqual([12]);
  });
});
