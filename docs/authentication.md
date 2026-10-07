# Authentication architecture

Three questions, kept separate everywhere in the code:

| Question | Answered by | Where |
|---|---|---|
| Who is this person? (authentication) | a universal **user** + session | `users`, `user_credentials`, `user_sessions`, `server/accountAuth.ts` |
| What may they do? (authorisation) | platform roles and permissions (later phases) | today: legacy `users.role` and admin permission profiles |
| Which business may they act inside? | **business membership** | `business_memberships`, `requireBusinessMembership` |

```
User  ->  business_memberships (owner | business_admin | member)  ->  Business  ->  Engagement (later)
```

## How a client account is created (invitation only)

Client accounts follow the client journey in the concept note (v0.8.1), not public registration:

```
Free Business Check (public, creates no account) -> discovery call -> fit -> payment -> onboarding invitation
   -> client opens /onboarding/<token> -> user + credential + business + owner membership + session -> /dashboard
```

- **There is no public sign-up.** The `account` router has no sign-up procedure, `/signup` redirects to `/login`, and the
  only mutation that creates a user is `onboarding.accept`, which requires a valid invitation token (server-enforced).
- **Invitation** (`client_onboarding_invitations`, `server/clientOnboarding.ts`): created by an authorised IPF administrator
  (`onboarding.invite`, permission `manage_client_onboarding`; the Super Admin always has it) from an existing
  `business_checks` row, which supplies the email, name and business name. 256-bit random token, only its SHA-256 stored,
  single use, expires after 7 days, revocable, bound to the business check's email. Issuing a new link revokes the previous
  one (the database allows one pending link per business check). Who issued it is recorded in the admin audit log.
