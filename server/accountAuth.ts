import { randomBytes, randomUUID } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { Request, Response } from "express";
import { TRPCError } from "@trpc/server";
import { adminInvitations, businessMemberships, businesses, userCredentials, users, userSessions } from "../drizzle/schema";
import {
  ACCOUNT_AUTH_ERRORS,
  ACCOUNT_LOCKOUT_MS,
  ACCOUNT_MAX_FAILED_ATTEMPTS,
  ACCOUNT_SESSION_COOKIE,
  ACCOUNT_SESSION_MAX_AGE_MS,
  normaliseAccountEmail,
  signUpInputSchema,
  type AccountMembership,
  type AccountSessionView,
} from "../shared/auth";
import { isBusinessProfileComplete } from "../shared/businessMemberships";
import { getAccountSessionCookieOptions } from "./_core/cookies";
import { getDb } from "./db";
import { databaseNow, emailEquals } from "./dbHelpers";
// The proven scrypt format and constant-time comparison already used for administrator passwords.
import { hashAdminPassword, OWNER_ADMIN_EMAIL, sha256, verifyAdminPasswordHash } from "./adminSecurity";
import { isSameHostOrigin, isTrustedBrowserOrigin } from "./security";

const PG_UNIQUE_VIOLATION = "23505";
const RATE_LIMIT_WINDOW_MS = ACCOUNT_LOCKOUT_MS;
const rateLimits = new Map<string, { count: number; resetAt: number }>();

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;

function isUniqueViolation(error: unknown) {
  const candidate = error as { code?: string; cause?: { code?: string } } | undefined;
  return candidate?.code === PG_UNIQUE_VIOLATION || candidate?.cause?.code === PG_UNIQUE_VIOLATION;
}

function requestIp(req: Request) {
  return (req.ip || "unknown").trim().toLowerCase();
}

/** Per-instance throttle keyed on address + email; the database lockout below is the cross-instance control. */
function consumeRateLimit(action: "signup" | "signin", req: Request, email: string, maximum: number) {
  const key = `${action}:${requestIp(req)}:${email}`;
  const now = Date.now();
  const existing = rateLimits.get(key);
  if (!existing || existing.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (existing.count >= maximum) return false;
  existing.count += 1;
  return true;
}

/** Clears the per-instance throttle for an address + email after a successful sign-in. */
function releaseRateLimit(action: "signup" | "signin", req: Request, email: string) {
  rateLimits.delete(`${action}:${requestIp(req)}:${email}`);
}

/**
 * Account cookies are SameSite=Lax and every mutation is a JSON POST, which browsers refuse to send
 * cross-site without a CORS preflight. This adds an explicit Origin check: a request that names another
 * site's origin is rejected. A missing Origin (non-browser client) carries no ambient cookie risk.
 */
export function assertSameOrigin(req: Request) {
  const origin = req.headers.origin;
  if (!origin) return;
  const host = (req.headers["x-forwarded-host"] as string | undefined) ?? req.headers.host;
  if (isTrustedBrowserOrigin(origin) || isSameHostOrigin(origin, host)) return;
  throw new TRPCError({ code: "FORBIDDEN", message: ACCOUNT_AUTH_ERRORS.crossSite });
}

let dummyPasswordHash: string | undefined;
/** Verified when no account matches, so a wrong email costs the same time as a wrong password. */
function burnPasswordCheck(password: string) {
  dummyPasswordHash ??= hashAdminPassword(randomBytes(16).toString("hex"));
  verifyAdminPasswordHash(password, dummyPasswordHash);
}

function slugify(name: string) {
  const base = name.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return `${base || "business"}-${randomBytes(3).toString("hex")}`;
}

async function createSession(tx: Pick<Database, "insert">, userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ACCOUNT_SESSION_MAX_AGE_MS);
  await tx.insert(userSessions).values({ userId, tokenHash: sha256(token), expiresAt });
  return { token, expiresAt };
}

function setSessionCookie(req: Request, res: Response, token: string) {
  res.cookie(ACCOUNT_SESSION_COOKIE, token, { ...getAccountSessionCookieOptions(req), maxAge: ACCOUNT_SESSION_MAX_AGE_MS });
}

