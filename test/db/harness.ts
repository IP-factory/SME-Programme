import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { is, type SQL } from "drizzle-orm";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { getTableConfig, PgTable, type PgDatabase } from "drizzle-orm/pg-core";
import { vi } from "vitest";
import * as schema from "../../drizzle/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPgDb = PgDatabase<any, any, any>;

export type DbHarness = {
  label: string;
  db: AnyPgDb;
  /** Runs a raw statement and returns its rows. */
  query: (statement: SQL) => Promise<Record<string, unknown>[]>;
  close: () => Promise<void>;
};

const MIGRATIONS_DIR = resolve(process.cwd(), "drizzle/migrations");

/** Every active migration statement, in journal order. */
export function activeMigrationStatements(schemaName?: string): string[] {
  const journal = JSON.parse(readFileSync(resolve(MIGRATIONS_DIR, "meta/_journal.json"), "utf8")) as { entries: { tag: string }[] };
  return journal.entries.flatMap(({ tag }) =>
    readFileSync(resolve(MIGRATIONS_DIR, `${tag}.sql`), "utf8")
      .split("--> statement-breakpoint")
      .map(statement => statement.trim())
      .filter(Boolean)
      .map(statement => (schemaName ? statement.replaceAll('"public".', `"${schemaName}".`) : statement)),
  );
}

export function rowsOf(result: unknown): Record<string, unknown>[] {
  return (Array.isArray(result) ? result : (result as { rows: Record<string, unknown>[] }).rows) ?? [];
}

/** An in-process PostgreSQL (PGlite) with the baseline migration applied. Hermetic: no network, no secrets. */
export async function createPgliteHarness(): Promise<DbHarness> {
  const pg = new PGlite();
  for (const statement of activeMigrationStatements()) await pg.exec(statement);
  const db = drizzlePglite(pg);
  return {
    label: "PGlite",
    db,
    query: async statement => rowsOf(await db.execute(statement)),
    close: () => pg.close(),
  };
}

/**
 * A real PostgreSQL database (TEST_DATABASE_URL). The baseline migration is applied into a throwaway
 * schema that is dropped afterwards, so no existing table is touched. Use a session-mode or direct URL.
 */
export async function createRemoteHarness(url: string): Promise<DbHarness> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { default: postgres } = await vi.importActual<any>("postgres");
  const { drizzle } = await vi.importActual<typeof import("drizzle-orm/postgres-js")>("drizzle-orm/postgres-js");
  const schemaName = `contract_${randomBytes(6).toString("hex")}`;
  // One connection, so the search_path set below applies to every statement.
  const client = postgres(url, { max: 1, prepare: false, onnotice: () => undefined, ssl: /@(localhost|127\.0\.0\.1)[:/]/.test(url) ? false : "require" });
  await client.unsafe(`create schema "${schemaName}"`);
  await client.unsafe(`set search_path to "${schemaName}"`);
  for (const statement of activeMigrationStatements(schemaName)) await client.unsafe(statement);
  const db = drizzle(client);
  return {
    label: "TEST_DATABASE_URL",
    db,
    query: async statement => rowsOf(await db.execute(statement)),
    close: async () => {
      await client.unsafe(`drop schema "${schemaName}" cascade`);
      await client.end();
    },
  };
}

export const allTables = (Object.values(schema) as unknown[]).filter((value): value is PgTable => is(value, PgTable));

/** Postgres error code, whether raised directly or wrapped by Drizzle in `cause`. */
export function pgErrorCode(error: unknown): string | undefined {
  const candidate = error as { code?: string; cause?: { code?: string } } | undefined;
  return candidate?.code ?? candidate?.cause?.code;
}

let counter = 0;

/** A minimal valid row for any table: only columns that are NOT NULL and have no default. */
export function fixtureRow(table: PgTable, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const column of getTableConfig(table).columns) {
    if (!column.notNull || column.hasDefault || column.generatedIdentity) continue;
    counter += 1;
    const unique = `${counter}-${randomBytes(3).toString("hex")}`;
    switch (column.columnType) {
      case "PgInteger": row[column.name] = counter; break;
      case "PgText": row[column.name] = `text-${unique}`; break;
      case "PgVarchar": row[column.name] = `v-${unique}`.slice(0, (column as unknown as { length?: number }).length ?? 255); break;
      case "PgTimestamp": row[column.name] = new Date(); break;
      case "PgEnumColumn": row[column.name] = column.enumValues![0]; break;
      default: throw new Error(`fixtureRow: unsupported column type ${column.columnType} on ${column.name}`);
    }
  }
  return { ...row, ...overrides };
}
