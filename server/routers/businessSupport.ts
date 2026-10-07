import { z } from "zod";
import {
  CALL_OUTCOMES,
  businessSupportDb,
  listBusinessChecks,
  listClients,
  listDiscoveryCalls,
  recordDiscoveryCallOutcome,
  scheduleDiscoveryCall,
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
  discoveryCalls: prospects.query(async () => listDiscoveryCalls(await businessSupportDb())),
  scheduleCall: prospects
    .input(z.object({ businessCheckId: z.number().int().positive(), scheduledFor: z.coerce.date() }))
    .mutation(async ({ ctx, input }) => scheduleDiscoveryCall(await businessSupportDb(), { ...input, actorUserId: ctx.user.id })),
  recordOutcome: prospects
    .input(z.object({ businessCheckId: z.number().int().positive(), outcome: z.enum(CALL_OUTCOMES) }))
    .mutation(async ({ ctx, input }) => recordDiscoveryCallOutcome(await businessSupportDb(), { ...input, actorUserId: ctx.user.id })),
  clients: clients.query(async () => listClients(await businessSupportDb())),
});
