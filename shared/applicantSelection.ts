/**
 * Select or clear only the applicants currently visible in the filtered admin list.
 * Selections from a previous filter remain intact until their own visible set is cleared.
 */
export function toggleVisibleApplicantSelection(currentIds: number[], visibleIds: number[]): number[] {
  if (visibleIds.length === 0) return currentIds;

  const visibleSet = new Set(visibleIds);
  const allVisibleSelected = visibleIds.every((id) => currentIds.includes(id));

  if (allVisibleSelected) return currentIds.filter((id) => !visibleSet.has(id));
  return Array.from(new Set([...currentIds, ...visibleIds]));
}
