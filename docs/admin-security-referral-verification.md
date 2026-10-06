# Admin Security and Referral Verification

Date: 21 August 2026

## Scope

The administrative access and participant referral changes were checked after a fresh development-server restart.

| Check | Result |
|---|---|
| Full regression suite | 78 passed; 2 credential-dependent checks skipped |
| Production build | Passed |
| `/admin` without an active JUMP password session | Correctly stops at the secure-verification gate |
| `/admin/login` desktop | Correctly presents the password-enrolment screen only after the existing verified Google identity is recognised |
| `/admin/login` mobile | Password-enrolment form remains single-column, visible, and usable at 375 px width |
| Referral-aware public entry | `ref` query parameter leaves the public page accessible; the code is captured only when the person chooses to submit an application |

## Security and operational conclusions

Administrator access now requires the verified Google identity plus an individual JUMP password, while server-side procedures retain role enforcement. Participant referral links create no automatic discount. A referral becomes eligible only after the referred registration is accepted and its first commitment is marked paid; Emmanuel then manually approves any credit.

## Final verification update

| Check | Result |
|---|---|
| `/admin` desktop | The owner console stops at a concise secure-verification gate until the Gmail identity and JUMP password are both verified. |
| `/admin/login` desktop | The recognised owner sees the clear two-step password-enrolment form, with confirmation and a 12-character minimum. |
| `/?ref=preview-referral-code` desktop | The public page remains polished and accessible; a referral parameter does not expose private participant or administrator information. |
| Reversible application archive | The owner-only action retains the registration record, diagnostic and email history, marks the record rejected, and removes it from the active owner desk. |
| Final validation | 80 tests passed, 2 credential-dependent checks skipped; the production build passed. |
