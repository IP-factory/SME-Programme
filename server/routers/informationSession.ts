import { inArray } from "drizzle-orm";
import { registrations } from "../../drizzle/schema";
import { getCalendarEventAttendeeResponses, isCalendarConfigured } from "../calendar";
import { buildInformationSessionAttendance } from "../informationSessionAttendance";
import { INFORMATION_SESSION, INFORMATION_SESSION_RECIPIENT_IDS } from "../informationSession";
import { getDb } from "../db";
import { adminPermissionProcedure, router } from "../_core/trpc";

export const informationSessionRouter = router({
  attendance: adminPermissionProcedure("view_participants").query(async () => {
    const db = await getDb();
    if (!db) return { available: false as const, responses: [], refreshedAt: null, message: "Database not available" };
    if (!isCalendarConfigured()) return { available: false as const, responses: [], refreshedAt: null, message: "Google Calendar is not connected" };

    try {
      const recipients = await db.select({ id: registrations.id, email: registrations.email })
        .from(registrations)
        .where(inArray(registrations.id, [...INFORMATION_SESSION_RECIPIENT_IDS]));
      const attendeeResponses = await getCalendarEventAttendeeResponses(INFORMATION_SESSION.eventId);
      return {
        available: true as const,
        responses: buildInformationSessionAttendance(recipients, attendeeResponses),
        refreshedAt: new Date(),
        message: "Live Google Calendar RSVP responses",
      };
    } catch (error) {
      console.error("[Information session] RSVP refresh failed:", error);
      return { available: false as const, responses: [], refreshedAt: null, message: "Calendar RSVP responses could not be refreshed" };
    }
  }),
});
