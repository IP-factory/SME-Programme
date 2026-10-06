import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { inboundEmailReplies, registrations } from "../../drizzle/schema";
import { getDb } from "../db";
import { getJumpMailboxMessages, isJumpMailboxSyncConfigured } from "../workspaceMailbox";
import { adminPermissionProcedure, ownerAdminProcedure, router } from "../_core/trpc";
import { databaseNow } from "../dbHelpers";
const replyStatus = z.enum(["New", "Reviewed", "Follow-up", "Closed"]);

export const inboundRepliesRouter = router({
  list: adminPermissionProcedure("view_communications").query(async () => {
    const db = await getDb();
    if (!db) return { replies: [], connected: isJumpMailboxSyncConfigured() };
    const replies = await db
      .select({
        id: inboundEmailReplies.id,
        registrationId: inboundEmailReplies.registrationId,
        senderEmail: inboundEmailReplies.senderEmail,
        senderName: inboundEmailReplies.senderName,
        subject: inboundEmailReplies.subject,
        preview: inboundEmailReplies.preview,
        body: inboundEmailReplies.body,
        receivedAt: inboundEmailReplies.receivedAt,
        status: inboundEmailReplies.status,
        participantName: registrations.fullName,
        package: registrations.package,
      })
      .from(inboundEmailReplies)
      .innerJoin(registrations, eq(inboundEmailReplies.registrationId, registrations.id))
      .orderBy(desc(inboundEmailReplies.receivedAt));
    return { replies, connected: isJumpMailboxSyncConfigured() };
  }),

  sync: ownerAdminProcedure.mutation(async () => {
    if (!isJumpMailboxSyncConfigured()) throw new Error("Connect the jump@ mailbox before refreshing participant replies.");
    const db = await getDb();
    if (!db) throw new Error("Database not available.");
    const activeRegistrations = await db.select({ id: registrations.id, email: registrations.email })
      .from(registrations)
      .where(inArray(registrations.status, ["Pending", "Accepted", "Waitlisted"]));
    const registrationByEmail = new Map(activeRegistrations.map((registration) => [registration.email.trim().toLowerCase(), registration.id]));
    const messages = await getJumpMailboxMessages(Array.from(registrationByEmail.keys()));
    let stored = 0;
    for (const message of messages) {
      const registrationId = registrationByEmail.get(message.senderEmail);
      if (!registrationId) continue;
      await db.insert(inboundEmailReplies).values({
        registrationId,
        mailboxMessageId: message.id,
        mailboxThreadId: message.threadId ?? null,
        senderEmail: message.senderEmail,
        senderName: message.senderName,
        subject: message.subject.slice(0, 255),
        preview: message.preview,
        body: message.body,
        receivedAt: message.receivedAt,
      }).onConflictDoUpdate({
        target: inboundEmailReplies.mailboxMessageId,
        set: {
          updatedAt: databaseNow(),
          preview: message.preview,
          body: message.body,
          receivedAt: message.receivedAt,
          senderName: message.senderName,
          subject: message.subject.slice(0, 255),
        },
      });
      stored += 1;
    }
    return { matchedMessages: stored, scannedMessages: messages.length };
  }),

  updateStatus: adminPermissionProcedure("view_communications")
    .input(z.object({ id: z.number().int().positive(), status: replyStatus }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available.");
      await db.update(inboundEmailReplies).set({ status: input.status }).where(eq(inboundEmailReplies.id, input.id));
      return { success: true };
    }),
});