- **Delivery** never blocks: the link is emailed (not BCC'd anywhere) and also returned once to the administrator, who can copy
  it when email is unavailable. The token is never stored, logged or put in the audit log.
- **Acceptance** is one transaction: validate the invitation, bind the email, refuse existing/reserved identities, create user,
  credential, business, owner membership and session, then claim the invitation with a conditional update (so two simultaneous
  acceptances cannot both win). Any failure rolls everything back and leaves the invitation usable.
- **Businesses are created only at acceptance.** A business check is a prospect: it is not a user and not a business.
  `onboarding.metrics` reports business checks, portal users, businesses and memberships as separate numbers.
- Sign-in, sessions, sign-out and business isolation are unchanged from Phase 1 (below).

### Deferred (deliberately not built)

- **Fit and payment enforcement.** There is no canonical persisted "discovery call = fit" or "payment confirmed" field yet,
  and none was invented. Until they exist the control is that only an authorised administrator can invite, and the admin
  screen says to invite only a client who has had the call, is a fit and has paid. When those fields exist, `createOnboardingInvitation`
  must refuse a business check that has not reached onboarding.
- **Existing-account linking.** If the invited email already belongs to a user (a legacy OAuth user, an earlier client, an
  administrator) the invitation is refused at creation, and acceptance returns a controlled conflict. Identities are never
  merged, credentials never overwritten and a new business is never attached to an existing account automatically. Safe
  linking (proving control of the account) is a later phase together with team invitations.

## Account sign-in (Phase 1, unchanged)

- **Sign-in / sign-out** (`account.signIn`, `account.signOut`), **session** (`account.me`, `account.workspace`).
- **Sessions**: random 256-bit token in an `ipf_session` cookie (HttpOnly, SameSite=Lax, Secure over HTTPS and always in
  production, 14 days). Only the SHA-256 of the token is stored. Sign-out revokes the row. Nothing is kept in localStorage.
- **Passwords**: scrypt (the format used for administrator passwords), 10 to 128 characters with a letter and a number.
  Five wrong passwords lock the credential for 15 minutes; wrong email, wrong password and suspended account all return the
  same message, and an unknown email costs the same time as a wrong password.
- **Isolation**: a business id from the client is never trusted. `requireBusinessMembership` checks it against the caller's
  active memberships; a business that does not exist and one the caller cannot access give the same answer.
- **Email verification is deferred.** There is no verified flag and no email is sent for sign-in.
- Screens: `/login`, `/onboarding/:token` (invitation only), `/dashboard` (server-checked; anonymous visitors go to `/login`).

## Identity table notes

- `users` is the one human identity. Its `openId` is the external-identity key: password accounts get `local:<uuid>`.
  `name` is the full name and `lastSignedIn` the last sign-in time (kept, not renamed, so legacy code is unaffected).
- Email is unique case-insensitively (`users_email_lower_unique`). New accounts store it lower-cased.
- Onboarding refuses the owner administrator's email and any email with a pending administrator invitation, so an account cannot
  be registered ahead of a legitimate administrator.
- `users.role` (`user` | `admin`) is the **legacy** gate for the existing admin area. It is not a business role and not the
  future platform-role system. New accounts are always `user`, and an account session never grants admin access
  (`adminProcedure` still requires the legacy session plus the administrator password).

## Phase 2: workspaces, roles and permissions

Four separate things, never mixed:

| Concept | Question | Where |
|---|---|---|
| User | Who is this person? | `users`, `user_credentials`, `user_sessions` |
| Business membership | Which business may they act inside, and as what? | `business_memberships` (`owner`, `business_admin`, `member`), `shared/businessCapabilities.ts` |
| Platform role | What responsibility do they have inside IPF? | `user_platform_roles` (`super_admin`, `admin`, `desk_lead`, `analyst`, `partner`, `subject_matter_expert`, `finance`) |
| Permission | What may that responsibility do? | `shared/platformPermissions.ts` (code-defined matrix) |

A business owner is not an IPF administrator, and an IPF administrator is not a member of a client business. Internal staff
may have platform roles and **no** memberships (no fake "IPF business" is ever created for them).

**The canonical context.** `account.me` / `account.workspace` return one safe object: `user`, `platformRoles`, `permissions`,
`memberships`, `activeBusiness`, `landingPath`. It never contains hashes, tokens or credential internals. The authenticated UI
uses only this.

**Active workspace.** Stored server-side on the session (`user_sessions.activeBusinessId`), never in the browser. One
membership selects itself and shows no switcher; two or more show a switcher and the stored choice (or the first) is active.
`account.switchWorkspace` verifies the id against an active membership, reuses the same session and is audited. A stored
choice is re-checked on every request, so ending a membership (or deleting the business) invalidates it immediately. A new
sign-in restores the last workspace the person still belongs to. Zero memberships is a valid state.

**Business access boundary** (`server/accountAuth.ts`): `requireBusinessMembership`, `requireBusinessCapability`,
`requireActiveBusiness`, `requirePlatformPermission`, and the procedures `accountProcedure` / `platformPermissionProcedure`.
A business id sent by a client is never proof of access; a business that does not exist and one the caller cannot see give
the same `FORBIDDEN` answer. Business roles are checked through capabilities (`canEditBusiness(role)` ...), never by comparing
role names in routers. Owners and business admins edit the profile; members view. Internal staff have no automatic access to a
client's business (future, explicit staff permissions will cover that).

**Permission resolution: one rule, one function.** `resolveAuthority` (pure) is called by `loadAuthority` for BOTH channels: the
legacy administrator channel (OAuth + administrator password, via `adminPermissionProcedure`) and the account channel
(`platformPermissionProcedure`), so one person always gets one answer. A permission is granted if **any** source grants it:

1. **Super Admin bridge**: the recognised owner email, or a stored `super_admin` role, holds everything.
2. **Platform roles**: the matrix. `users.role = 'admin'` counts as the `admin` role, which grants nothing by itself.
3. **Legacy admin profile** (`admin_permission_profiles`): mapped to platform permissions where an equivalent exists
   (`manage_payments`, `manage_scheduling`, `manage_client_onboarding`), and the platform permission grants the legacy
   capability back (`manage_communications` grants `view_communications`). Legacy participant capabilities with no equivalent
   (participant review, documents, portal access) stay governed by the legacy profile and the Super Admin.

There is no "deny", so sources can only add authority and can never contradict each other. A disabled or suspended person has
none. `admin_permission_profiles`, `admin_access_sessions` and `users.role` are **not** removed.

**Legacy `users.role` migration path.** Today `users.role = 'admin'` still gates entry to the admin area (together with the
administrator password session). Long term: assign real roles in `user_platform_roles`, move each admin gate onto
`adminPermissionProcedure` / `platformPermissionProcedure`, stop reading `users.role`, then drop it in a later migration.
Staff do not yet have a unified email/password sign-in into the admin area: the internal landing (`/admin`) uses the existing
admin sign-in.

**Super Admin safeguards** (`server/platformAccess.ts`): only a Super Admin grants or revokes `super_admin`; nobody but a Super
Admin changes their own roles; the last Super Admin (counting the owner bridge) cannot be removed; the owner-email Super Admin
cannot be revoked through roles or demoted through the legacy `setUserRole`; only an active person can receive a role; a
business owner never receives any platform role. Role assignment is the `platformRoles` router (`manage_roles`), with no UI yet.

**Settings.** `/settings/business` edits name, description, year founded, sector and website (owners and business admins; members
see it read-only). Staff band, revenue band, country and state are supported by the API and left out of the form. Completion is
derived from the filled fields (name, description, year, sector, website), never stored; the logo joins that list when upload
exists. **Logo upload is deferred**: storage is still the legacy Manus proxy, so `logoUrl` stays null and a placeholder is shown.
`/settings/account` changes the person's own name and password. Email is the identity key and cannot be changed. Changing the
password verifies the current one (wrong guesses share the sign-in lockout), rehashes, and signs out every other session.

**Audit** (`admin_access_audit_events`): sign-in, failed sign-in (existing accounts only, so an unknown address cannot flood the
log), lockout, sign-out, workspace switch, business and account profile updates, password change, platform role grant and
revoke. Details hold identifiers and field names only, never secrets or values.

**Admin counts** (`onboarding.metrics`): business checks, users, portal users (can sign in with a password), businesses,
memberships and platform role assignments are separate numbers, never derived from one another.

**Deferred:** team invitations, member management, ownership transfer, second-business creation, engagement assignments, logo
upload, email change, password-reset email, a role-management UI, and a unified staff sign-in.

## Legacy authentication that remains (unchanged in Phase 1)

| System | Identity | Used for |
|---|---|---|
| Platform OAuth (`auth.*`, `app_session_id`) | `users` row by `openId` | owner/administrator sign-in |
| Administrator password (`adminAccess.*`, `jump_admin_access`) | `admin_credentials`, `admin_access_sessions` | second factor for the admin area |
| Participant portal (`participant.*`, `jump_participant_session`) | `registrations` + `participant_credentials` | programme participants |

## Path to platform roles (not built yet)

Add a `platform_role_assignments` table (`userId`, role from `PLATFORM_ROLES` in `shared/auth.ts`, optional scope), then
migrate admin checks from `users.role = 'admin'` to permissions derived from those assignments. Internal people reach
clients through `engagement_assignments` (engagement x user x role). Business membership roles never become platform roles.
Each legacy system above can then be folded into the universal account one at a time.
