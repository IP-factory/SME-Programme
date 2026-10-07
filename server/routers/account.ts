import { z } from "zod";
import { signInInputSchema, switchWorkspaceInputSchema } from "../../shared/auth";
import {
  changeAccountPassword,
  getBusinessProfile,
  resolveAccountSession,
  signInAccount,
  signOutAccount,
  switchWorkspace,
  toAccountView,
  updateAccountProfile,
  updateBusinessProfile,
} from "../accountAuth";
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

  /** The signed-in person's canonical context. Requires a session. */
  workspace: accountProcedure.query(({ ctx }) => toAccountView(ctx.account)),

  /** Chooses the active workspace. The id is verified against the caller's active memberships. */
  switchWorkspace: accountProcedure.input(switchWorkspaceInputSchema).mutation(({ ctx, input }) => switchWorkspace(ctx.req, ctx.account, input.businessId)),

  /** A business the caller belongs to, with what their role may do. The id is checked, never trusted. */
  business: accountProcedure.input(z.object({ businessId: z.number().int().positive() })).query(({ ctx, input }) => getBusinessProfile(ctx.account, input.businessId)),

  /** Updates the business profile. Owners and business admins only; members and outsiders are refused. */
  updateBusiness: accountProcedure.input(z.unknown()).mutation(({ ctx, input }) => updateBusinessProfile(ctx.req, ctx.account, input)),

  /** The signed-in person's own name. Never another person, never the email. */
  updateProfile: accountProcedure.input(z.unknown()).mutation(({ ctx, input }) => updateAccountProfile(ctx.req, ctx.account, input)),

  changePassword: accountProcedure.input(z.unknown()).mutation(({ ctx, input }) => changeAccountPassword(ctx.req, ctx.account, input)),
});
