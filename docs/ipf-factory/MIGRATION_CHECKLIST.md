# IPF Factory — Migration Checklist & Baseline Audit

**Prepared:** 6 October 2026
**Scope:** Take-over audit of the migrated JUMP 2026 platform. Read-only: no application behaviour has been changed.
**Companion to:** `IPF_FACTORY_HANDOVER_PLAN.md` (the seven-step route). This document is the engineering view of Steps 2, 4 and 5.

> This file deliberately does **not** reproduce secrets, bank account numbers, or participant personal data. It points to where they live (`file:line`) so they can be dealt with.

---

## 1. Baseline health (as received)

| Gate | Command | Result |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | ✅ Clean (pnpm 10.4.1, Node 22). Build scripts for `esbuild` / `@tailwindcss/oxide` are not approved, but the build still succeeds. |
| Typecheck | `pnpm check` | ✅ 0 errors |
| Build | `pnpm build` | ✅ Passes. Client bundle is 898 kB (233 kB gzip), over Vite's 500 kB warning. Server bundle is 278 kB. |
| Tests | `pnpm test` | ⚠️ **145 pass / 6 fail / 4 skipped** (54 files) |

### The 6 failing tests

| Test | Cause | Classification |
|---|---|---|
| `server/resend.secret.test.ts` (1) | Calls the live Resend API and needs `RESEND_API_KEY` | Live-credential integration test that is not gated by an env flag. Expected to fail without secrets. |
| `server/calendar.credentials.integration.test.ts` (1) | Calls the live Google Calendar API and needs the Google OAuth env vars | Same as above |
| `server/participantPasswordFlow.test.ts` (4) | `TypeError: records.find is not a function` | **Real test drift.** `findEligibleParticipantByEmail` (`server/participantAuth.ts:128`) now runs `db.select().from(registrations)` with no `.where()`. The test's fake DB only supports `from().where()`. The code changed and the mock did not. |

Note on `server/participantAuth.ts:128`: the eligibility lookup loads **every registration row** to match one email. That is fine at cohort scale. Revisit it before IPF scales the programme, for performance and to keep data exposure low.

---

## 2. Platform dependency map

The app is a **Manus WebDev template**: React 19 + Vite + tRPC + Express + Drizzle/MySQL. Several core capabilities are provided by the Manus platform rather than by the code:

