import { describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { ENGAGEMENT_BRIEF_VERSION } from "../../shared/engagementBrief";
import { fixtureRow } from "./harness";

type Registration = Record<string, unknown> & { id: number };

/**
 * Slot capacity semantics on PostgreSQL. Intended behaviour: each booking adds one to bookedCount; the slot stays
 * Open while seats remain and becomes Booked exactly when bookedCount reaches capacity; it can never be overbooked.
 */
export function registerSchedulingCapacityTests(host: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDb: () => any;
  book: (registration: Registration, slotId: number) => Promise<{ success: boolean; bookingId: number }>;
  /** Hook for harnesses whose connection needs recovering after a deliberate server-side SQL error. */
  afterServerError?: () => Promise<void>;
}) {
  let sequence = 0;
  const unique = () => `${Date.now().toString(36)}-${(sequence += 1)}`;

  async function newSlot(capacity: number) {
    const [slot] = await host.getDb().insert(schema.scheduleSlots).values(fixtureRow(schema.scheduleSlots, {
      kind: "Learn", capacity, bookedCount: 0, status: "Open",
      startAt: new Date("2031-03-01T10:00:00Z"), endAt: new Date("2031-03-01T11:00:00Z"),
    })).returning();
    return slot as { id: number };
  }

  async function newParticipant() {
    const db = host.getDb();
    const [registration] = await db.insert(schema.registrations).values(fixtureRow(schema.registrations, {
      email: `capacity-${unique()}@example.test`, status: "Accepted", depositPaid: "Paid", package: "Foundation",
    })).returning();
    await db.insert(schema.participantEngagementConsents).values(fixtureRow(schema.participantEngagementConsents, {
      registrationId: registration.id, briefVersion: ENGAGEMENT_BRIEF_VERSION,
    }));
    return registration as Registration;
  }

  const readSlot = async (id: number) => (await host.getDb().select().from(schema.scheduleSlots).where(eq(schema.scheduleSlots.id, id)))[0];
  const bookingCount = async (slotId: number) => (await host.getDb().select().from(schema.scheduleBookings).where(eq(schema.scheduleBookings.slotId, slotId))).length;

  describe("slot capacity", () => {
    it.each([1, 2, 3])("capacity %i: stays Open while seats remain, becomes Booked exactly at capacity, never overbooks", async capacity => {
      const slot = await newSlot(capacity);
      for (let booked = 1; booked <= capacity; booked += 1) {
        const result = await host.book(await newParticipant(), slot.id);
        expect(result.success).toBe(true);
        expect(await readSlot(slot.id)).toMatchObject({ bookedCount: booked, status: booked < capacity ? "Open" : "Booked" });
      }
      const late = await newParticipant();
      await expect(host.book(late, slot.id)).rejects.toMatchObject({ code: "CONFLICT" });
      expect(await readSlot(slot.id)).toMatchObject({ bookedCount: capacity, status: "Booked" });
      expect(await bookingCount(slot.id)).toBe(capacity);
    });

    it("rolls the seat claim back when the booking row cannot be inserted", async () => {
      const db = host.getDb();
      const slot = await newSlot(2);
      const participant = await newParticipant();
      await db.execute(sql.raw("alter table schedule_bookings add constraint capacity_test_reject check (false) not valid"));
      try {
        await expect(host.book(participant, slot.id)).rejects.toBeTruthy();
      } finally {
        await host.afterServerError?.();
        await db.execute(sql.raw("alter table schedule_bookings drop constraint capacity_test_reject"));
      }
      expect(await readSlot(slot.id)).toMatchObject({ bookedCount: 0, status: "Open" });
      expect(await bookingCount(slot.id)).toBe(0);

      // The slot is still bookable afterwards.
      await host.book(participant, slot.id);
      expect(await readSlot(slot.id)).toMatchObject({ bookedCount: 1, status: "Open" });
    });
  });
}
