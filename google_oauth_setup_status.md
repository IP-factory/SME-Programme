# Google OAuth Background Email Setup Status

## Verified state — 19 August 2026

The owner approved creation of a dedicated Google Cloud project for durable JUMP background email delivery. The project was successfully created and selected in Google Cloud Console:

| Item | Value |
| --- | --- |
| Google Cloud project | `JUMP 2026 Communications` |
| Project identifier | `jump-2026-communications` |
| Google account used | `emmanueltarfa@gmail.com` |
| Purpose | Obtain a dedicated OAuth client and refresh token for server-side Gmail sends and scheduled JUMP reminders |

The Google Auth Platform consent configuration was created under the application name **JUMP 2026 Communications**. It uses an **External** audience, with `emmanueltarfa@gmail.com` as both the user-support and developer-contact email.

The required APIs are enabled for the new project:

- **Gmail API** (`gmail.googleapis.com`)
- **Google Calendar API** (`calendar-json.googleapis.com`)

## Created OAuth client — 19 August 2026

A Web application OAuth client named **JUMP Background Gmail & Calendar** has been created and is enabled. Its authorised redirect URI is Google OAuth Playground, used solely for the one-time offline authorisation flow. The client identifier and secret were intentionally not recorded in this file or in source control; they must be held only in the project secret manager.

## Secure credentials and validation — 19 August 2026

The one-time owner consent completed with only the approved scopes:

- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/calendar.events`

The OAuth client ID, client secret, and refresh token are now stored only in the JUMP project secret manager. They have not been recorded in source control, this status file, or the platform audit. A non-delivery Vitest OAuth refresh check completed successfully, confirming that the configured credentials can obtain an access token with exactly those two scopes. The check created no email and no calendar event.

## Notes

The initial browser session reset while configuring the consent form, but the configuration was subsequently completed. The client was created from the selected project interface: **Google Auth Platform → Clients → Create OAuth client**.

`emmanueltarfa@gmail.com` was added and saved as the sole authorised test user for this External OAuth application while it remains in testing.

Google exposed the newly generated replacement client secret once in the authenticated client page. Its value has not been written to a project file, source control, or audit record. It was used only for the authorised token exchange and then placed in the project secret manager.

## Important limitation while the Google app remains in Testing

Google issued the refresh token with a seven-day testing expiry. The application can use it for approved JUMP Gmail sends and Calendar events during that period, but it is **not yet permanent**. To avoid periodic re-authorisation, the Google OAuth application must be moved from **Testing** to **In production** and any Google verification or public-policy requirements shown by the Google Auth Platform must be completed. This is a separate owner-controlled publishing action.