| Capability | Provider today | Where | Portable? |
|---|---|---|---|
| Admin identity (OAuth) | Manus OAuth portal (`OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `VITE_APP_ID`, `OWNER_OPEN_ID`) | `server/_core/sdk.ts`, `server/_core/oauth.ts`, `client/src/const.ts` | Only inside a Manus workspace. Leaving Manus means replacing admin login. |
| File storage (receipts, briefs, assignments, portrait) | Manus Forge → S3 presign (`BUILT_IN_FORGE_API_URL/KEY`), served at `/manus-storage/*` | `server/storage.ts`, `server/_core/storageProxy.ts`, `server/routers/participant.ts:439,500` | Only inside Manus. The stored file keys must be migrated with the DB. |
| LLM (AI consulting chat, diagnostic) | Manus Forge (`forge.manus.im`) | `server/_core/llm.ts:218,440` | Only inside Manus |
| Owner notifications, maps, image gen, voice | Manus Forge | `server/_core/notification.ts`, `map.ts`, `imageGeneration.ts`, `voiceTranscription.ts`, `client/src/components/Map.tsx:92` | Only inside Manus |
| Scheduled jobs (24h reminders) | Manus heartbeat → `POST /api/scheduled/*` | `server/_core/heartbeat.ts`, `server/_core/index.ts:101` | Only inside Manus |
| Dev tooling | `vite-plugin-manus-runtime`, debug collector, `*.manus.computer` allowed hosts | `vite.config.ts`, `client/public/__manus__/` | Harmless outside Manus |
| Analytics | Umami (`VITE_ANALYTICS_ENDPOINT`, `VITE_ANALYTICS_WEBSITE_ID`) | `client/index.html` | Portable |
| Database | MySQL (`DATABASE_URL`), 23 Drizzle migrations | `drizzle/` | Portable |

**Implication:** the handover plan assumes a **new IPF-owned Manus workspace**. On that path, the items above are re-provisioned, not rewritten. Moving IPF off Manus would mean replatforming auth, storage, LLM and scheduling. That is a separate decision with a separate budget (see §6, D9).

---

## 3. Environment variables (names only — recreate under IPF ownership)

| Variable | Purpose | Notes |
|---|---|---|
| `DATABASE_URL` | MySQL connection | New IPF database |
| `JWT_SECRET` | Session cookie signing | **Generate fresh.** Do not reuse JUMP's. All existing sessions will be invalidated, which is the intended effect. |
| `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL` | Manus OAuth | Issued by the IPF Manus workspace |
| `OWNER_OPEN_ID` | Super Admin identity | Set to the IPF owner's Manus openId |
| `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY` | Manus storage/LLM/notifications | Issued by the IPF Manus workspace |
| `RESEND_API_KEY` | Primary email delivery | IPF Resend account with the IPF sending domain verified |
| `EMAIL_FROM`, `EMAIL_REPLY_TO` | Sender identity | **Currently overridden in code.** See §4.3. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` | Google Calendar (+ Gmail fallback) | IPF Google Workspace OAuth client |
| `JUMP_GMAIL_REFRESH_TOKEN` | Programme mailbox reply sync | Rename for IPF. The name itself is JUMP-specific. |
| `GOOGLE_CALENDAR_ID` | Session calendar | Defaults to `primary` |
| `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY` | Paystack verify flow | IPF Paystack merchant account |
| `VITE_ANALYTICS_ENDPOINT`, `VITE_ANALYTICS_WEBSITE_ID` | Umami | Optional |
| `VALIDATE_RESEND_SENDER`, `VALIDATE_RESEND_CREDENTIALS` | Opt-in live tests | Test-only flags |

There is no `.env.example` in the repo. Phase 0 should add one with names only.

---

## 4. Hard-coded configuration inventory

Volume (excluding lockfile): **JUMP** 616 matches in 100 files. **Emmanuel/Tarfa** 653 in 78. **emmanueltarfa** domain 128 in 42. **manus** 114 in 31. **gmail** 230 in 44. **paystack** 111 in 28. Of these, **24 test files** assert on JUMP/Emmanuel strings, so any rebrand has to update code and tests together.

### 4.1 Domain & origin (production-critical)
- [ ] `server/security.ts:3-4`: `PRIMARY_ORIGIN` / `WWW_ORIGIN` = emmanueltarfa.com. These drive CSRF origin checks and the trusted app origin used to build every emailed link.
- [ ] `server/security.ts:6`: `*.manus.space` trusted in production
- [ ] `server/routers/registration.ts:823`: Paystack `callback_url` hard-coded to `jumpreg26-…manus.space`
- [ ] `server/ics.ts:20`: calendar UID domain `jumpreg26.manus.space`
- [ ] `server/routers/referrals.ts:15`: referral link host falls back to emmanueltarfa.com
- [ ] `shared/paymentInstructionTemplates.ts:49`: portal URL in payment emails

### 4.2 Ownership & admin governance (handover success criterion)
- [ ] `server/adminSecurity.ts:12`: `OWNER_ADMIN_EMAIL` is a personal Gmail address
- [ ] `server/db.ts:58`: Super Admin auto-granted to `OWNER_OPEN_ID` **or** that personal Gmail address
- [ ] `server/_core/trpc.ts:79`, `shared/adminPermissions.ts:45`: permissions model and copy assume Emmanuel holds Super Admin
- [ ] Copy in the admin invitation and reset emails (`server/routers/adminAccess.ts:111,205`, `client/src/pages/AdminInvitationPage.tsx:26`)

### 4.3 Email identity
- [ ] `server/email.ts:4-8`: programme mailbox, sender display name, admin mailbox and monitoring BCC are **constants**. `getJumpProgrammeSender()` deliberately **ignores** `EMAIL_FROM` unless it matches the JUMP mailbox, and `getJumpProgrammeReplyTo()` ignores `EMAIL_REPLY_TO` entirely. Setting env vars alone will not rebrand outbound mail.
- [ ] `server/_core/env.ts:11,19`: JUMP/emmanueltarfa defaults
- [ ] `server/gmail.ts:179`, `server/ics.ts:41`: reply-to and ICS organiser
- [ ] `server/workspaceMailbox.ts`: JUMP mailbox sync (inbound replies)
- [ ] `server/emailTemplates.ts` (33 JUMP refs): all participant templates, written in Emmanuel's first-person voice
- [ ] `server/participantAuth.ts:81`, `server/scheduledReminder.ts:29,119`, `server/routers/participant.ts:680`, `shared/engagementBrief.ts:154,168`: transactional email bodies

### 4.4 Payments (highest-risk item — wrong beneficiary = lost money)
- [ ] `server/paymentGuidance.ts:20-25`: six live Paystack payment-page links tied to the current merchant account
- [ ] `server/paymentGuidance.ts:59-75` and `shared/paymentInstructionTemplates.ts:24-82`: **personal bank account details** (NGN and GBP/IBAN) shown in the portal and in emails
- [ ] `shared/engagementBrief.ts:18`, `server/paymentGuidance.ts:20+`: package fees (Foundation / Engine Room / Boardroom), the 40/30/30 instalment structure, and the 10% upfront discount
- [ ] `shared/referrals.ts:4`: referral credit policy copy
- [ ] Test fixtures mirror these values (`server/paymentGuidance.test.ts`, `shared/paymentInstructionTemplates.test.ts`)

### 4.5 Programme content & brand
- [ ] `client/index.html`: page title, fonts, analytics
- [ ] UI copy: `ParticipantDashboard.tsx` (12), `Admin.tsx` (10), `Home.tsx` (9), `AdminLoginPage.tsx` (9) and 7 more components
- [ ] Facilitator identity: portrait `/manus-storage/jump-emmanuel-tarfa-portrait_*.jpeg` (`Home.tsx:187,221`, `FacilitatorVideo.tsx:15`), Instagram reel (`FacilitatorVideo.tsx:13`)
- [ ] PDF footers (`server/routers/participant.ts:885,1123`), AI persona prompt (`participant.ts:907,1023`)
- [ ] Registration source option "Emmanuel directly" (`server/diagnostic.ts:14`, `DiagnosticRegistrationDialog.tsx:23`). This is a Zod enum persisted in data, so changing it is a data-compatibility change, not just copy.
- [ ] Dates and schedule copy (for example, "opens Friday, 4 September 2026", `shared/engagementBrief.ts:127`)
- [ ] **Colours are not tokenised:** `#1F4E79` appears 305×, `#6A6760` 143×, `#E6E2D8` 102×, and so on, as literal hex in TSX. A palette swap is currently a 1,000+ line find-and-replace.
- [ ] `package.json` name `jump-2026-registration`, User-Agent strings

### 4.6 Data-model naming (leave alone in Phase 1)
- `registrations.package` enum (`Foundation`, `Engine Room`, `Boardroom`), `businessModel` and `cohortGroup` enums, and the `paymentStructure` enum are stored values. Renaming them requires a DB migration plus a data backfill. Treat them as internal identifiers and change only their **display labels**.

---

## 5. Data protection findings (action before anyone else is given repo access)

The repository is **private**. No API keys, tokens or connection strings were found in the working tree or git history ✅. However:

| # | Finding | Location | Risk |
|---|---|---|---|
| P1 | **Personal bank account details** (account numbers, sort code, IBAN) in source and tests | `server/paymentGuidance.ts`, `shared/paymentInstructionTemplates.ts` (+ tests) | Every collaborator can see them, and they persist in git history. They also bind IPF's payment flow to an individual's account. |
| P2 | **Real participant names and personal email addresses** (~15 individuals) | `todo.md`, `participant_reply_review.md`, `project_brief_delivery_roster.md`, `docs/*-review.md` (4 files), `docs/information-session-invitation-review.md`, and 3 test files (`workspaceMailbox.test.ts`, `participantPasswordAuth.test.ts`, `pathwayReconciliation.test.ts`) | Participant PII is being processed in a code repo, with no stated lawful basis for transfer to IPF (handover plan, Step 3) |
| P3 | Participant-specific operational scripts | `scripts/sendMarcelleReconciliationClarification.ts`, `scripts/sendApproved*.ts` | One-off JUMP operations. They should not be run against an IPF database. |
| P4 | Root-level operational notes (14 `.md` files: audits, email drafts, OAuth status, DNS) | repo root | Clutter plus some PII. They belong in an archive, not the product repo. |

**Recommendation:** move P2–P4 material to an IPF-controlled secure archive. Replace real addresses in tests with `@example.com` fixtures. Treat P1 as part of the payments workstream. Deleting files does **not** remove them from history. Whether to rewrite history is a separate, explicit owner decision (it is disruptive and needs a force-push).

---

## 6. Decisions required (owner: IPF Factory leadership)

| # | Decision | Blocks |
|---|---|---|
| D1 | Canonical brand name. The repo says "IPF Factory"; other IPF assets use "IP Factory". Confirm the legal entity name and the public programme name (for example, "IP Factory SME Programme"). | Phase 1D |
| D2 | Production domain and the programme mailbox (sender + reply-to) | Phase 1D, email cutover |
| D3 | Brand assets: logo, palette, typography (IP Factory palettes exist: green / navy / teal-navy / gradient) | Phase 1D (visual) |
| D4 | Facilitator model: does the experience remain personally fronted, or IPF-institutional? This drives roughly 60% of the copy. | Phase 2 copy |
| D5 | Super Admin owner(s) at IPF, and Emmanuel's role after handover | Phase 1B governance |
| D6 | IPF payment entity: bank accounts, Paystack merchant, pricing, packages, instalment policy | Payments workstream |
| D7 | Which JUMP participants transfer, and on what lawful basis | Data migration (Step 3) |
| D8 | PII clean-up approach, including whether to rewrite git history | Phase 0 |
| D9 | Stay on Manus (IPF workspace) or replatform | Infra roadmap |

---

## 7. Migration checklist (consolidated)

**Phase 0: Hygiene (no user-visible change)**
- [ ] Fix the stale DB mock in `participantPasswordFlow.test.ts`
- [ ] Gate the two live-credential tests behind opt-in env flags (matching the existing `VALIDATE_RESEND_SENDER` pattern) so `pnpm test` is green without secrets
- [ ] Add `README.md` (setup, scripts, architecture) and `.env.example` (names only)
- [ ] Relocate PII and operational notes per §5 (on D8)
- [ ] Add CI (GitHub Actions: check, test, build)

**Phase 1: Centralise, then rebrand** (see proposal below)
- [ ] 1A Brand config module, behaviour-identical
- [ ] 1B Domain/origin/owner identity → env-driven
- [ ] 1C Colour tokens, visually identical
- [ ] 1D Swap values to IPF (on D1–D3, D5)

**Phase 2: Content & programme**
- [ ] Email templates and portal copy rewritten for the IPF voice (D4)
- [ ] Programme names, schedule, packages (display labels)
- [ ] AI persona prompt and PDF footers

**Phase 3: Payments** (D6). Separate review with a two-person check on every beneficiary detail.

**Phase 4: Environment & integrations** (Step 4 of the handover plan). IPF Manus workspace, DB, Resend domain, Google Workspace OAuth, Paystack, storage, analytics.

**Phase 5: Data migration** (D7, Step 3). Selective export, file-key migration, password hashes preserved, legacy JUMP labelling.

**Phase 6: Acceptance & cutover** (Steps 6–7). Run against the existing test inventory plus a manual UAT script. Change domain only after sign-off.
