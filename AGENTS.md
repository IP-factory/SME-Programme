# Instructions for agents

Read this before changing anything. It applies to every agent and person working in this repository.

## Non-negotiable rules

1. **Every new feature or behaviour change ships with tests.** Add or update tests under `test/` in the same commit as the change. A bug fix starts with a test that reproduces the bug.
2. **Nothing is pushed until `pnpm verify` passes.** It runs the app typecheck, the test typecheck, every test and the production build. If it fails, fix the cause; never skip, disable or loosen a test to get green.
3. **Existing features must keep working.** If a change breaks an existing test, the change is wrong until proven otherwise. Change a test's expectation only when the behaviour change is intended, and say so in the commit message.
4. **No secrets in code, tests, docs or commits.** Read configuration with `process.env` (server) through `server/_core/env.ts`. Real values live in `.env` (git-ignored) locally and in the hosting provider's settings in production. `.env.example` lists names only.
5. **No real personal data in the repository.** Tests use fictional people and `@example.com` addresses.

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | Install dependencies (Node 22, pnpm 10) |
| `pnpm dev` | Run the app locally on http://localhost:3000 |
| `pnpm verify` | **Run before every push:** `check`, `check:tests`, `test`, `build` |
| `pnpm check` | Typecheck the app |
| `pnpm check:tests` | Typecheck the tests |
| `pnpm test` | All unit, UI and in-memory database tests (no network or secrets needed) |
| `pnpm build` | Production bundle; also regenerates `api/index.js` for Vercel. Commit the regenerated file: CI fails if it is stale |
| `pnpm build:preview` | Static clickable preview in `dist/preview` with a simulated server |
| `pnpm test:db` | Database contract tests against a real PostgreSQL (`TEST_DATABASE_URL`, disposable database only) |
| `pnpm db:generate` / `pnpm db:migrate` | Create / apply a migration (`MIGRATION_DATABASE_URL`) |
| `pnpm db:verify` | Read-only check that a database matches the schema |

## Architecture

```
client/src/       React 19 + Vite + Tailwind 4 (pages/, components/, lib/, preview/)
server/           Express 5 + tRPC 11: routers/, domain modules (email, scheduling, businessCheck…)
server/_core/     Platform plumbing: env, auth, cookies, storage proxy, app.ts (Express app),
                  index.ts (local/Node server), vercelEntry.ts + vercelGateway.ts (Vercel function)
shared/           Code used by both client and server: brand.ts, businessSupport.ts (prices, journey,
                  problem areas), businessCheck/ (questions, sector examples, engine, service catalogue)
drizzle/          PostgreSQL schema (schema.ts) and migrations (migrations/); mysql-archive/ is history only
api/index.js      GENERATED server bundle for Vercel. Never edit; `pnpm build` regenerates it
test/             All tests, mirroring the source folders: test/client, test/server, test/shared,
                  test/db (database contract tests), test/fixtures
docs/             Operational and migration notes; docs/vercel-env-inventory.md lists every env variable
```

- **Hosting:** Vercel. Static client from `vite build`; all server routes go through one function, `api/index.js`, via the rewrites in `vercel.json`.
- **Database:** PostgreSQL on Supabase through Drizzle and node-postgres. At runtime `DATABASE_URL` uses the Transaction Pooler (port 6543, one connection per function instance). Migrations use `MIGRATION_DATABASE_URL` (Session Pooler, port 5432). Schema changes go through `drizzle/schema.ts` then `pnpm db:generate`; never edit the database by hand.
- **Single sources of truth:** names, mailboxes and brand colours in `shared/brand.ts`; prices, the journey and the ten problem areas in `shared/businessSupport.ts`; business check questions in `shared/businessCheck/questions.ts`, sector examples in `sectorExamples.ts`, path and scoring rules in `engine.ts`, recommendable services in `catalogue.ts`.

## Testing

- Put tests in `test/`, at the path that mirrors the source file (`server/routers/x.ts` → `test/server/routers/x.test.ts`). Import source through the aliases `@/`, `@shared/`, `@server/`.
- Tests must run offline with no secrets. Mock email, the AI model and third-party APIs. Tests that need real credentials or a real database are skipped unless their variable is set (`VALIDATE_*`, `TEST_DATABASE_URL`).
- Database behaviour: add to `test/db/` using the PGlite harness (`test/db/harness.ts`), so it runs in `pnpm test` and against a real PostgreSQL with `pnpm test:db`.
- The business check has golden snapshots (`test/server/businessCheck.profiles.golden.test.ts`). Update a snapshot only for an intended change to the path, scoring or summary, and say why in the commit.
- UI tests use Testing Library with jsdom. Set `MotionGlobalConfig.skipAnimations = true` for animated screens.

## Conventions

- Copy: British English, second person, short sentences, naira in full (₦100,000). On the site, never "door", "sprint", "playbook" or "retainer". The business check sits between consulting terms and plain English: keep the term, say what it means.
- Colours come from the theme tokens in `client/src/index.css`; do not hard-code hex values in components.
- React effects must not return a value other than a cleanup function (the claude.ai preview frame breaks if they do).
- Keep changes focused. Match the surrounding code's style and comment density.
- Commit messages say what changed and why. Do not push to `main` directly; work on a branch and open a pull request.
