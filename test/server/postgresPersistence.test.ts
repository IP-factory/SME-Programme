import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect, getTableConfig } from "drizzle-orm/pg-core";
import * as schema from "../../drizzle/schema";
import { allTables } from "../db/harness";

const mocked = vi.hoisted(() => {
  process.env.DATABASE_URL = "postgresql://user:secret@db.example.test:6543/postgres";
  return {
    postgres: vi.fn(() => ({ marker: "client" })),
    drizzle: vi.fn(),
    onConflictDoUpdate: vi.fn(),
  };
});

vi.mock("postgres", () => ({ default: mocked.postgres }));
vi.mock("drizzle-orm/postgres-js", () => ({ drizzle: mocked.drizzle }));

import { createPostgresClient, getDb, upsertUser } from "@server/db";
import { emailEquals } from "@server/dbHelpers";

const root = process.cwd();

describe("database client for Vercel and the Supabase transaction pooler", () => {
  beforeEach(() => mocked.postgres.mockClear());

  it("disables prepared statements, keeps the pool small and requires TLS for remote hosts", () => {
    createPostgresClient("postgresql://user:secret@aws-1-eu-west-1.pooler.supabase.com:6543/postgres");
    expect(mocked.postgres).toHaveBeenCalledWith(
      "postgresql://user:secret@aws-1-eu-west-1.pooler.supabase.com:6543/postgres",
      expect.objectContaining({ prepare: false, max: 3, ssl: "require" }),
    );
  });

  it("does not force TLS for a local database", () => {
    createPostgresClient("postgresql://user:secret@localhost:5432/postgres");
    expect(mocked.postgres).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ prepare: false, ssl: false }));
  });

  it("reads the runtime DATABASE_URL lazily and caches the instance", async () => {
    mocked.drizzle.mockReturnValue({ insert: vi.fn() });
    const first = await getDb();
    expect(await getDb()).toBe(first);
    expect(mocked.drizzle).toHaveBeenCalledTimes(1);
  });
});

describe("upsertUser conflict handling", () => {
  it("upserts on openId and refreshes updatedAt explicitly", async () => {
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate: mocked.onConflictDoUpdate.mockResolvedValue(undefined) });
    mocked.drizzle.mockReturnValue({ insert: vi.fn().mockReturnValue({ values }) });
    vi.resetModules();
    const { upsertUser: freshUpsert } = await import("@server/db");
    await freshUpsert({ openId: "open-1", name: "Name" });
    const arguments_ = mocked.onConflictDoUpdate.mock.calls.at(-1)![0];
    // The module graph was reloaded, so compare by column identity rather than object reference.
    expect(arguments_.target.name).toBe("openId");
    expect(getTableConfig(arguments_.target.table).name).toBe("users");
    expect(arguments_.set.name).toBe("Name");
    expect(arguments_.set.updatedAt).toBeInstanceOf(Date);
  });

  it("exports upsertUser", () => expect(typeof upsertUser).toBe("function"));
});

describe("emailEquals", () => {
  it("compares lower(column) with the trimmed, lower-cased address as a bound parameter", () => {
    const query = new PgDialect().sqlToQuery(emailEquals(schema.users.email, "  Admin@Example.COM "));
    expect(query.sql).toBe('lower("users"."email") = $1');
    expect(query.params).toEqual(["admin@example.com"]);
  });
});

describe("PostgreSQL schema and migration history", () => {
  const archive = readFileSync(resolve(root, "drizzle/mysql-archive/schema.mysql.ts.txt"), "utf8");
  const mysqlTables = [...archive.matchAll(/mysqlTable\("(\w+)"/g)].map(match => match[1]).sort();
  const pgTables = allTables.map(table => getTableConfig(table).name).sort();
  const baseline = readFileSync(resolve(root, "drizzle/migrations/0000_postgres_baseline.sql"), "utf8");

  it("keeps all 30 table names from the MySQL schema", () => {
    expect(mysqlTables).toHaveLength(30);
    expect(pgTables).toEqual(mysqlTables);
  });

  it("keeps every column name from the MySQL schema", () => {
    for (const table of allTables) {
      const { name, columns } = getTableConfig(table);
      const block = archive.split(`mysqlTable("${name}"`)[1]!.split("export type")[0]!;
      const mysqlColumns = [...block.matchAll(/^\s+\w+: \w+\("(\w+)"/gm)].map(match => match[1]).sort();
      expect(columns.map(column => column.name).sort(), name).toEqual(mysqlColumns);
    }
  });

  it("creates all 30 tables and 42 enum types in the baseline migration", () => {
    expect(baseline.match(/^CREATE TABLE /gm)).toHaveLength(30);
    expect(baseline.match(/^CREATE TYPE /gm)).toHaveLength(42);
  });

  it("contains no MySQL-specific SQL in the active migration directory", () => {
    const files = readdirSync(resolve(root, "drizzle/migrations")).filter(file => file.endsWith(".sql"));
    expect(files).toEqual(["0000_postgres_baseline.sql"]);
    for (const pattern of [/`/, /AUTO_INCREMENT/i, /\bENGINE\s*=/i, /CHARSET/i, /ON UPDATE CURRENT_TIMESTAMP/i, /\bmysql/i, /\bdatetime\b/i, /\btinyint\b/i]) {
      expect(baseline).not.toMatch(pattern);
    }
  });

  it("archives the inherited MySQL history instead of deleting it", () => {
    const archived = readdirSync(resolve(root, "drizzle/mysql-archive")).filter(file => file.endsWith(".sql"));
    expect(archived).toHaveLength(24);
    expect(JSON.parse(readFileSync(resolve(root, "drizzle/migrations/meta/_journal.json"), "utf8")).dialect).toBe("postgresql");
  });

  it("no longer references MySQL in application code or dependencies", () => {
    const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as { dependencies: Record<string, string> };
    expect(packageJson.dependencies.mysql2).toBeUndefined();
    expect(packageJson.dependencies.postgres).toBeDefined();
    const walk = (directory: string): string[] =>
      readdirSync(directory, { withFileTypes: true }).flatMap(entry => (entry.isDirectory() ? walk(resolve(directory, entry.name)) : [resolve(directory, entry.name)]));
    const offenders = ["server", "scripts", "shared"].flatMap(directory => walk(resolve(root, directory)))
      .filter(file => /\.(ts|tsx|mjs)$/.test(file))
      .filter(file => /mysql|insertId|onDuplicateKeyUpdate|affectedRows|ER_DUP_ENTRY/.test(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });
});
