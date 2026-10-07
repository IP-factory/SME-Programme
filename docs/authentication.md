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

## Phase 1 (this repository)

- **Signup** (`account.signUp`): full name, email, password, confirm password, business name. One database transaction creates the
  user, the credential, the business, the `owner` membership and the first session; any failure rolls all of it back.
- **Sign-in / sign-out** (`account.signIn`, `account.signOut`), **session** (`account.me`, `account.workspace`).
- **Sessions**: random 256-bit token in an `ipf_session` cookie (HttpOnly, SameSite=Lax, Secure over HTTPS and always in
  production, 14 days). Only the SHA-256 of the token is stored. Sign-out revokes the row. Nothing is kept in localStorage.
- **Passwords**: scrypt (the format used for administrator passwords), 10 to 128 characters with a letter and a number.
  Five wrong passwords lock the credential for 15 minutes; wrong email, wrong password and suspended account all return the
  same message, and an unknown email costs the same time as a wrong password.
- **Isolation**: a business id from the client is never trusted. `requireBusinessMembership` checks it against the caller's
  active memberships; a business that does not exist and one the caller cannot access give the same answer.
- **Email verification is deferred.** There is no verified flag and no email is sent. Signup and sign-in work without it.
- Screens: `/signup`, `/login`, `/dashboard` (server-checked; anonymous visitors are sent to `/login`).

## Identity table notes

- `users` is the one human identity. Its `openId` is the external-identity key: password accounts get `local:<uuid>`.
  `name` is the full name and `lastSignedIn` the last sign-in time (kept, not renamed, so legacy code is unaffected).
- Email is unique case-insensitively (`users_email_lower_unique`). New accounts store it lower-cased.
- Signup refuses the owner administrator's email and any email with a pending administrator invitation, so an account cannot
  be registered ahead of a legitimate administrator.
- `users.role` (`user` | `admin`) is the **legacy** gate for the existing admin area. It is not a business role and not the
  future platform-role system. New accounts are always `user`, and an account session never grants admin access
  (`adminProcedure` still requires the legacy session plus the administrator password).

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
