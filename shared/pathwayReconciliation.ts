export const JUMP_PATHWAYS = ["Foundation", "Engine Room", "Boardroom"] as const;

export type JumpPathway = (typeof JUMP_PATHWAYS)[number];

const pathwayRank: Record<JumpPathway, number> = {
  Foundation: 1,
  "Engine Room": 2,
  Boardroom: 3,
};

/**
 * Normalises the two stable participant identity fields used when a person has
 * registered from a second address. It intentionally does not use business
 * description or diagnostic content, which may legitimately change.
 */
export function normaliseParticipantIdentity(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function sameParticipantIdentity(
  left: { email: string; fullName: string; businessName: string },
  right: { email: string; fullName: string; businessName: string },
) {
  const sameEmail = left.email.trim().toLowerCase() === right.email.trim().toLowerCase();
  const sameNamedBusiness =
    normaliseParticipantIdentity(left.fullName) === normaliseParticipantIdentity(right.fullName) &&
    normaliseParticipantIdentity(left.businessName) === normaliseParticipantIdentity(right.businessName);
  return sameEmail || sameNamedBusiness;
}

export function selectHighestPathway(pathways: readonly JumpPathway[]) {
  if (pathways.length === 0) throw new Error("At least one JUMP pathway is required");
  return pathways.reduce((highest, pathway) =>
    pathwayRank[pathway] > pathwayRank[highest] ? pathway : highest,
  );
}

export function pathwaySupersedes(candidate: JumpPathway, current: JumpPathway) {
  return pathwayRank[candidate] > pathwayRank[current];
}
