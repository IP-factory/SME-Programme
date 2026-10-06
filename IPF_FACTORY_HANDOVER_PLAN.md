# IPF Factory — JUMP Platform Transfer & Repurposing Plan

**Prepared:** 6 October 2026  
**Purpose:** Transfer the existing JUMP registration and executive-programme platform into IPF Factory ownership without rebuilding the platform from scratch.

---

## Executive Summary

The existing JUMP platform can be repurposed for IPF Factory. The recommended approach is a controlled migration: preserve the current JUMP platform while creating an IPF-owned project, transfer the reusable code and data assets, reconnect IPF-owned services, rebrand the experience, test it fully, and only then switch the public domain or launch the new IPF version.

The codebase is the primary reusable asset, but a complete transfer also requires the database, uploaded files, environment configuration, connected services, domain settings, and operational documentation.

---

## Seven-Step Migration Route

### 1. Establish the new IPF Factory Manus workspace

- Create or confirm the new IPF Factory Manus account and workspace.
- Confirm who will own and administer the new project.
- Decide the new project name and primary IPF-owned domain.
- Keep the current JUMP project and live website unchanged during preparation.
- Do not delete, rename, or disconnect the current project yet.

**Output:** An IPF-owned Manus workspace ready to receive the migrated platform.

---

### 2. Package the existing JUMP platform

Prepare a complete handover package containing:

- Frontend source code.
- Backend source code and API procedures.
- Database schema and migration files.
- Authentication and participant-access logic.
- Admin dashboard and programme-management features.
- Payment guidance, payment records, receipts, and portal logic.
- Email templates and delivery logic.
- Automated tests and build configuration.
- Logos, images, documents, and other stored assets.
- Existing project documentation and deployment notes.

**Important:** The codebase alone is not the complete live platform. The database, stored files, secrets, and integrations must be migrated or recreated separately.

**Output:** A versioned, documented platform archive suitable for migration into IPF Factory’s project.

---

### 3. Migrate the database and stored assets

- Export the relevant JUMP database records.
- Identify which participants/customers are being transferred to IPF Factory.
- Preserve appropriate registration, pathway, payment, receipt, and portal records.
- Copy or reconnect uploaded receipts, documents, images, and other stored files.
- Preserve password security correctly; do not expose or manually copy plaintext passwords.
- Decide how legacy JUMP records will be labelled or retained for audit purposes.
- Confirm the lawful basis and internal approval for transferring participant data to IPF Factory.

**Output:** An IPF-accessible database and asset store containing the approved participant and programme records.

---

### 4. Recreate IPF-owned integrations and configuration

Set up and verify IPF-owned versions of:

- Manus project settings and deployment configuration.
- Domain and DNS configuration.
- Email sender and reply-to addresses.
- Resend or other email-delivery credentials.
- Gmail or Google Workspace mailbox, if required.
- Payment provider accounts and payment links.
- File storage and asset references.
- OAuth or authentication configuration.
- Calendar and meeting links.
- Application secrets and environment variables.
- Webhooks, notifications, and any external API connections.

**Security rule:** Secrets should be recreated under IPF ownership rather than copied into messages or shared informally.

**Output:** A functioning IPF configuration with services owned or controlled by IPF Factory.

---

### 5. Rebrand and repurpose the platform

Update the platform to reflect IPF Factory’s ownership and Nigerian entrepreneur focus:

- Replace JUMP branding with the approved IPF Factory programme name.
- Update logo, colours, typography, and visual identity.
- Rewrite landing-page and portal copy.
- Update programme names, pathways, schedules, and participant guidance.
- Replace Emmanuel-specific references with IPF Factory references where appropriate.
- Update sender names, email signatures, contact details, and legal notices.
- Update payment instructions and receipts to the correct IPF entity.
- Decide which original JUMP customers are invited or migrated.
- Preserve historical JUMP references only where needed for participant clarity or records.

**Output:** An IPF Factory-branded platform using the existing tested functionality.

