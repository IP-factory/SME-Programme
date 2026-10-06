import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { getAuthenticatedParticipant } from "../participantAuth";
import { hasVerifiedAdminAccess, isOwnerAdmin } from "../adminSecurity";
import { getDb } from "../db";
import { adminPermissionProfiles } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { type AdminPermission, parseAdminPermissions } from "../../shared/adminPermissions";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const participantProcedure = t.procedure.use(
  t.middleware(async ({ ctx, input, next }) => {
    const participant = await getAuthenticatedParticipant(ctx);
    return next({
      ctx: { ...ctx, participant },
      input: typeof input === "object" && input !== null
        ? { ...input, token: participant.bookingToken, bookingToken: participant.bookingToken }
        : input,
    });
  }),
);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    if (!(await hasVerifiedAdminAccess(ctx.req, ctx.user.id))) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Kindly verify your JUMP administrator password to continue." });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

export const ownerAdminProcedure = adminProcedure.use(
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user || !isOwnerAdmin(ctx.user)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "This action is reserved for the JUMP super administrator." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

/**
 * A capability-scoped administrative procedure. Emmanuel’s recognised Super Admin
 * identity retains full control; every other administrator must have the selected
 * capability persisted in their permission profile.
 */
export function adminPermissionProcedure(permission: AdminPermission) {
  return adminProcedure.use(
    t.middleware(async ({ ctx, next }) => {
      if (!ctx.user) throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
      if (isOwnerAdmin(ctx.user)) return next({ ctx: { ...ctx, user: ctx.user } });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const profile = (await db.select({ permissionsJson: adminPermissionProfiles.permissionsJson })
        .from(adminPermissionProfiles)
        .where(eq(adminPermissionProfiles.userId, ctx.user.id))
        .limit(1))[0];
      if (!parseAdminPermissions(profile?.permissionsJson).includes(permission)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Your JUMP administrator role does not include this responsibility." });
      }
      return next({ ctx: { ...ctx, user: ctx.user } });
    }),
  );
}
