# Database migration state

The Supabase database is changed only by `pnpm db:migrate`; never by hand. The authoritative record is the database itself:
run `pnpm db:verify` (read-only, needs `MIGRATION_DATABASE_URL`). It reports PASS only when every migration in
`drizzle/migrations/meta/_journal.json` is recorded in `drizzle.__drizzle_migrations` with a matching hash.

## Applied to the Supabase database (permanent `public` schema)

| Migration | Applied | What it does |
|---|---|---|
| `0000_postgres_baseline` | before 2026-10-07 | The 30 tables and 42 enum types migrated from MySQL |
| `0001_business_check_pipeline` | 2026-10-07 | `business_checks`: pipeline stage enum (43 enums total), `pipelineStage`, `heardFrom`, `completedAt`, `updatedAt`; result columns made nullable; existing rows backfilled |

| `0002_universal_accounts_and_businesses` | **NOT YET APPLIED** (generated 2026-10-07) | `user_credentials`, `user_sessions`, `businesses`, `business_memberships`; `users.status`; unique `lower(email)` index on `users`; 4 enum types (47 total) |

`pnpm db:verify` passed 25/25 checks after `0001` (291 columns, 43 enums). After `0002` it expects 34 tables, 47 enums,
foreign keys and the email index. Until `0002` is applied, `db:verify` fails and the new `account.*` routes cannot work
against that database. `0002` fails safely (atomic) if two existing `users` rows share an email ignoring case.

## When you add a migration

1. Change `drizzle/schema.ts`, then `pnpm db:generate`.
2. Apply it with `pnpm db:migrate`, then run `pnpm db:verify`.
3. Add a row to the table above. Code that needs a new column must not ship before its migration is applied.
