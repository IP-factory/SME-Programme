import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import {
  participantAuthTokens,
  participantCredentials,
  participantPasswordTokens,
  registrations,
  type Registration,
} from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";
import { getSessionCookieOptions } from "./_core/cookies";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { buildBrandedEmailHtml } from "./emailTemplates";
import { getTrustedApplicationOrigin } from "./security";
import { BRAND } from "../shared/brand";
import { databaseNow } from "./dbHelpers";
export const PARTICIPANT_SESSION_COOKIE = "jump_participant_session";
export const PARTICIPANT_PASSWORD_MIN_LENGTH = 5;
const PARTICIPANT_PASSWORD_LINK_TTL_MS = 20 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PARTICIPANT_PASSWORD_LOCKOUT_MS = 15 * 60 * 1000;

export type ParticipantPasswordTokenPurpose = "setup" | "reset";

export type ParticipantTokenLifecycle = {
  expiresAt: Date;
  consumedAt?: Date | null;
  revokedAt?: Date | null;
};

export function normalizeParticipantEmail(email: string | null | undefined) {
  return (email || "").trim().toLowerCase();
}

export function validateParticipantPassword(password: string) {
  if (password.length < PARTICIPANT_PASSWORD_MIN_LENGTH) {
    return `Use at least ${PARTICIPANT_PASSWORD_MIN_LENGTH} characters.`;
  }
  return null;
}

