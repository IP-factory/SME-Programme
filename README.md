# IP Factory (IPF) — Business Support Platform

Participant registration, portal and programme-administration platform for IP Factory (Intellectual Property Factory) business support. Migrated from the JUMP 2026 platform; the existing, tested functionality is being preserved and rebranded rather than rebuilt.

> **Migration in progress.** See [`docs/ipf-factory/MIGRATION_CHECKLIST.md`](docs/ipf-factory/MIGRATION_CHECKLIST.md) for the audit, the phased plan and open decisions. The platform is being moved off Manus to independent hosting; variables marked LEGACY in `.env.example` belong to the Manus integrations being replaced.

## What it does

- **Public site & registration** — landing page, staged diagnostic registration, pricing enquiries, referrals.
- **Participant portal** — email/password sign-in with lockout, engagement brief and consent, Current State Assessment, programme tracker, session booking, payment guidance, receipt and assignment uploads, working-diagnostic PDF.
- **Admin dashboard** — capability-scoped administrators (Super Admin + invited admins with a second password factor), registrations, pathway reconciliation, payment-receipt review, email history and inbound replies, scheduling, information-session attendance.
- **Communications** — transactional email via Resend (Gmail API fallback), monitoring BCC, `.ics` invitations, 24-hour session reminders.

## Stack

React 19 + Vite + Tailwind 4 (client) · Express 5 + tRPC 11 (server) · Drizzle ORM + MySQL · Vitest.

```
client/      React app (pages/, components/, lib/)
server/      Express + tRPC server, routers/, domain modules, tests
server/_core Platform plumbing (env, auth context, cookies, storage proxy, Vite integration)
shared/      Code shared by client and server (programme rules, templates, permissions)
drizzle/     Schema (schema.ts) and SQL migrations
scripts/     One-off operational scripts (JUMP-era; do not run against an IPF database without review)
docs/        Operational and migration documentation
```

## Getting started

Requirements: Node 22, pnpm 10 (`corepack enable`), a MySQL database for anything beyond tests and builds.

```bash
pnpm install
cp .env.example .env   # fill in values locally — never commit .env
pnpm dev               # http://localhost:3000
```

| Command | Purpose |
|---|---|
| `pnpm check` | TypeScript typecheck |
| `pnpm test` | Unit and UI tests (no network or secrets required) |
| `pnpm build` | Production client + server bundle into `dist/` |
| `pnpm start` | Run the production bundle |
| `pnpm db:push` | Generate and apply Drizzle migrations (requires `DATABASE_URL`) |

CI (`.github/workflows/ci.yml`) runs check, test and build on every push and pull request.

### Live integration tests

Tests that call real Resend or Google APIs are skipped unless explicitly enabled with real credentials:

```bash
VALIDATE_RESEND_CREDENTIALS=1 VALIDATE_RESEND_SENDER=1 VALIDATE_GOOGLE_CALENDAR=1 pnpm test
```

## Configuration

All configuration is via environment variables; see [`.env.example`](.env.example) for the full list. Secrets are created and held in the IPF-owned hosting environment and are never committed or shared in documents.

## Data protection

This repository must not contain participant personal data, bank details or credentials. Use fictional fixtures (`@example.com`) in tests. Participant data migration follows the approved, separate process in the handover plan.
