// Runs the PostgreSQL contract suite against a real database. The PGlite runs always execute in
// `pnpm test`; this command adds the TEST_DATABASE_URL targets, which are skipped when it is unset.
import { spawnSync } from "node:child_process";

if (!process.env.TEST_DATABASE_URL) {
  console.error(
    "TEST_DATABASE_URL is not set.\n" +
      "Use a disposable Supabase (or other PostgreSQL) database over a session-mode or direct connection.\n" +
      "The tests build and drop a throwaway schema; existing tables are never touched.",
  );
  process.exit(1);
}

const result = spawnSync("pnpm", ["exec", "vitest", "run", "test/db"], { stdio: "inherit", env: process.env });
process.exit(result.status ?? 1);
