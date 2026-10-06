# Google Calendar OAuth Remediation Audit

**Checked:** 20 August 2026

The JUMP 2026 Communications OAuth project is accessible at <https://console.cloud.google.com/auth/scopes?project=jump-2026-communications>. Its Google Auth Platform **Data access** screen currently shows no configured non-sensitive, sensitive, or restricted scopes.

The connected Emmanuel Tarfa Google Calendar integration can read the primary calendar, while the JUMP application’s server-side Calendar API request receives a 403 response. The missing Google Calendar OAuth scope is therefore the immediate blocker to safe participant booking and automatic Google Calendar invitations.

The remediation requires adding an appropriate Google Calendar scope to the JUMP OAuth client, saving the change, and refreshing the server-held consent token before opening public booking access.

On 20 August 2026, the proposed minimum scopes were staged through the Data Access selector:

- `https://www.googleapis.com/auth/calendar.events`
- `https://www.googleapis.com/auth/calendar.events.freebusy`

The Google Calendar API has since been confirmed **enabled** for the **JUMP 2026 Communications** project. The Data Access selector exposed both required Calendar scope rows directly. The earlier selector submission did not persist the rows into the page-level scope list. On re-opening the selector, the `calendar.events` row is confirmed selected; the `calendar.events.freebusy` row remains to be selected, after which the selector-level **Update** and page-level **Save** will be re-applied under the owner’s confirmation.
