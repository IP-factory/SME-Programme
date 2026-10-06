import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { participantEngagementConsents, registrations, scheduleBookings, scheduleSlots } from "../../drizzle/schema";
import { getBusyRanges, isCalendarConfigured, createCalendarEvent } from "../calendar";
import { getDb } from "../db";
import { adminProcedure, participantProcedure, publicProcedure, router } from "../_core/trpc";
import { filterAvailableSlotRows, generateSlotDefinitions, getAvailabilityWindow, requiredMeetingsForPackage, type SlotKind } from "../scheduling";
import { ENGAGEMENT_BRIEF_VERSION } from "../../shared/engagementBrief";

const slotKindSchema = z.enum(["Decide", "Learn", "Apply"]);

function asSlotKind(value: string): SlotKind {
  return value as SlotKind;
}

export const schedulingRouter = router({
  configuration: publicProcedure.query(() => ({
    connected: isCalendarConfigured(),
    message: isCalendarConfigured()
      ? "Google Calendar is connected and will be checked before a booking is confirmed."
      : "Availability is managed by owner coordination. The site prevents double-booking locally.",
  })),

  availableSlots: participantProcedure
    .input(z.object({ kind: slotKindSchema }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { eligible: false, reason: "Database not available", slots: [], calendarConnected: false };
      const kind = asSlotKind(input.kind);
      let eligible = true;
      let reason: string | undefined;
      let requiredCount = kind === "Decide" || kind === "Apply" ? 3 : 5;
      let packageName: "Foundation" | "Engine Room" | "Boardroom" | undefined;
      const applicant = await db.select({ id: registrations.id, status: registrations.status, depositPaid: registrations.depositPaid, package: registrations.package })
        .from(registrations).where(eq(registrations.id, ctx.participant.id)).limit(1);
      const row = applicant[0];
      if (!row) {
        eligible = false;
        reason = "Your participant session could not be confirmed. Kindly reopen your personal portal link.";
      } else {
        const consentRows = await db.select({ id: participantEngagementConsents.id })
          .from(participantEngagementConsents)
          .where(and(
            eq(participantEngagementConsents.registrationId, row.id),
            eq(participantEngagementConsents.briefVersion, ENGAGEMENT_BRIEF_VERSION),
          ))
          .limit(1);
        if (!consentRows[0]) {
          eligible = false;
          reason = "Please read and acknowledge your personalised engagement brief in the participant portal before scheduling.";
        } else if (row.status !== "Accepted" || row.depositPaid !== "Paid") {
          eligible = false;
          reason = "Scheduling opens after acceptance and confirmation of the 40% commitment payment.";
        } else {
          packageName = row.package;
          const required = requiredMeetingsForPackage(row.package);
          requiredCount = required.count;
          if (required.kind !== kind) {
            eligible = false;
            reason = `Your selected package uses the ${required.kind} schedule.`;
          }
        }
      }
      const rows = await db.select().from(scheduleSlots).where(eq(scheduleSlots.kind, kind)).orderBy(scheduleSlots.startAt);
      const window = getAvailabilityWindow(kind);
      let busyRanges: Array<{ start: Date; end: Date }> = [];
      if (isCalendarConfigured()) {
        try {
          busyRanges = await getBusyRanges(window.start, window.end);
        } catch (error) {
          console.error("[Calendar] Availability check failed:", error);
          reason = reason ?? "Calendar availability could not be refreshed; showing locally open slots only.";
        }
      }
      const slots = eligible ? filterAvailableSlotRows(rows, busyRanges) : [];
      return {
        eligible,
        reason,
        packageName,
        requiredCount,
          calendarConnected: isCalendarConfigured(),
        slots: slots.map((slot) => ({
          id: slot.id,
          kind: slot.kind,
          sessionNumber: slot.sessionNumber,
          startAt: slot.startAt,
          endAt: slot.endAt,
          timezone: slot.timezone,
          capacity: slot.capacity,
          remaining: Math.max(0, slot.capacity - slot.bookedCount),
        })),
      };
    }),

  myBookings: participantProcedure
    .input(z.object({}).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const applicant = await db.select({ id: registrations.id }).from(registrations).where(eq(registrations.id, ctx.participant.id)).limit(1);
      if (!applicant[0]) return [];
      return db.select({
        id: scheduleBookings.id,
        kind: scheduleBookings.kind,
        status: scheduleBookings.status,
        calendarStatus: scheduleBookings.calendarStatus,
        startAt: scheduleSlots.startAt,
        endAt: scheduleSlots.endAt,
        timezone: scheduleSlots.timezone,
        sessionNumber: scheduleSlots.sessionNumber,
      }).from(scheduleBookings)
        .innerJoin(scheduleSlots, eq(scheduleBookings.slotId, scheduleSlots.id))
        .where(and(eq(scheduleBookings.registrationId, applicant[0].id), eq(scheduleBookings.status, "Confirmed")))
        .orderBy(scheduleSlots.startAt);
    }),

  book: participantProcedure
    .input(z.object({ slotId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const booking = await db.transaction(async (tx) => {
        const applicantRows = await tx.select().from(registrations).where(eq(registrations.id, ctx.participant.id)).limit(1);
        const applicant = applicantRows[0];
        if (!applicant) throw new TRPCError({ code: "NOT_FOUND", message: "Booking link not recognised." });
        const consentRows = await tx.select({ id: participantEngagementConsents.id })
          .from(participantEngagementConsents)
          .where(and(
            eq(participantEngagementConsents.registrationId, applicant.id),
            eq(participantEngagementConsents.briefVersion, ENGAGEMENT_BRIEF_VERSION),
          ))
          .limit(1);
        if (!consentRows[0]) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Please read and acknowledge your personalised engagement brief in the participant portal before scheduling." });
        }
        if (applicant.status !== "Accepted" || applicant.depositPaid !== "Paid") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Scheduling opens after acceptance and confirmation of the 40% commitment payment." });
        }
        const slotRows = await tx.select().from(scheduleSlots).where(eq(scheduleSlots.id, input.slotId)).limit(1);
        const slot = slotRows[0];
        if (!slot || slot.status !== "Open" || slot.bookedCount >= slot.capacity) {
          throw new TRPCError({ code: "CONFLICT", message: "That slot has just been taken. Please choose another available time." });
        }
        const required = requiredMeetingsForPackage(applicant.package);
        if (required.kind !== slot.kind) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `This package books ${required.kind} sessions.` });
        }
        const currentBookings = await tx.select({ count: sql<number>`count(*)` }).from(scheduleBookings).where(and(
          eq(scheduleBookings.registrationId, applicant.id),
          eq(scheduleBookings.kind, slot.kind),
          eq(scheduleBookings.status, "Confirmed"),
        ));
        if (Number(currentBookings[0]?.count ?? 0) >= required.count) {
          throw new TRPCError({ code: "CONFLICT", message: `You already have the maximum ${required.count} ${slot.kind} bookings for this package.` });
        }
        const duplicate = await tx.select({ id: scheduleBookings.id }).from(scheduleBookings).where(and(
          eq(scheduleBookings.registrationId, applicant.id),
          eq(scheduleBookings.slotId, slot.id),
          eq(scheduleBookings.status, "Confirmed"),
        )).limit(1);
        if (duplicate[0]) throw new TRPCError({ code: "CONFLICT", message: "You have already booked this slot." });

        const existingBookings = await tx.select({
          startAt: scheduleSlots.startAt,
          endAt: scheduleSlots.endAt,
        }).from(scheduleBookings)
          .innerJoin(scheduleSlots, eq(scheduleBookings.slotId, scheduleSlots.id))
          .where(and(
            eq(scheduleBookings.registrationId, applicant.id),
            eq(scheduleBookings.status, "Confirmed"),
          ));
        for (const bookingRow of existingBookings) {
          const s1Start = new Date(bookingRow.startAt).getTime();
          const s1End = new Date(bookingRow.endAt).getTime();
          const s2Start = new Date(slot.startAt).getTime();
          const s2End = new Date(slot.endAt).getTime();
          if (s1Start < s2End && s2Start < s1End) {
            throw new TRPCError({ code: "CONFLICT", message: "You already have a confirmed session booked that overlaps with this time." });
          }
        }

        const updateResult = await tx.update(scheduleSlots)
          .set({
            bookedCount: sql`${scheduleSlots.bookedCount} + 1`,
            status: sql`CASE WHEN ${scheduleSlots.bookedCount} + 1 >= ${scheduleSlots.capacity} THEN 'Booked' ELSE 'Open' END`,
          })
          .where(and(eq(scheduleSlots.id, slot.id), eq(scheduleSlots.status, "Open"), sql`${scheduleSlots.bookedCount} < ${scheduleSlots.capacity}`));
        if (Number((updateResult as { affectedRows?: number }).affectedRows ?? 0) !== 1) {
          throw new TRPCError({ code: "CONFLICT", message: "That slot has just been taken. Please choose another available time." });
        }
        const [insertResult] = await tx.insert(scheduleBookings).values({
          registrationId: applicant.id,
          slotId: slot.id,
          kind: slot.kind,
          status: "Confirmed",
          calendarStatus: "Pending",
        });
        return { bookingId: Number(insertResult.insertId), applicant, slot };
      });

      let calendarStatus: "Created" | "Failed" | "NotConfigured" = "NotConfigured";
      let googleCalendarEventId: string | undefined;
      try {
        const event = await createCalendarEvent({
          summary: `JUMP 2026 ${booking.slot.kind} session — ${booking.applicant.businessName}`,
          description: `JUMP 2026 ${booking.slot.kind} session for ${booking.applicant.fullName} and ${booking.applicant.businessName}.`,
          startAt: new Date(booking.slot.startAt),
          endAt: new Date(booking.slot.endAt),
          attendeeEmail: booking.applicant.email,
          attendeeName: booking.applicant.fullName,
        });
        calendarStatus = event.status;
        googleCalendarEventId = event.eventId;
      } catch (error) {
        calendarStatus = "Failed";
        console.error("[Calendar] Event creation failed after local booking:", error);
      }
      await db.update(scheduleBookings).set({ calendarStatus, googleCalendarEventId }).where(eq(scheduleBookings.id, booking.bookingId));
      return {
        success: true,
        bookingId: booking.bookingId,
        calendarStatus,
        message: calendarStatus === "Created"
          ? "Your place is reserved and a Google Calendar invitation has been sent."
          : "Your place is reserved. Calendar synchronisation is pending, so the programme team will confirm the meeting separately.",
      };
    }),

  seed: adminProcedure
    .input(z.object({ kind: slotKindSchema }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const kind = asSlotKind(input.kind);
      const definitions = generateSlotDefinitions(kind);
      const existing = await db.select({ startAt: scheduleSlots.startAt, kind: scheduleSlots.kind }).from(scheduleSlots).where(eq(scheduleSlots.kind, kind));
      const keys = new Set(existing.map((slot) => `${slot.kind}:${new Date(slot.startAt).getTime()}`));
      const missing = definitions.filter((slot) => !keys.has(`${slot.kind}:${slot.startAt.getTime()}`));
      if (missing.length > 0) await db.insert(scheduleSlots).values(missing);
      return { inserted: missing.length, total: definitions.length };
    }),

  adminList: adminProcedure
    .input(z.object({ kind: slotKindSchema.optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(scheduleSlots).where(input?.kind ? eq(scheduleSlots.kind, input.kind) : undefined).orderBy(desc(scheduleSlots.startAt));
    }),

  block: adminProcedure
    .input(z.object({ slotId: z.number().int().positive(), blocked: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      await db.update(scheduleSlots).set({ status: input.blocked ? "Blocked" : "Open" }).where(and(eq(scheduleSlots.id, input.slotId), eq(scheduleSlots.bookedCount, 0)));
      return { success: true };
    }),
});
