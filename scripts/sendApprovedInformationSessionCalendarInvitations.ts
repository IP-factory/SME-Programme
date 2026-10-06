import { inArray } from "drizzle-orm";
import { registrations } from "../drizzle/schema";
import { updateCalendarEvent } from "../server/calendar";
import { getDb } from "../server/db";
import {
  buildInformationSessionCalendarDescription,
  INFORMATION_SESSION,
  INFORMATION_SESSION_RECIPIENT_IDS,
} from "../server/informationSession";

async function sendApprovedInformationSessionCalendarInvitations() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const rows = await db.select().from(registrations)
    .where(inArray(registrations.id, [...INFORMATION_SESSION_RECIPIENT_IDS]));
  const byId = new Map(rows.map((row) => [row.id, row]));
  const attendees = INFORMATION_SESSION_RECIPIENT_IDS.map((registrationId) => {
    const participant = byId.get(registrationId);
    if (!participant) throw new Error(`Approved calendar recipient ${registrationId} was not found`);
    if (participant.status === "Rejected") throw new Error(`${participant.email} is not eligible for the Information Session`);
    return { email: participant.email, displayName: participant.fullName };
  });

  const result = await updateCalendarEvent({
    eventId: INFORMATION_SESSION.eventId,
    summary: INFORMATION_SESSION.summary,
    description: buildInformationSessionCalendarDescription(),
    startAt: INFORMATION_SESSION.startAt,
    endAt: INFORMATION_SESSION.endAt,
    attendees,
  });
  if (result.status !== "Created") throw new Error("Google Calendar is not configured for Information Session invitations");
  console.log(`Calendar invitations released to ${attendees.length} recipients for event ${result.eventId}`);
}

sendApprovedInformationSessionCalendarInvitations().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
