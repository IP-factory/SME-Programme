import { z } from "zod";
import { signInInputSchema } from "../../shared/auth";
import { requireBusinessMembership, resolveAccountSession, signInAccount, signOutAccount, toAccountView } from "../accountAuth";
import { accountProcedure, publicProcedure, router } from "../_core/trpc";

/**
 * Universal account sign-in. There is deliberately no sign-up here: accounts are created only by accepting an
 * onboarding invitation (routers/clientOnboarding.ts). Separate from the legacy `auth`, `adminAccess` and `participant`
 * routers, which keep working unchanged.
 */
export const accountRouter = router({
  signIn: publicProcedure.input(signInInputSchema).mutation(({ ctx, input }) => signInAccount(ctx.req, ctx.res, input)),

  signOut: publicProcedure.mutation(({ ctx }) => signOutAccount(ctx.req, ctx.res)),

  /** Who is signed in, or null. Public so the client can decide where to send a visitor. */
  me: publicProcedure.query(async ({ ctx }) => {
    const session = await resolveAccountSession(ctx.req);
    return session ? toAccountView(session) : null;
  }),

  /** The signed-in user's workspace. Requires a session. */
  workspace: accountProcedure.query(({ ctx }) => toAccountView(ctx.account)),

  /** A business the caller belongs to. The id is checked against the caller's memberships, never trusted. */
  business: accountProcedure.input(z.object({ businessId: z.number().int().positive() })).query(({ ctx, input }) => {
    const membership = requireBusinessMembership(ctx.account, input.businessId);
    return { businessId: membership.businessId, name: membership.businessName, role: membership.role, profileComplete: membership.profileComplete };
  }),
});

