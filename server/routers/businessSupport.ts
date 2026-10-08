import { z } from "zod";
import type { PipelineStage } from "../../shared/businessCheck/pipeline";
import {
  CALL_OUTCOMES,
  businessSupportDb,
  getBusinessCheckDetail,
  listBusinessChecks,
  listClients,
  listDiscoveryCalls,
  recordDiscoveryCallOutcome,
  scheduleDiscoveryCall,
  SETTABLE_STAGES,
  setPipelineStage,
} from "../businessSupportAdmin";
import { adminPermissionProcedure, router } from "../_core/trpc";

// Prospects (business checks, calls) and the invitation step belong to client onboarding; the client list is a view of
// businesses, so it has its own permission and is not granted by onboarding alone.
const prospects = adminPermissionProcedure("manage_client_onboarding");
const clients = adminPermissionProcedure("view_all_businesses");

/**
 * The IPF Business Support admin view of the funnel: Free Business Check -> discovery call -> onboarding. Nothing here
 * creates a user or a business: that happens only when a client accepts an onboarding invitation.
 */
export const businessSupportRouter = router({
  checks: prospects.query(async () => listBusinessChecks(await businessSupportDb())),
  checkDetail: prospects
    .input(z.object({ businessCheckId: z.number().int().positive() }))
    .query(async ({ input }) => getBusinessCheckDetail(await businessSupportDb(), input.businessCheckId)),
  discoveryCalls: prospects.query(async () => listDiscoveryCalls(await businessSupportDb())),
  scheduleCall: prospects
    .input(z.object({ businessCheckId: z.number().int().positive(), scheduledFor: z.coerce.date() }))
    .mutation(async ({ ctx, input }) => scheduleDiscoveryCall(await businessSupportDb(), { ...input, actorUserId: ctx.user.id })),
  recordOutcome: prospects
    .input(z.object({ businessCheckId: z.number().int().positive(), outcome: z.enum(CALL_OUTCOMES) }))
    .mutation(async ({ ctx, input }) => recordDiscoveryCallOutcome(await businessSupportDb(), { ...input, actorUserId: ctx.user.id })),
  /** Moves a business check to any later stage (Opportunity, Won, Lost, Nurture, Referred…), with an optional note. */
  setStage: prospects
    .input(z.object({ businessCheckId: z.number().int().positive(), stage: z.enum(SETTABLE_STAGES as [Exclude<PipelineStage, "lead">, ...Exclude<PipelineStage, "lead">[]]), note: z.string().trim().max(500).optional() }))
    .mutation(async ({ ctx, input }) => setPipelineStage(await businessSupportDb(), { ...input, note: input.note || undefined, actorUserId: ctx.user.id })),
  clients: clients.query(async () => listClients(await businessSupportDb())),
});
