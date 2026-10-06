# Custom-domain verification — 20 August 2026

## Result

The public JUMP 2026 platform is live on both custom-domain variants:

| Address | Observed behaviour | Result |
|---|---|---|
| `https://emmanueltarfa.com` | HTTPS returned `200 OK` and rendered the JUMP 2026 Strategy & Innovation Genius Track landing page | Live |
| `https://www.emmanueltarfa.com` | HTTPS returned `301` to `https://emmanueltarfa.com/`, which returned `200 OK` and rendered the JUMP platform | Live canonical redirect |

The root domain currently resolves to `104.18.26.246` and `104.18.27.246`, matching the Manus domain-routing addresses displayed in the platform configuration. The `www` host resolves through the managed edge and redirects safely to the root domain.

## Interpretation of the configuration panel

The green platform notice stating that the domain is connected and live matches the observed public result. The yellow “Waiting for DNS” label in the still-open configuration panel is therefore a stale or delayed panel status, not an outage. No further DNS record should be added, removed, or duplicated for the website at this time.

The existing email authentication records should remain untouched. Website routing and email records serve different purposes; altering email-related DNS would risk Resend or Google Workspace delivery without improving the already-working website.
