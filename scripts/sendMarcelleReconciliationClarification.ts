import { and, eq } from "drizzle-orm";
import { emailLogs, registrations } from "../drizzle/schema";
import { getDb } from "../server/db";
import { deliverEmail } from "../server/email";
import { buildDuplicatePathwayClarificationEmail } from "../server/emailTemplates";
import { replaceParticipantPortalLink } from "../server/participantAuth";

const REGISTRATION_ID = 210001;
const MONITORING_ADDRESSES = ["emmanueltarfa@gmail.com", "emmanuel.tarfa@enzokrypton.com"];
const SUBJECT = "JUMP 2026 — Your Boardroom registration is confirmed";

const liveRequest = {
  headers: { "x-forwarded-proto": "https" },
  protocol: "https",
  get: (header: string) => header.toLowerCase() === "host" ? "emmanueltarfa.com" : undefined,
};

async function sendMarcelleClarification() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const [participant] = await db.select().from(registrations).where(eq(registrations.id, REGISTRATION_ID)).limit(1);
  if (!participant) throw new Error("Marcelle’s retained Boardroom registration was not found");
  if (participant.package !== "Boardroom" || participant.supersededByRegistrationId) {
    throw new Error("Marcelle’s retained registration is not an active Boardroom record");
  }

  const priorDelivery = await db.select({ id: emailLogs.id })
    .from(emailLogs)
    .where(and(eq(emailLogs.registrationId, participant.id), eq(emailLogs.subject, SUBJECT)))
    .limit(1);
  if (priorDelivery.length > 0) {
    console.log("Skipped: Marcelle’s reconciliation clarification is already logged.");
    return;
  }

  const portalUrl = await replaceParticipantPortalLink(participant.id, liveRequest as never);
  const message = buildDuplicatePathwayClarificationEmail({
    fullName: participant.fullName,
    businessName: participant.businessName,
    packageName: "Boardroom",
    portalUrl,
  });
  const delivery = await deliverEmail({
    to: participant.email,
    bcc: MONITORING_ADDRESSES,
    subject: message.subject,
    body: message.body,
    html: message.html,
  });
  await db.insert(emailLogs).values({
    registrationId: participant.id,
    recipientEmail: participant.email,
    subject: message.subject,
    body: message.body,
    status: delivery.status,
  });

  if (delivery.status !== "Sent") {
    throw new Error(`Marcelle’s clarification was not sent: ${"reason" in delivery ? delivery.reason : delivery.status}`);
  }
  console.log(`Sent Boardroom-only reconciliation clarification to ${participant.email}.`);
}

sendMarcelleClarification().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
