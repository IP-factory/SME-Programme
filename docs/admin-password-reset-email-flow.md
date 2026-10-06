# Administrator Password Reset — Email-Confirmed Flow

## Correction

The prior recovery control accepted a new administrator password immediately after the administrator’s Gmail identity was recognised in the browser. This is being replaced because Emmanuel expects a password-reset email before any password change can occur.

## Required flow

An authorised administrator first requests a reset from the private sign-in experience. The server creates a random, hashed, single-use reset token with a short expiry and sends the link only to that recognised administrator email. The reset link opens a dedicated reset screen; possession of the valid, unexpired token is required before a new password can be submitted.

On successful reset, the server revokes active administrator sessions, records an access audit event without storing the raw token, consumes the token, and requires a normal Gmail-plus-new-password sign-in afterwards. Reset emails must not be blind-copied because a copied reset URL would be a security credential.
