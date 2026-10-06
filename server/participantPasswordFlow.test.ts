import { beforeEach, describe, expect, it, vi } from "vitest";
import { participantAuthTokens, participantCredentials, participantPasswordTokens, registrations } from "../drizzle/schema";

const dbMock = vi.hoisted(() => ({ getDb: vi.fn() }));

vi.mock("./db", () => ({ getDb: dbMock.getDb }));

import {
  clearParticipantSession,
  completeParticipantPassword,
  hashParticipantPassword,
  signInParticipantWithPassword,
} from "./participantAuth";

function queryResult<T>(rows: T[]) {
  const result = Promise.resolve(rows) as Promise<T[]> & { limit: (count: number) => Promise<T[]> };
  result.limit = (count: number) => Promise.resolve(rows.slice(0, count));
  return result;
}

function registration() {
  return {
    id: 901,
    email: "participant@example.com",
    status: "Accepted",
    supersededByRegistrationId: null,
  } as never;
}

function createFakeDb(input: {
  credential?: { id: number; registrationId: number; passwordHash: string; failedAttempts: number; lockedUntil: Date | null };
  passwordToken?: { id: number; registrationId: number; purpose: "setup" | "reset"; expiresAt: Date; consumedAt: Date | null; revokedAt: Date | null };
}) {
  const updates: Array<{ table: unknown; values: Record<string, unknown> }> = [];
  const inserts: Array<{ table: unknown; values: Record<string, unknown> }> = [];
  const fakeDb = {
    select: () => ({
      from: (table: unknown) => ({
        where: () => {
          if (table === registrations) return queryResult([registration()]);
          if (table === participantCredentials) return queryResult(input.credential ? [input.credential] : []);
          if (table === participantPasswordTokens) return queryResult(input.passwordToken ? [input.passwordToken] : []);
          return queryResult([]);
        },
      }),
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: async () => {
          updates.push({ table, values });
          return { affectedRows: 1 };
        },
      }),
    }),
    insert: (table: unknown) => ({
      values: async (values: Record<string, unknown>) => {
        inserts.push({ table, values });
        return [{ insertId: 1 }];
      },
    }),
  };
  return { fakeDb, updates, inserts };
}

function participantContext() {
  const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];
  return {
    ctx: {
      req: { protocol: "https", headers: {} },
      res: {
        cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }),
        clearCookie: (name: string, options: Record<string, unknown>) => clearedCookies.push({ name, options }),
      },
      user: null,
    } as never,
    cookies,
    clearedCookies,
  };
}

describe("participant password authentication flows", () => {
  beforeEach(() => dbMock.getDb.mockReset());

  it("verifies a valid participant password, persists a session token, and writes a secure 30-day cookie", async () => {
    const { fakeDb, inserts } = createFakeDb({
      credential: { id: 11, registrationId: 901, passwordHash: hashParticipantPassword("StrongPass123!"), failedAttempts: 2, lockedUntil: null },
    });
    dbMock.getDb.mockResolvedValue(fakeDb);
    const { ctx, cookies } = participantContext();

    await expect(signInParticipantWithPassword(ctx, "participant@example.com", "StrongPass123!")).resolves.toMatchObject({ success: true });

    expect(inserts).toContainEqual(expect.objectContaining({ table: participantAuthTokens, values: expect.objectContaining({ registrationId: 901, purpose: "session" }) }));
    expect(cookies).toHaveLength(1);
    expect(cookies[0]).toMatchObject({ name: "jump_participant_session", options: expect.objectContaining({ httpOnly: true, secure: true, maxAge: 30 * 24 * 60 * 60 * 1000 }) });
  });

  it("rejects a wrong password and increments failed attempts without creating a session", async () => {
    const { fakeDb, inserts, updates } = createFakeDb({
      credential: { id: 11, registrationId: 901, passwordHash: hashParticipantPassword("StrongPass123!"), failedAttempts: 1, lockedUntil: null },
    });
    dbMock.getDb.mockResolvedValue(fakeDb);
    const { ctx, cookies } = participantContext();

    await expect(signInParticipantWithPassword(ctx, "participant@example.com", "WrongPassword123!")).rejects.toMatchObject({ message: "Your email or password is not correct." });

    expect(inserts).toHaveLength(0);
    expect(cookies).toHaveLength(0);
    expect(updates).toContainEqual(expect.objectContaining({ table: participantCredentials, values: expect.objectContaining({ failedAttempts: 2 }) }));
  });

  it("requires first-time participants to create a password without disclosing a registered email", async () => {
    const { fakeDb, inserts } = createFakeDb({});
    dbMock.getDb.mockResolvedValue(fakeDb);
    const { ctx } = participantContext();

    await expect(signInParticipantWithPassword(ctx, "participant@example.com", "StrongPass123!")).rejects.toMatchObject({ message: "Your email or password is not correct. If this is your first visit, request a secure password link." });

    expect(inserts).toHaveLength(0);
  });

  it("locks an account for 15 minutes on the fifth incorrect password attempt", async () => {
    const { fakeDb, updates } = createFakeDb({
      credential: { id: 11, registrationId: 901, passwordHash: hashParticipantPassword("StrongPass123!"), failedAttempts: 4, lockedUntil: null },
    });
    dbMock.getDb.mockResolvedValue(fakeDb);
    const { ctx } = participantContext();

    await expect(signInParticipantWithPassword(ctx, "participant@example.com", "WrongPassword123!")).rejects.toMatchObject({ message: "Too many attempts. Kindly try again in 15 minutes or reset your password." });

    expect(updates).toContainEqual(expect.objectContaining({ table: participantCredentials, values: expect.objectContaining({ failedAttempts: 0, lockedUntil: expect.any(Date) }) }));
  });

  it("refuses an expired password reset or setup token before any credential or session is written", async () => {
    const { fakeDb, inserts } = createFakeDb({
      passwordToken: { id: 21, registrationId: 901, purpose: "reset", expiresAt: new Date(Date.now() - 60_000), consumedAt: null, revokedAt: null },
    });
    dbMock.getDb.mockResolvedValue(fakeDb);
    const { ctx, cookies } = participantContext();

    await expect(completeParticipantPassword(ctx, { token: "x".repeat(32), password: "StrongPass123!", confirmPassword: "StrongPass123!" })).rejects.toMatchObject({ message: "This password link is unavailable or has expired. Kindly request a new one." });

    expect(inserts).toHaveLength(0);
    expect(cookies).toHaveLength(0);
  });

  it("clears the participant session cookie on logout", () => {
    const { ctx, clearedCookies } = participantContext();
    clearParticipantSession(ctx);
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]).toMatchObject({ name: "jump_participant_session", options: expect.objectContaining({ maxAge: -1, httpOnly: true, secure: true }) });
  });
});
