import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

// One connection per function instance: Supabase's Transaction Pooler multiplexes the real connections,
// and node-postgres (unlike postgres.js) does not pipeline queries, which transaction pooling cannot serve.
const POOL_MAX_CONNECTIONS = 1;
const SSL_PARAMETERS = ["sslmode", "ssl", "sslcert", "sslkey", "sslrootcert"];

export function createPoolConfig(connectionString: string, env: NodeJS.ProcessEnv = process.env): pg.PoolConfig {
  const url = new URL(connectionString);
  const isLocal = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(url.hostname);
  // node-postgres lets URL parameters override the ssl option, so TLS is configured here and only here.
  for (const parameter of SSL_PARAMETERS) url.searchParams.delete(parameter);
  const ca = env.DATABASE_SSL_CA?.trim();
  return {
    connectionString: url.toString(),
    max: POOL_MAX_CONNECTIONS,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
    // Supabase's poolers present a private CA that Node does not trust by default. Without DATABASE_SSL_CA the
    // connection is encrypted but the server certificate is not verified; with it, verification is on.
    ssl: isLocal ? false : ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
  };
}

/** Created once per module (function instance), never per request. Statements are unnamed, so none are prepared. */
export function createPool(connectionString: string) {
  const pool = new pg.Pool(createPoolConfig(connectionString));
  pool.on("error", error => console.error("[Database] Idle client error:", error.message));
  return pool;
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = createPool(process.env.DATABASE_URL);
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _pool = null;
      _db = null;
    }
  }
  return _db;
}

/** Drains the pool (graceful shutdown and tests). The next getDb() call creates a fresh pool. */
export async function closeDb() {
  const pool = _pool;
  _pool = null;
  _db = null;
  await pool?.end();
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId || user.email === ENV.ownerAdminEmail) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // onConflictDoUpdate does not apply $onUpdate, so updatedAt is set explicitly.
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: { ...updateSet, updatedAt: new Date() },
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return null;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : null;
}

// TODO: add feature queries here as your schema grows.
