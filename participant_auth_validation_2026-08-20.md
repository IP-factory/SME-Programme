# Participant authentication validation — 20 August 2026

## Verified security behaviour

| Scenario | Validation | Result |
|---|---|---|
| Unknown email address | Direct authentication request returned a rejection before any email was dispatched | Access denied |
| No participant session | Scheduling procedures returned HTTP `401 Unauthorized` and no session availability data was returned | Access denied |
| Invalid, expired, or reused magic link | Browser verification rendered the “Unable to sign you in” screen and instructed the visitor to request a new link | Access denied |
| Registered participant | The system creates a random one-time confirmation link, stores only its hash, limits it to 30 minutes, and issues a separate 14-day HttpOnly browser session only after successful confirmation | Secure sign-in path implemented |

## Delivery controls

The public page now reports that a confirmation email was sent only after the delivery helper returns success. Participant sign-in messages are delivered through the established Gmail-first delivery service with Resend available as the fallback; no booking token is placed in a public portal URL.

## Important data note

The `emmanueltarfa@icloud.com` address shown in the reported screen exists as an earlier controlled registration record, which explains why the old lookup recognised it. No registration was deleted during this correction. The new experience does not grant portal access merely because an address is entered: it requires the recipient to open the one-time confirmation link delivered to that same email address.
