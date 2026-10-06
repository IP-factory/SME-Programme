import { describe, expect, it } from "vitest";
import { archiveApplicationFields, isActiveApplication } from "../shared/applicationArchive";

describe("application archive policy", () => {
  it("keeps unarchived registrations visible on the active owner desk", () => {
    expect(isActiveApplication(null)).toBe(true);
    expect(isActiveApplication(undefined)).toBe(true);
  });

  it("removes an archived application from the active desk without deleting its record", () => {
    const archivedAt = new Date("2026-08-21T09:00:00.000Z");
    const fields = archiveApplicationFields(42, archivedAt);
    expect(isActiveApplication(fields.archivedAt)).toBe(false);
    expect(fields).toEqual({ archivedAt, archivedByUserId: 42, status: "Rejected" });
  });
});
