# JUMP Mailbox Transition Plan

**Decision recorded:** Participant-facing programme correspondence will use `jump@emmanueltarfa.com`. Emmanuel’s personal Gmail remains preserved as the historical source record during transition. `admin@emmanueltarfa.com` is reserved for Emmanuel’s professional administration correspondence.

## Recommended operating model

`jump@emmanueltarfa.com` should be provisioned as a real Google Workspace mailbox, rather than only a delivery-sender identity. This allows participant replies to arrive in a manageable JUMP inbox, supports labels, search, delegation, calendar ownership, and future staff handover.

| Stream | Destination | Handling principle |
|---|---|---|
| New JUMP participant replies | `jump@emmanueltarfa.com` | Use as the Reply-To address in all participant communications. |
| Historic JUMP conversations | JUMP mailbox | Copy them through Google Workspace Data Migration; preserve the original personal-Gmail messages. |
| Emmanuel’s personal correspondence | `emmanueltarfa@gmail.com` | Remains separate and unchanged. |
| Professional administration | `admin@emmanueltarfa.com` | Separate professional route, not the participant programme sender. |

## Administrator actions

1. In Google Admin Console, create a dedicated Workspace user for `jump@emmanueltarfa.com`, or confirm that this address is already a mailbox rather than only an alias or an outbound sender identity.
2. Sign in to that JUMP mailbox once and confirm that it can receive an external test email.
3. Keep the platform setting `EMAIL_FROM` as `Emmanuel Tarfa <jump@emmanueltarfa.com>` and `EMAIL_REPLY_TO` as `jump@emmanueltarfa.com`.
4. Use **Data Migration** to copy historic JUMP emails from the personal Gmail account into the JUMP mailbox. Restrict scope using JUMP-related labels, participant addresses, and/or date ranges. Do not delete messages from the personal Gmail source.
5. After the historic copy is complete, create a personal-Gmail forwarding or Workspace routing rule for *future incoming JUMP replies* only. Preserve the original recipient and source mailbox while the route is being verified.
6. Apply a `JUMP / Historical` label in the new mailbox for migrated messages and a `JUMP / Live` label for new replies, so the records stay traceable.

## Safety controls

* Do not delete, archive away, or move source messages from Emmanuel’s private Gmail during migration.
* Do not create a blanket forward of all private Gmail. Limit forwarding to JUMP participant correspondence only.
* Test with one controlled participant thread before enabling the wider rule.
* Keep the existing platform email history as the authoritative delivery audit for automated programme mail.

## Official sources

Google explains that an email alias routes mail into one user’s primary inbox, while a dedicated user mailbox is more appropriate where a separate working inbox is needed. Google also notes that messages can be sent from an alias only after the user configures the alias as a custom From address. [Google Workspace: alternate email aliases](https://knowledge.workspace.google.com/admin/users/add-or-delete-an-alternate-email-address-email-alias)

For future routing, Google Workspace administrators can use recipient-address maps to forward incoming mail and retain original-recipient information; the rule can keep delivery to the original recipient during transition. [Google Workspace: redirect or forward Gmail messages](https://knowledge.workspace.google.com/admin/gmail/advanced/redirect-or-forward-gmail-messages-to-another-user)

For history, Google’s Data Migration service is designed to copy mail into a Workspace Gmail account without requiring a manual message-by-message forward. [Google Workspace: migrate to Gmail](https://workspace.google.com/solutions/migration/gmail-migration/)
