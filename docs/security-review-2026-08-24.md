# JUMP 2026 Defensive Security Review

**Date:** 24 August 2026  
**Scope:** The JUMP web application, its server routes, session controls, authorization boundaries, participant-document access, payment-state handling, response headers, and production dependencies. The review used source analysis, passive header checks, automated dependency auditing, and regression tests. It did not use disruptive scanning, brute-force attempts, or access to third-party systems.

## Confirmed findings and remediation

| Priority | Confirmed issue | Remediation applied |
|---|---|---|
| Critical | Legacy consulting endpoints accepted a caller-supplied booking token after participant authentication, creating a cross-participant access path if another token became known. | The endpoints now use only the authenticated participant record and no longer accept or query by an input token. |
| Critical | The public Paystack verification route could mark a deposit as paid when the server key was absent or a simulated reference was supplied. | Simulation can no longer update payment state. Live verification now requires a configured secret, a matching registration, provider metadata, and the server-calculated commitment amount. |
| High | The storage gateway could issue a signed download URL for known participant-upload paths without checking the requester. | Assignment and receipt prefixes now require the matching participant session or a verified administrator session. Paths are normalised and traversal-like keys are rejected. |
| High | Password-reset and administrator-invitation links were built from the request host. | Sensitive links now use the trusted JUMP application origin rather than request-controlled host data. |
| Medium | Participant cookies were cross-site capable and state-changing browser requests had no origin gate. | Participant sessions now use `SameSite=Lax`; unsafe JUMP browser API requests require a trusted origin while authenticated scheduled callbacks remain separately protected. |
| Medium | The scheduled reminder callback returned internal error details and stack traces. | Client responses are now generic; diagnostic detail remains in server logs only. |
| Medium | Public portal-link requests disclosed whether an email was eligible and could be repeatedly triggered. | Responses are now generic and requests are rate-limited per caller and email. |
| Defence in depth | The application exposed Express identification and omitted several browser hardening headers. | Express identification is disabled; anti-framing, MIME-sniffing, referrer, permissions, resource-policy, cache-control, and production CSP controls are applied. |
| Supply chain | The production dependency audit reported known vulnerable packages, including the Express route matcher. | Dependencies were updated, Express was migrated to v5-compatible routing, and a final production audit reported no known vulnerabilities. |

## Validation

The final validation completed successfully: 44 test files passed, one credential-probe file was skipped, and 124 tests passed with two skipped. TypeScript and the production build completed successfully. Local header inspection confirmed the new defensive response headers, and visual smoke checks confirmed that both the public landing page and the protected administrator gate still render correctly.

## Residual operating controls

This review does not replace infrastructure monitoring, Google Workspace account security, payment-provider controls, routine dependency updates, or an independent external penetration test. The JUMP mailbox OAuth connection remains intentionally deferred until it can be completed safely from a desktop browser; no mailbox content is retrieved until that connection is authorised.
