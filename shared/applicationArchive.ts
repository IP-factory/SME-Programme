/**
 * Owner-only archive policy for removing an application from the active JUMP desk.
 * The original record is preserved; the rejected status also disables booking guards.
 */
export function isActiveApplication(archivedAt: Date | null | undefined) {
  return !archivedAt;
}

export function archiveApplicationFields(ownerUserId: number, archivedAt = new Date()) {
  return {
    archivedAt,
    archivedByUserId: ownerUserId,
    status: "Rejected" as const,
  };
}
