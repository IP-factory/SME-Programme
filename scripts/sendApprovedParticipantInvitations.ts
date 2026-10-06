import { and, eq, inArray } from "drizzle-orm";
import { emailLogs, registrations } from "../drizzle/schema";
import { getDb } from "../server/db";
import { deliverEmail } from "../server/email";
import { buildEngagementBriefInvitationEmail } from "../server/emailTemplates";
import { replaceParticipantPortalLink } from "../server/participantAuth";

const MONITORING_ADDRESSES = ["emmanueltarfa@gmail.com", "emmanuel.tarfa@enzokrypton.com"];

const RECIPIENTS = [
  { registrationId: 1, purpose: "simulation" },
  { registrationId: 600001, purpose: "simulation" },
  { registrationId: 30001, purpose: "participant" },
  { registrationId: 60001, purpose: "participant" },
  { registrationId: 90001, purpose: "participant" },
  { registrationId: 120001, purpose: "participant" },
  { registrationId: 150001, purpose: "participant" },
  { registrationId: 180001, purpose: "participant" },
  { registrationId: 210001, purpose: "participant" },
  { registrationId: 180002, purpose: "participant" },
  { registrationId: 240001, purpose: "participant" },
  { registrationId: 270001, purpose: "participant" },
  { registrationId: 300001, purpose: "participant" },
  { registrationId: 330001, purpose: "participant" },
  { registrationId: 360001, purpose: "participant" },
  { registrationId: 390001, purpose: "participant" },
  { registrationId: 420001, purpose: "participant" },
  { registrationId: 450001, purpose: "participant" },
] as const;

const liveRequest = {
  headers: { "x-forwarded-proto": "https" },
  protocol: "https",
  get: (header: string) => header.toLowerCase() === "host" ? "emmanueltarfa.com" : undefined,
};

async function sendApprovedInvitations() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const recipientIds = RECIPIENTS.map(({ registrationId }) => registrationId);
  const rows = await db.select().from(registrations).where(inArray(registrations.id, recipientIds));
  const byId = new Map(rows.map((row) => [row.id, row]));
  const report: Array<{ registrationId: number; recipient: string; purpose: string; status: string }> = [];

  for (const definition of RECIPIENTS) {
    const participant = byId.get(definition.registrationId);
    if (!participant) throw new Error(`Registration ${definition.registrationId} was not found`);
    if (participant.status === "Rejected") throw new Error(`${participant.email} is not eligible for an invitation`);

    const packageName = participant.package as "Foundation" | "Engine Room" | "Boardroom";
    const expectedSubject = `JUMP 2026 — Your ${packageName} Engagement Brief is ready`;
    const priorDelivery = await db.select({ id: emailLogs.id, status: emailLogs.status })
      .from(emailLogs)
      .where(and(eq(emailLogs.registrationId, participant.id), eq(emailLogs.subject, expectedSubject)))
      .limit(1);

    if (priorDelivery.length > 0) {
      report.push({ registrationId: participant.id, recipient: participant.email, purpose: definition.purpose, status: `Skipped (${priorDelivery[0].status})` });
      continue;
    }

    const portalUrl = await replaceParticipantPortalLink(participant.id, liveRequest as never);
    const message = buildEngagementBriefInvitationEmail({
      fullName: participant.fullName,
      businessName: participant.businessName,
      packageName,
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
    report.push({ registrationId: participant.id, recipient: participant.email, purpose: definition.purpose, status: delivery.status });
  }

  console.table(report);
  const failures = report.filter((item) => item.status !== "Sent" && !item.status.startsWith("Skipped"));
  if (failures.length > 0) throw new Error(`Invitation delivery failed for ${failures.map((item) => item.recipient).join(", ")}`);
}

sendApprovedInvitations().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