---

### 6. Test and approve the new IPF platform

Run acceptance testing in the new project before any public cutover:

- Public landing page and registration flow.
- Participant email/password sign-in.
- Password setup and password reset.
- Trusted-session and lockout behaviour.
- Participant portal access and pathway visibility.
- Assessment and engagement-brief flows.
- Payment guidance and payment links.
- Receipt upload, receipt display, and receipt download.
- Admin login and participant-management functions.
- Email delivery through the IPF sender.
- Resend or fallback email behaviour.
- Database records and migrated assets.
- Mobile and desktop responsiveness.
- Production build and deployment health.
- Domain, SSL, redirects, and public links.

Obtain internal approval from IPF Factory before launch.

**Output:** A signed-off IPF version with a written test record and known-issues list.

---

### 7. Perform the controlled launch and handover

- Create a final backup of the original JUMP project and database.
- Freeze changes to the old JUMP version during the cutover window.
- Deploy the approved IPF version.
- Connect the IPF-owned domain.
- Redirect or retire old links only after confirming the new site is stable.
- Notify transferred participants with clear instructions and the new sender identity.
- Monitor sign-ins, password resets, registrations, emails, and payment activity after launch.
- Keep the original JUMP project available as a read-only archive for an agreed period.
- Deliver the final administration guide to IPF Factory.

**Output:** IPF Factory operates the programme on the migrated platform, with the original JUMP version safely archived.

---

## What Transfers and What Must Be Recreated

| Item | Transfer or recreate? | Notes |
|---|---|---|
| Application source code | Transfer | Main reusable asset; avoids rebuilding from scratch. |
| Database schema | Transfer | Needed to recreate the data model. |
| Participant and programme data | Migrate selectively | Requires approval on which customers move to IPF. |
| Uploaded files and receipts | Migrate or reconnect | Storage references must remain valid. |
| Passwords | Do not expose or copy manually | Preserve secure hashes/sessions or require controlled reset. |
| Environment secrets | Recreate under IPF ownership | Do not share secrets in email or documents. |
| Gmail/Resend accounts | Reconnect or recreate | Use IPF-controlled sender identities. |
| Payment accounts and links | Reconnect or recreate | Payment ownership and beneficiary details must be correct. |
| Domain | Transfer or repoint | Perform only after testing the IPF version. |
| Manus credits | Confirm separately with Manus | Do not assume credits transfer between accounts. |
| Documentation | Transfer and update | Required for long-term IPF administration. |

---

## Recommended Ownership Model

IPF Factory should own or control:

- The Manus account and workspace.
- The project and deployment settings.
- The production domain.
- Email and email-delivery accounts.
- Payment-provider accounts.
- File storage and application secrets.
- Participant-data governance and access permissions.
- The final code repository or project archive.

Emmanuel’s personal account should not remain the sole point of control for the production system after handover.

---

## Decisions Required Before Migration Begins

1. What is the approved IPF Factory programme name?
2. Which domain will be used for the new platform?
3. Which JUMP participants/customers are being transferred?
4. Will the old JUMP platform remain available as an archive?
5. What IPF mailbox will send participant communications?
6. Which payment methods and beneficiary accounts will be active?
7. Who at IPF Factory will be the technical and administrative owner?
8. What launch date is required?

---

## Success Criteria

The migration is complete when:

- The IPF Factory project runs independently of Emmanuel’s personal production account.
- Approved participant records and files are available and accurate.
- Participants can sign in and access the correct portal experience.
- IPF emails, payment routes, receipts, and support contacts are correct.
- Admin staff can operate the platform without relying on the original JUMP project.
- The new IPF site has passed acceptance testing.
- The original JUMP system has been backed up and safely archived.

---

## Immediate Next Action

Create the new IPF Factory Manus workspace and confirm the eight pre-migration decisions above. Once those are available, begin with Step 2: packaging the current JUMP platform for controlled transfer.
