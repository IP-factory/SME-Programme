# Database migration state

The Supabase database is changed only by `pnpm db:migrate`; never by hand. The authoritative record is the database itself:
run `pnpm db:verify` (read-only, needs `MIGRATION_DATABASE_URL`). It reports PASS only when every migration in
`drizzle/migrations/meta/_journal.json` is recorded in `drizzle.__drizzle_migrations` with a matching hash.

## Applied to the Supabase database (permanent `public` schema)

| Migration | Applied | What it does |
|---|---|---|
| `0000_postgres_baseline` | before 2026-10-07 | The 30 tables and 42 enum types migrated from MySQL |
| `0001_business_check_pipeline` | 2026-10-07 | `business_checks`: pipeline stage enum (43 enums total), `pipelineStage`, `heardFrom`, `completedAt`, `updatedAt`; result columns made nullable; existing rows backfilled |
| `0002_universal_accounts_and_businesses` | 2026-10-07 | `user_credentials`, `user_sessions`, `businesses`, `business_memberships`; `users.status`; unique `lower(email)` index on `users`; 4 enum types (47 total) |
| `0003_client_onboarding_invitations` | applied (confirmed by `db:verify`) | `client_onboarding_invitations` (token hash, status, expiry, links to the business check, issuer, accepted user and business); 2 enum types (49 total); partial unique index (one pending invitation per business check) |
| `0004_platform_roles_and_active_workspace` | **NOT YET APPLIED** | `user_platform_roles` (userId, role, grantedByUserId; unique per user and role; 7-value role enum, 50 enums total); `user_sessions.activeBusinessId` (nullable, set null if the business is deleted) |

After `0003`, `pnpm db:verify` passed 27/27 (35 tables, 49 enums). After `0004` it expects 36 tables, 50 enums and 12 foreign keys.
Until `0004` is applied, `db:verify` fails and workspace switching, platform roles and the new account context cannot work against
that database (sign-in itself would fail, because the session lookup reads the new column). `0004` is additive: one new table
and one nullable column, so it cannot fail on existing data. **Apply it before deploying this code.**
