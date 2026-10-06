import { and, eq, inArray } from "drizzle-orm";
import { emailLogs, registrations } from "../drizzle/schema";
import { getDb } from "../server/db";
import { deliverEmail } from "../server/email";
import { buildInformationSessionInvitationEmail } from "../server/emailTemplates";
import {
  hasSentFinalInformationSessionEmail,
  INFORMATION_SESSION,
  INFORMATION_SESSION_RECIPIENT_IDS,
} from "../server/informationSession";

const MONITORING_ADDRESSES = ["emmanueltarfa@gmail.com", "emmanuel.tarfa@enzokrypton.com"];

type DeliveryReport = {
  registrationId: number;
  recipient: string;
  status: string;
};

async function sendApprovedInformationSessionInvitations() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const rows = await db.select().from(registrations).where(inArray(registrations.id, [...INFORMATION_SESSION_RECIPIENT_IDS]));
  const byId = new Map(rows.map((row) => [row.id, row]));
  const report: DeliveryReport[] = [];

  for (const registrationId of INFORMATION_SESSION_RECIPIENT_IDS) {
    const participant = byId.get(registrationId);
    if (!participant) throw new Error(`Approved Information Session recipient ${registrationId} was not found`);
    if (participant.status === "Rejected") throw new Error(`${participant.email} is not eligible for the Information Session`);

    const message = buildInformationSessionInvitationEmail({
      fullName: participant.fullName,
      meetUrl: INFORMATION_SESSION.meetUrl,
    });
    const priorDelivery = await db.select({ id: emailLogs.id, status: emailLogs.status, body: emailLogs.body })
      .from(emailLogs)
      .where(and(eq(emailLogs.registrationId, participant.id), eq(emailLogs.subject, INFORMATION_SESSION.subject)))
      .limit(10);

    if (hasSentFinalInformationSessionEmail(priorDelivery, message.body)) {
      report.push({ registrationId: participant.id, recipient: participant.email, status: "Skipped (final approved email already sent)" });
      continue;
    }

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
    report.push({ registrationId: participant.id, recipient: participant.email, status: delivery.status });
  }

  console.table(report);
  const failures = report.filter((item) => item.status !== "Sent" && !item.status.startsWith("Skipped"));
  if (failures.length > 0) {
    throw new Error(`Information Session email delivery failed for ${failures.map((item) => item.recipient).join(", ")}`);
  }
}

sendApprovedInformationSessionInvitations().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
