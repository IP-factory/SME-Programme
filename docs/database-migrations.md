# Database migration state

The Supabase database is changed only by `pnpm db:migrate`; never by hand. The authoritative record is the database itself:
run `pnpm db:verify` (read-only, needs `MIGRATION_DATABASE_URL`). It reports PASS only when every migration in
`drizzle/migrations/meta/_journal.json` is recorded in `drizzle.__drizzle_migrations` with a matching hash.

## Applied to the Supabase database (permanent `public` schema)

| Migration | Applied | What it does |
|---|---|---|
| `0000_postgres_baseline` | before 2026-10-07 | The 30 tables and 42 enum types migrated from MySQL |
| `0001_business_check_pipeline` | 2026-10-07 | `business_checks`: pipeline stage enum (43 enums total), `pipelineStage`, `heardFrom`, `completedAt`, `updatedAt`; result columns made nullable; existing rows backfilled |

`pnpm db:verify` passed 25/25 checks after `0001` (291 columns, 43 enums).

## When you add a migration

1. Change `drizzle/schema.ts`, then `pnpm db:generate`.
2. Apply it with `pnpm db:migrate`, then run `pnpm db:verify`.
3. Add a row to the table above. Code that needs a new column must not ship before its migration is applied.
