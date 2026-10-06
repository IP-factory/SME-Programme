export const CURRENT_STATUS_ASSESSMENT_FIELDS = [
  "businessModelSummary",
  "currentRevenueStage",
  "primaryBottleNeck",
  "teamAndOperations",
  "financialVisibility",
  "desiredSixMonthOutcome",
] as const;

export type CurrentStatusAssessmentField = (typeof CURRENT_STATUS_ASSESSMENT_FIELDS)[number];

export type CurrentStatusAssessmentDraft = Partial<
  Record<CurrentStatusAssessmentField, string | undefined>
> & {
  additionalNotes?: string;
};

export function calculateAssessmentProgress(assessment: CurrentStatusAssessmentDraft | null | undefined) {
  const completed = CURRENT_STATUS_ASSESSMENT_FIELDS.filter((field) => {
    const value = assessment?.[field];
    return typeof value === "string" && value.trim().length > 0;
  }).length;

  const total = CURRENT_STATUS_ASSESSMENT_FIELDS.length;
  return {
    completed,
    total,
    percentage: Math.round((completed / total) * 100),
  };
}

export function isAssessmentComplete(assessment: CurrentStatusAssessmentDraft | null | undefined) {
  return calculateAssessmentProgress(assessment).completed === CURRENT_STATUS_ASSESSMENT_FIELDS.length;
}