export function hashParticipantPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt$${salt}$${hash}`;
}

export function verifyParticipantPasswordHash(password: string, stored: string) {
  const [scheme, salt, expected] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !expected) return false;
  const actual = scryptSync(password, salt, 64).toString("base64url");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function readCookie(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return undefined;
  return cookieHeader.split(";").map(value => value.trim()).find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

function getPortalOrigin(req: TrpcContext["req"]) {
  void req;
  return getTrustedApplicationOrigin();
}

export function buildParticipantPasswordUrl(origin: string, token: string) {
  return `${origin}/portal/password?token=${encodeURIComponent(token)}`;
}

export function buildParticipantPasswordLinkEmail(fullName: string, passwordUrl: string, purpose: ParticipantPasswordTokenPurpose) {
  const firstName = fullName.trim().split(/\s+/)[0] || fullName;
  const isReset = purpose === "reset";
  const action = isReset ? "reset your password" : "set your participant password";
  return {
    subject: isReset ? `Reset your ${BRAND.programmeName} participant password` : `Set your ${BRAND.programmeName} participant password`,
    body: `Dear ${fullName},\n\n${isReset ? `We received a request to reset your ${BRAND.programmeName} participant password.` : `Your ${BRAND.programmeName} participant portal is ready. Please set a password so you can sign in normally whenever you return.`}\n\nUse this secure link to ${action}:\n${passwordUrl}\n\nFor your protection, this link expires in 20 minutes and can only be used once. Once complete, return to the ${BRAND.programmeShortName} website and sign in with your registered email address and password. Your browser can remember your sign-in on this device for 30 days.\n\nIf you did not request this, you may safely ignore this email.\n\nWarm regards,\n${BRAND.facilitatorName}\nFacilitator, ${BRAND.programmeName} — Strategy & Innovation Genius Track`,
    html: buildBrandedEmailHtml({
      label: isReset ? "Participant password reset" : "Participant account setup",
      title: isReset ? "Reset your portal password" : "Set your portal password",
      preheader: isReset ? `Choose a new password for your private ${BRAND.programmeShortName} participant portal.` : `Choose a password for your private ${BRAND.programmeShortName} participant portal.`,
      greeting: `Dear ${firstName},`,
      paragraphs: [
        isReset ? `We received a request to reset your ${BRAND.programmeName} participant password.` : `Your ${BRAND.programmeName} participant portal is ready. Please set a password so you can sign in normally whenever you return.`,
        `After setting your password, return to the ${BRAND.programmeShortName} website and sign in with your registered email address and password. Your browser can remember your sign-in on this device for 30 days.`,
      ],
      cta: { label: isReset ? "Reset my password" : "Set my password", url: passwordUrl },
      callout: "For your protection, this link expires in 20 minutes and can only be used once.",
      footerNote: "If you did not request this password action, you may safely ignore this email.",
    }),
  };
}

async function resolveCanonicalParticipantRegistration(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, registrationId: number) {
  let currentRegistrationId = registrationId;
  const seen = new Set<number>();
  for (let depth = 0; depth < 4; depth += 1) {
    if (seen.has(currentRegistrationId)) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Participant pathway reconciliation is invalid." });
    }
    seen.add(currentRegistrationId);
    const applicant = (await db.select().from(registrations).where(eq(registrations.id, currentRegistrationId)).limit(1))[0];
    if (!applicant) return undefined;
    if (!applicant.supersededByRegistrationId) return applicant;
    currentRegistrationId = applicant.supersededByRegistrationId;
  }
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Participant pathway reconciliation exceeded its safety limit." });
}

async function validateParticipantRegistration(registrationId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  const applicant = await resolveCanonicalParticipantRegistration(db, registrationId);
  if (!applicant || applicant.status === "Rejected") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "This registration is not eligible for participant portal access." });
  }
  return { db, applicant };
}

async function findEligibleParticipantByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  const normalized = normalizeParticipantEmail(email);
  const records = await db.select().from(registrations);
  const matching = records.find((record) => normalizeParticipantEmail(record.email) === normalized && !record.supersededByRegistrationId && record.status !== "Rejected")
    ?? records.find((record) => normalizeParticipantEmail(record.email) === normalized && record.status !== "Rejected");
  if (!matching) return { db, applicant: null as Registration | null };
  const applicant = await resolveCanonicalParticipantRegistration(db, matching.id);
  return { db, applicant: applicant && applicant.status !== "Rejected" ? applicant : null };
}

async function issueParticipantSession(ctx: TrpcContext, registrationId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  const sessionToken = randomBytes(32).toString("base64url");
  await db.insert(participantAuthTokens).values({
    registrationId,
    tokenHash: hashToken(sessionToken),
    purpose: "session",
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  ctx.res.cookie(PARTICIPANT_SESSION_COOKIE, sessionToken, getParticipantSessionCookieOptions(ctx.req));
}

export function getParticipantSessionCookieOptions(req: TrpcContext["req"]) {
  return { ...getSessionCookieOptions(req), maxAge: SESSION_TTL_MS };
}

export function isActiveParticipantToken(token: ParticipantTokenLifecycle, now = new Date()) {
  return !token.consumedAt && !token.revokedAt && token.expiresAt.getTime() > now.getTime();
}

export async function createParticipantPasswordLink(registrationId: number, req: TrpcContext["req"]) {
  const { db, applicant } = await validateParticipantRegistration(registrationId);
  const existingCredential = (await db.select({ id: participantCredentials.id })
    .from(participantCredentials).where(eq(participantCredentials.registrationId, applicant.id)).limit(1))[0];
  const purpose: ParticipantPasswordTokenPurpose = existingCredential ? "reset" : "setup";
  const now = new Date();
  await db.update(participantPasswordTokens).set({ revokedAt: now }).where(and(
    eq(participantPasswordTokens.registrationId, applicant.id),
    isNull(participantPasswordTokens.consumedAt),
    isNull(participantPasswordTokens.revokedAt),
  ));
  const token = randomBytes(32).toString("base64url");
  const inserted = await db.insert(participantPasswordTokens).values({
    registrationId: applicant.id,
    tokenHash: hashToken(token),
    purpose,
    expiresAt: new Date(Date.now() + PARTICIPANT_PASSWORD_LINK_TTL_MS),
  }).returning({ id: participantPasswordTokens.id });
  return {
    applicant,
    purpose,
    tokenId: Number(inserted[0].id),
    passwordUrl: buildParticipantPasswordUrl(getPortalOrigin(req), token),
  };
}

/** Compatibility function retained for existing invitation scripts; it now generates a password setup or reset link. */
export async function replaceParticipantPortalLink(registrationId: number, req: TrpcContext["req"]) {
  const passwordLink = await createParticipantPasswordLink(registrationId, req);
  return passwordLink.passwordUrl;
}

export async function completeParticipantPassword(ctx: TrpcContext, input: { token: string; password: string; confirmPassword: string }) {
  if (input.password !== input.confirmPassword) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The password confirmation does not match." });
  }
  const policyError = validateParticipantPassword(input.password);
  if (policyError) throw new TRPCError({ code: "BAD_REQUEST", message: policyError });
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  const passwordToken = (await db.select().from(participantPasswordTokens).where(and(
    eq(participantPasswordTokens.tokenHash, hashToken(input.token)),
    isNull(participantPasswordTokens.consumedAt),
    isNull(participantPasswordTokens.revokedAt),
    gt(participantPasswordTokens.expiresAt, new Date()),
  )).limit(1))[0];
  if (!passwordToken) {
    throw new TRPCError({ code: "NOT_FOUND", message: "This password link is unavailable or has expired. Kindly request a new one." });
  }
  if (!isActiveParticipantToken(passwordToken)) {
    throw new TRPCError({ code: "NOT_FOUND", message: "This password link is unavailable or has expired. Kindly request a new one." });
  }
  const { applicant } = await validateParticipantRegistration(passwordToken.registrationId);
  const now = new Date();
  await db.update(participantAuthTokens).set({ usedAt: now }).where(and(
    eq(participantAuthTokens.registrationId, applicant.id),
    eq(participantAuthTokens.purpose, "session"),
    isNull(participantAuthTokens.usedAt),
  ));
  await db.insert(participantCredentials).values({
    registrationId: applicant.id,
    passwordHash: hashParticipantPassword(input.password),
    failedAttempts: 0,
    lockedUntil: null,
  }).onConflictDoUpdate({
    target: participantCredentials.registrationId,
    set: {
      passwordHash: hashParticipantPassword(input.password),
      failedAttempts: 0,
      lockedUntil: null,
      updatedAt: databaseNow(),
    },
  });
  await db.update(participantPasswordTokens).set({ consumedAt: now }).where(eq(participantPasswordTokens.id, passwordToken.id));
  await issueParticipantSession(ctx, applicant.id);
  return { success: true, purpose: passwordToken.purpose, fullName: applicant.fullName };
}

export async function signInParticipantWithPassword(ctx: TrpcContext, email: string, password: string) {
  const { db, applicant } = await findEligibleParticipantByEmail(email);
  if (!applicant) throw new TRPCError({ code: "UNAUTHORIZED", message: "Your email or password is not correct." });
  const credential = (await db.select().from(participantCredentials)
    .where(eq(participantCredentials.registrationId, applicant.id)).limit(1))[0];
  if (!credential) throw new TRPCError({ code: "UNAUTHORIZED", message: "Your email or password is not correct. If this is your first visit, request a secure password link." });
  if (credential.lockedUntil && credential.lockedUntil.getTime() > Date.now()) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many attempts. Kindly try again in 15 minutes or reset your password." });
  }
  if (!verifyParticipantPasswordHash(password, credential.passwordHash)) {
    const nextAttempts = credential.failedAttempts + 1;
    const lock = nextAttempts >= 5 ? new Date(Date.now() + PARTICIPANT_PASSWORD_LOCKOUT_MS) : null;
    await db.update(participantCredentials).set({
      failedAttempts: lock ? 0 : nextAttempts,
      lockedUntil: lock,
    }).where(eq(participantCredentials.id, credential.id));
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: lock ? "Too many attempts. Kindly try again in 15 minutes or reset your password." : "Your email or password is not correct.",
    });
  }
  await db.update(participantCredentials).set({ failedAttempts: 0, lockedUntil: null }).where(eq(participantCredentials.id, credential.id));
  await issueParticipantSession(ctx, applicant.id);
  return { success: true, fullName: applicant.fullName };
}

export function clearParticipantSession(ctx: TrpcContext) {
  ctx.res.clearCookie(PARTICIPANT_SESSION_COOKIE, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
}

export async function getAuthenticatedParticipant(ctx: TrpcContext) {
  const rawSessionToken = readCookie(ctx.req.headers.cookie, PARTICIPANT_SESSION_COOKIE);
  if (!rawSessionToken) throw new TRPCError({ code: "UNAUTHORIZED", message: `Please sign in with your ${BRAND.programmeShortName} participant email and password.` });
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  const session = (await db.select().from(participantAuthTokens).where(and(
    eq(participantAuthTokens.tokenHash, hashToken(rawSessionToken)),
    eq(participantAuthTokens.purpose, "session"),
    isNull(participantAuthTokens.usedAt),
    gt(participantAuthTokens.expiresAt, new Date()),
  )).limit(1))[0];
  if (!session || !isActiveParticipantToken({ expiresAt: session.expiresAt, consumedAt: session.usedAt })) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Your participant sign-in has expired. Please sign in again with your email and password." });
  }
  const applicant = await resolveCanonicalParticipantRegistration(db, session.registrationId);
  if (!applicant || applicant.status === "Rejected") throw new TRPCError({ code: "UNAUTHORIZED", message: "This registration is not eligible for participant portal access." });
  return applicant;
}