function clearSessionCookie(req: Request, res: Response) {
  res.clearCookie(ACCOUNT_SESSION_COOKIE, { ...getAccountSessionCookieOptions(req), maxAge: -1 });
}

function readSessionToken(req: Request) {
  const header = req.headers.cookie || "";
  for (const item of header.split(";")) {
    const [key, ...rest] = item.trim().split("=");
    if (key === ACCOUNT_SESSION_COOKIE) {
      try {
        return decodeURIComponent(rest.join("="));
      } catch {
        return null;
      }
    }
  }
  return null;
}

export type AccountSession = AccountSessionView & { sessionId: number };

async function loadMemberships(db: Pick<Database, "select">, userId: number): Promise<AccountMembership[]> {
  const rows = await db
    .select({
      businessId: businesses.id,
      businessName: businesses.name,
      role: businessMemberships.role,
      description: businesses.description,
      sector: businesses.sector,
      country: businesses.country,
    })
    .from(businessMemberships)
    .innerJoin(businesses, eq(businessMemberships.businessId, businesses.id))
    .where(and(eq(businessMemberships.userId, userId), eq(businessMemberships.status, "active"), eq(businesses.status, "active")))
    .orderBy(businessMemberships.id);
  return rows.map(row => ({
    businessId: row.businessId,
    businessName: row.businessName,
    role: row.role,
    profileComplete: isBusinessProfileComplete(row),
  }));
}

/** With exactly one membership the business is chosen automatically; a switcher is a later phase. */
function chooseActiveBusiness(memberships: AccountMembership[]) {
  return memberships.length === 1 ? memberships[0] : null;
}

function buildView(user: { id: number; name: string | null; email: string | null }, memberships: AccountMembership[]): AccountSessionView {
  return {
    user: { id: user.id, fullName: user.name ?? "", email: user.email ?? "" },
    memberships,
    activeBusiness: chooseActiveBusiness(memberships),
  };
}

/** The single way to find who is signed in: the session cookie, checked against the database on every call. */
export async function resolveAccountSession(req: Request): Promise<AccountSession | null> {
  const token = readSessionToken(req);
  if (!token) return null;
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({ sessionId: userSessions.id, userId: users.id, name: users.name, email: users.email })
    .from(userSessions)
    .innerJoin(users, eq(userSessions.userId, users.id))
    .where(and(eq(userSessions.tokenHash, sha256(token)), isNull(userSessions.revokedAt), gt(userSessions.expiresAt, new Date()), eq(users.status, "active")))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const memberships = await loadMemberships(db, row.userId);
  return { sessionId: row.sessionId, ...buildView({ id: row.userId, name: row.name, email: row.email }, memberships) };
}

export function toAccountView({ sessionId: _sessionId, ...view }: AccountSession): AccountSessionView {
  return view;
}

/**
 * Isolation rule: a business id supplied by the client is never trusted. The caller must hold an active
 * membership in it. A business that does not exist and one the caller cannot access look the same.
 */
export function requireBusinessMembership(session: AccountSession, businessId: number): AccountMembership {
  const membership = session.memberships.find(item => item.businessId === businessId);
  if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: ACCOUNT_AUTH_ERRORS.noBusinessAccess });
  return membership;
}

async function emailIsReserved(db: Pick<Database, "select">, email: string) {
  if (email === OWNER_ADMIN_EMAIL) return true;
  const invited = await db.select({ id: adminInvitations.id }).from(adminInvitations).where(and(emailEquals(adminInvitations.email, email), eq(adminInvitations.status, "Pending"))).limit(1);
  return invited.length > 0;
}

/**
 * Creates the person, their password credential, their business, their owner membership and their first
 * session in ONE transaction: if any step fails, nothing is kept.
 */
