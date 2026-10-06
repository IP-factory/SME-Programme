import { and, eq } from "drizzle-orm";
import { emailLogs, registrations } from "../drizzle/schema";
import { getDb } from "../server/db";
import { deliverEmail } from "../server/email";
import { buildInformationSessionInvitationEmail } from "../server/emailTemplates";

const ENZO_REGISTRATION_ID = 600001;
const SUBJECT = "JUMP 2026 — Information Session & Briefing | Sunday, 23 August [JUMP mailbox preview]";
const MONITORING_ADDRESSES = ["emmanueltarfa@gmail.com", "emmanuel.tarfa@enzokrypton.com"];
const MEET_URL = "https://meet.google.com/cxp-cgzi-hxm";

async function sendInformationSessionPreview() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const [participant] = await db.select().from(registrations)
    .where(eq(registrations.id, ENZO_REGISTRATION_ID))
    .limit(1);
  if (!participant) throw new Error("The controlled Enzo participant record was not found");
  if (participant.email.toLowerCase() !== "emmanuel.tarfa@enzokrypton.com") {
    throw new Error("The controlled preview recipient does not match the Enzo address");
  }

  const priorDelivery = await db.select({ id: emailLogs.id, status: emailLogs.status })
    .from(emailLogs)
    .where(and(eq(emailLogs.registrationId, participant.id), eq(emailLogs.subject, SUBJECT)))
    .limit(1);
  if (priorDelivery.length > 0) {
    console.log(`Skipped: owner preview is already logged as ${priorDelivery[0].status}.`);
    return;
  }

  const message = buildInformationSessionInvitationEmail({
    fullName: participant.fullName,
    meetUrl: MEET_URL,
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
    throw new Error(`Owner preview was not sent: ${"reason" in delivery ? delivery.reason : delivery.status}`);
  }
  console.log(JSON.stringify({ recipient: participant.email, status: delivery.status, providerMessageId: delivery.providerMessageId }, null, 2));
}

sendInformationSessionPreview().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
