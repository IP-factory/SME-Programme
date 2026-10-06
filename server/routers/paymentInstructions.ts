import { eq } from "drizzle-orm";
import { z } from "zod";
import { emailLogs, registrations } from "../../drizzle/schema";
import { PAYMENT_INSTRUCTION_TEMPLATE_IDS, renderPaymentInstruction, paymentInstructionTemplateLibrary } from "../../shared/paymentInstructionTemplates";
import { getDb } from "../db";
import { deliverEmail, JUMP_MONITORING_BCC } from "../email";
import { ownerAdminProcedure, router } from "../_core/trpc";

const paymentInstructionInput = z.object({
  registrationId: z.number().int().positive(),
  templateId: z.enum(PAYMENT_INSTRUCTION_TEMPLATE_IDS),
});

async function getEligibleRegistration(registrationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const registration = (await db.select().from(registrations).where(eq(registrations.id, registrationId)).limit(1))[0];
  if (!registration || registration.status === "Rejected" || registration.supersededByRegistrationId) {
    throw new Error("An eligible active participant record was not found.");
  }
  return { db, registration };
}

export const paymentInstructionsRouter = router({
  templateLibrary: ownerAdminProcedure.query(() => paymentInstructionTemplateLibrary()),

  preview: ownerAdminProcedure.input(paymentInstructionInput).query(async ({ input }) => {
    const { registration } = await getEligibleRegistration(input.registrationId);
    return {
      recipientName: registration.fullName,
      recipientEmail: registration.email,
      ...renderPaymentInstruction(input.templateId, registration.fullName),
    };
  }),

  send: ownerAdminProcedure
    .input(paymentInstructionInput.extend({ ownerApproval: z.literal(true) }))
    .mutation(async ({ input }) => {
      const { db, registration } = await getEligibleRegistration(input.registrationId);
      const message = renderPaymentInstruction(input.templateId, registration.fullName);
      const delivery = await deliverEmail({
        to: registration.email,
        bcc: JUMP_MONITORING_BCC,
        subject: message.subject,
        body: message.body,
      });
      await db.insert(emailLogs).values({
        registrationId: registration.id,
        recipientEmail: registration.email,
        subject: message.subject,
        body: message.body,
        status: delivery.status,
      });
      if (delivery.status !== "Sent") throw new Error("The payment-instructions email could not be delivered.");
      return { status: delivery.status, recipientEmail: registration.email, templateId: input.templateId };
    }),
});