export async function signUpAccount(req: Request, res: Response, rawInput: unknown) {
  assertSameOrigin(req);
  const parsed = signUpInputSchema.safeParse(rawInput);
  if (!parsed.success) throw new TRPCError({ code: "BAD_REQUEST", message: parsed.error.issues[0]?.message ?? "Check the details and try again." });
  const input = parsed.data;
  if (!consumeRateLimit("signup", req, input.email, 5)) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: ACCOUNT_AUTH_ERRORS.tooManyRequests });
  }
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  const passwordHash = hashAdminPassword(input.password);

  let created;
  try {
    created = await db.transaction(async tx => {
      const existing = await tx.select({ id: users.id }).from(users).where(emailEquals(users.email, input.email)).limit(1);
      if (existing.length > 0 || (await emailIsReserved(tx, input.email))) {
        throw new TRPCError({ code: "CONFLICT", message: ACCOUNT_AUTH_ERRORS.emailTaken });
      }
      const [user] = await tx.insert(users).values({
        openId: `local:${randomUUID()}`,
        name: input.fullName,
        email: input.email,
        loginMethod: "password",
        role: "user",
        status: "active",
      }).returning({ id: users.id });
      await tx.insert(userCredentials).values({ userId: user.id, passwordHash });
      const [business] = await tx.insert(businesses).values({
        name: input.businessName,
        slug: slugify(input.businessName),
        createdByUserId: user.id,
      }).returning({ id: businesses.id, name: businesses.name });
      await tx.insert(businessMemberships).values({ businessId: business.id, userId: user.id, role: "owner", status: "active" });
      const session = await createSession(tx, user.id);
      return { userId: user.id, business, session };
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new TRPCError({ code: "CONFLICT", message: ACCOUNT_AUTH_ERRORS.emailTaken });
    throw error;
  }

  setSessionCookie(req, res, created.session.token);
  const view = buildView(
    { id: created.userId, name: input.fullName, email: input.email },
    [{ businessId: created.business.id, businessName: created.business.name, role: "owner", profileComplete: false }],
  );
  return view;
}

/** Wrong email, wrong password, unknown account and suspended account all fail with the same message. */
export async function signInAccount(req: Request, res: Response, rawInput: { email: string; password: string }) {
  assertSameOrigin(req);
  const email = normaliseAccountEmail(rawInput.email);
  if (!consumeRateLimit("signin", req, email, ACCOUNT_MAX_FAILED_ATTEMPTS)) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: ACCOUNT_AUTH_ERRORS.tooManyRequests });
  }
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  const user = email ? (await db.select().from(users).where(emailEquals(users.email, email)).limit(1))[0] : undefined;
  const credential = user ? (await db.select().from(userCredentials).where(eq(userCredentials.userId, user.id)).limit(1))[0] : undefined;
  if (!user || !credential || user.status !== "active") {
    burnPasswordCheck(rawInput.password);
    throw new TRPCError({ code: "UNAUTHORIZED", message: ACCOUNT_AUTH_ERRORS.invalidCredentials });
  }
  if (credential.lockedUntil && credential.lockedUntil.getTime() > Date.now()) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: ACCOUNT_AUTH_ERRORS.tooManyRequests });
  }
  if (!verifyAdminPasswordHash(rawInput.password, credential.passwordHash)) {
    const attempts = credential.failedAttempts + 1;
    const lock = attempts >= ACCOUNT_MAX_FAILED_ATTEMPTS ? new Date(Date.now() + ACCOUNT_LOCKOUT_MS) : null;
    await db.update(userCredentials).set({ failedAttempts: lock ? 0 : attempts, lockedUntil: lock }).where(eq(userCredentials.id, credential.id));
    throw new TRPCError({ code: "UNAUTHORIZED", message: ACCOUNT_AUTH_ERRORS.invalidCredentials });
  }

  const session = await db.transaction(async tx => {
    await tx.update(userCredentials).set({ failedAttempts: 0, lockedUntil: null }).where(eq(userCredentials.id, credential.id));
    await tx.update(users).set({ lastSignedIn: databaseNow() }).where(eq(users.id, user.id));
    return createSession(tx, user.id);
  });
  releaseRateLimit("signin", req, email);
  setSessionCookie(req, res, session.token);
  return buildView(user, await loadMemberships(db, user.id));
}

/** Revokes the current session server-side and clears the cookie. Safe to call when already signed out. */
export async function signOutAccount(req: Request, res: Response) {
  assertSameOrigin(req);
  const token = readSessionToken(req);
  if (token) {
    const db = await getDb();
    if (db) {
      await db.update(userSessions).set({ revokedAt: databaseNow() }).where(and(eq(userSessions.tokenHash, sha256(token)), isNull(userSessions.revokedAt)));
    }
  }
  clearSessionCookie(req, res);
  return { success: true } as const;
}
