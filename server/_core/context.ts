import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { eq } from "drizzle-orm";
import { users, type User } from "../../drizzle/schema";
import { resolveAccountSession } from "../accountAuth";
import { getDb } from "../db";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  /**
   * How `user` was authenticated. "legacy" is the platform OAuth session (which the administrator-password session
   * still builds on); "account" is the universal email-and-password session. Absent when nobody is signed in.
   */
  authChannel?: "legacy" | "account";
};

/**
 * The legacy OAuth session is tried first, unchanged. Otherwise a universal account session identifies the staff
 * member, but ONLY when that person holds an internal platform role: a client's account session never becomes the
 * administrator identity, so `ctx.user` stays null for them and every admin procedure refuses them.
 */
export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let authChannel: TrpcContext["authChannel"];

  try {
    user = await sdk.authenticateRequest(opts.req);
    if (user) authChannel = "legacy";
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  if (!user) {
    try {
      const session = await resolveAccountSession(opts.req);
      if (session && session.authority.roles.length > 0) {
        const db = await getDb();
        const row = db ? (await db.select().from(users).where(eq(users.id, session.user.id)).limit(1))[0] : undefined;
        if (row && row.status === "active") {
          user = row;
          authChannel = "account";
        }
      }
    } catch {
      user = null;
    }
  }

  return { req: opts.req, res: opts.res, user, authChannel };
}
