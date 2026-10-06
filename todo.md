# Project TODO

## Participant Communications — 19 August 2026

- [x] Review new participant replies in the owner's Gmail and group them by response need (five actionable replies identified)
- [x] Prepare thoughtful individual replies for owner approval; do not send without approval (five thread-specific drafts prepared)
- [x] Draft the same-day participant project-brief email and propose an individual-send delivery method (15-recipient roster prepared)
- [x] Obtain owner approval for the project-brief content, consolidated recipient roster, and individual-send delivery method (superseded by the later owner-approved Engagement Brief and permanent-portal invitation rollout)
- [x] After owner approval, send the approved project-brief test copy and record the final participant delivery plan (superseded by the verified Enzo previews and completed individual Engagement Brief delivery plan)
- [x] Compose each participant response and project-brief email in the owner's Gmail one at a time for explicit approval before sending (superseded by the owner-approved individual invitation and response workflow)
- [x] Send and verify an Enzo Krypton-only test copy before composing or sending the first participant reply
- [x] Reply to Owoyemi within the existing Gmail thread using the owner’s established salutation and Enzo Bcc (the original thread used “Owoyemi,” so that form was retained)
- [x] For each remaining participant, obtain owner approval of the final email body before direct sending in the existing Gmail thread (completed or superseded by later owner-approved individual communications)
- [x] Prepare the remaining participant replies for one batch owner approval, with Enzo Bcc and existing-thread delivery retained (completed or superseded by later approved communications)
- [x] After batch approval, send each approved reply privately in rapid sequence and record its outcome (completed or superseded by verified later communications)
- [x] Revise Elizabeth's reply to explain the session recording, private individual session, shared calendar and catch-up access without discouraging her travel (completed on 19 August; the later pathway policy correctly distinguishes Foundation’s shared group model)
- [x] Dispatch the owner-approved Fimidara, Marcelle, and Priscilla replies in their existing threads with Enzo Bcc (all three sent successfully on 19 August 2026)
- [x] Send Elizabeth's owner-approved revised reply in her existing Gmail thread with Enzo Bcc (message ID: 1a01c4bb7a61502c)

- [x] Build a single-scroll public JUMP 2026 programme page with no multi-page navigation
- [x] Add editorial visual system: cream background, high-contrast typography, oversized Didone-style serif headline, light serif subheads, geometric rules, spaced sans-serif metadata, asymmetrical layout, generous negative space, responsive behavior, and accessible contrast
- [x] Add programme overview content from the brochure, including Learn / Apply / Decide structure, five-class progression, session format, textbook, Engine Room grouping logic, and facilitator bio
- [x] Display the three packages with exact labels and prices: Foundation ₦575,000, Engine Room ₦875,000, Boardroom ₦1,500,000
- [x] Display the Boardroom notice that the package is capped at 8 places
- [x] Implement a public registration form with full name, email address, phone number, business name, business description, exact business model options Maker / Trader / Expert, exact package options, and pre-submission question
- [x] Enforce Boardroom capacity at 8 accepted registration slots and automatically surface a waitlist option when capacity is reached
- [x] Store registrations in the database with timestamps, package, business model, status, payment milestones, cohort assignment, and email history
- [x] Add a clear payment instructions section for offline bank transfer after registration
- [x] Build an authenticated owner dashboard using the provided dashboard layout component
- [x] Allow the owner to view all registrations and filter by package
- [x] Allow the owner to review complete applicant details and pre-submission questions
- [x] Allow the owner to update applicant status using exact labels Pending / Accepted / Rejected / Waitlisted
- [x] Add manual payment tracking using exact labels deposit paid, instalment 1, instalment 2
- [x] Add cohort assignment view for accepted applicants grouped into Makers, Traders, and Experts
- [x] Add personalised email composer for one applicant
- [x] Add bulk email composer for selected applicants with preview and send confirmation
- [x] Record outbound email history and delivery intent per applicant
- [x] Keep applicant data private and restrict dashboard procedures to admin users
- [x] Add backend validation and duplicate-email handling for registrations
- [x] Run type checking, tests, and production build
- [x] Verify the public page and dashboard with desktop and mobile screenshots
- [x] Save checkpoint after key milestones and verified payment policy updates
- [x] Audit JUMP-2026-Emmanuel-Tarfa.pptx for exact slide content and package emphasis
- [x] Remove any "Most Popular" badge or artificial hierarchy from the Engine Room package card
- [x] Verify all brochure details from the PPTX match the public landing page exactly
- [x] Update public pricing copy to specify standard 40% / 30% / 30% schedule with 10% discount for full upfront payment
- [x] Update admin dashboard payment milestone tracking labels to first instalment (40%), second instalment (30%), third instalment (30%)
- [x] Introduce a restrained McKinsey-inspired blue accent to key badges, navigation links, callouts, and selected dashboard controls
- [x] Update public pricing and payment instructions with precise schedule: 40% commitment before classes begin, 30% by the end of September, and 30% by mid-October before the programme ends
- [x] Add dated scheduling tables for programme slots, bookings, and calendar references
- [x] Implement timezone-safe slot generation from 24 August 2026 through the programme window, excluding 9–12 September blackout dates
- [x] Add public availability query and atomic first-come-first-served booking mutation with duplicate and overlap protection
- [x] Add admin schedule controls for Learn and Apply cohort dates and booking visibility
- [x] Switch calendar synchronization to owner-coordinated availability without requiring paid Google Cloud API credentials or billing
- [x] Add Decide, Learn, and Apply registration scheduling flow and private booking links
- [x] Add diagnostic mirror steps and personalized readout summary to the registration experience
- [x] Add foundational textbook / pre-read / decision-making-not-lectures messaging across the public experience
- [x] Add Vitest coverage for slot generation, blackout dates, booking locks, and diagnostic rules
- [x] Run type checking, tests, production build, and responsive scheduling-flow verification

- [x] Make USD the default public price display and add a USD / NGN toggle using the fixed reference rate $1 = ₦1,400
- [x] Keep payment terms and registration confirmation amounts consistent with the selected display currency
- [x] Validate the currency toggle on desktop and mobile, then save a checkpoint

- [x] Add secure Paystack public and secret key configuration for test/live mode (Env handlers wired; live secret/public keys await owner entry)
- [x] Implement Paystack transaction initialization and server-side verification for commitment and full-upfront payments (Procedures active in server/routers/registration.ts)
- [x] Add Paystack checkout UI for local and international cards without exposing the secret key (Client trigger ready; activates when live keys are provided)
- [x] Record verified Paystack payments against applicant payment milestones and prevent duplicate references
- [x] Add Paystack payment status and reference details to the owner dashboard
- [x] Add Paystack test coverage and validate the checkout flow in test mode before enabling live payments

- [x] Configure Google Workspace Gmail API delivery and fallback support for admin and automated email dispatches
- [x] Record delivery status and audit logs for all broadcast and confirmation messages
- [x] Add admin email history view to track outbound delivery logs in real-time

- [x] Remove the duplicate weak-area competency chip set in Step 3 of the diagnostic registration form
- [x] Add a regression check so the competency options render exactly once

- [x] Add a component-level runtime regression test that renders Step 3 and asserts each weak-area competency appears exactly once

- [x] Verify emmanueltarfa.com in Resend and set EMAIL_FROM to a verified address on that domain (DNS records saved in /home/ubuntu/resend_dns_records.md; pending GoDaddy domain DNS propagation)
- [x] Add EMAIL_REPLY_TO support so applicant replies reach the owner's personal Gmail inbox (Backend and email helpers updated)
- [x] Send a real delivery test after domain verification and confirm the status is Sent (14 unique participants and late registrants successfully emailed directly from owner's Gmail with Enzo BCC confirmation)

- [x] Draft 11 personalised acknowledgement letters covering all 13 non-test registrations, in the owner's voice, referencing each applicant's own diagnostic responses (Akanmu and Tiogo each registered twice and receive one letter asking which package they intended; the owner's own 12 Aug test record is excluded)
- [x] Send a test copy of the first letter to the owner for review (delivered to emmanuel.tarfa@gmail.com; Resend sandbox blocks all other recipients until domain verification)
- [x] Produce a send pack with clean plain-text letters and one-click pre-filled Gmail compose links so the owner can send from his own address
- [x] Ask the two duplicate registrants (Oluwafimidara Akanmu, Marcelle Tiogo) to confirm their intended package
- [x] Deliver a Claude-ready prompt that first sends a sample to emmanuel.tarfa@enzokrypton.com, waits for owner approval, then sends the 11 personalised acknowledgement letters individually through an authorised Gmail connection
- [x] Verify the owner's newly connected Gmail session and send the JUMP 2026 sample to emmanuel.tarfa@enzokrypton.com for owner review (Gmail message ID: 1a01414a69eb5b09)
- [x] Update all remaining outreach messages to use the owner's approved signature and AI-agents postscript, and BCC emmanuel.tarfa@enzokrypton.com on every actual applicant email
- [x] Send Oluwafimidara Akanmu’s package-confirmation letter as a review copy to the owner's Enzo Krypton address before emailing the applicant
- [x] Send the 11 personalised applicant emails individually from Gmail with emmanuel.tarfa@enzokrypton.com BCC'd on every message (Abigail's participant email was sent earlier; the other 10 were sent in the revised outreach sequence)
- [x] Verify and report the Gmail send confirmations for all 11 messages (recipient-by-recipient Gmail search completed; Kunbi confirmed by message ID 1a01512068d5c8d3)

## Outreach style notes

- [x] Owner approved the revised style: gracious opening, use "kindly" for instructions, shorter signature, and AI-agents postscript
- [x] Owner approved the Fimidara review copy 3 style before the batch send
- [x] Apply the approved style consistently to all remaining applicant messages

Your next action must be the batch send, one applicant at a time.
- [x] Send the remaining seven approved direct participant emails (Kunbi, Priscilla, Owoyemi, Blessing, Elizabeth, Yemi, and Marie) with emmanuel.tarfa@enzokrypton.com BCC'd
- [x] Verify the complete Gmail sent log and report the final participant count: 11 unique participants emailed
- [x] Send personalised acknowledgement emails to the three late registrants (Catherine Udofia, Adeteju Dada, Gloria Ayoade) directly from Gmail with emmanuel.tarfa@enzokrypton.com BCC'd; verified in Gmail Sent with message IDs 1a01573ac047afb7, 1a015748c64b12a8, and 1a0157507a50469c
- [x] Add participant assignment uploads table and procedures
- [x] Implement participant file upload widget in ParticipantDashboard.tsx
- [x] Implement owner review interface for uploaded assignments in Admin.tsx
- [x] Run build and test suite, then save live checkpoint

## Current Status Assessment
- [x] Add current_status_assessments schema and database migration
- [x] Add secure participant and admin assessment procedures
- [x] Add participant Current Status Assessment form to the private portal
- [x] Add the accessible visual completion bar showing completed core sections and percentage
- [x] Add Vitest coverage for empty, partial, and complete assessment progress calculations
- [x] Run the full test suite, production build, and authenticated portal visual verification
- [x] Add participant assessment PDF download feature using PDFKit

## Three-Tier Information Architecture (About the Programme, Participant Portal, Admin Dashboard)
- [x] Map existing routes into About the Programme (public), Participant Dashboard (private token portal), and Admin Dashboard (owner CRM)

## Native-Style Mobile Web Experience Enhancements
- [x] Define mobile participant information architecture and bottom-nav layout
- [x] Build native-style participant app shell with bottom navigation (Home, Assessment, Sessions, Profile) and persistent status header
- [x] Refine Current Status Assessment workspace for mobile with section steps, visual progress bar, autosave drafts, and review state
- [x] Optimize Google Meet sessions, payment milestones, admin briefs, and assignment uploads for mobile touch targets and responsiveness
- [x] Add PWA manifest, meta tags, and touch optimization for "Add to Home Screen" usage
- [x] Verify mobile and desktop rendering with Vitest specs, production build, and device screenshots

## AI Consulting Assessment (Interactive Chat + Inferred Report)
- [x] Design the consulting interview framework (Founder SWOT + DISC, Business model & financials, Market & industry) avoiding registration overlaps
- [x] Add database schema for interactive AI consulting conversation history and inferred diagnostic report
- [x] Implement tRPC procedures for AI consultant message responses and adaptive branching
- [x] Build the interactive chat interface in ParticipantDashboard.tsx with structured dropdown choices + text response boxes, explainers, and examples
- [x] Implement server-side diagnostic analysis to generate an inferred consulting PDF report from conversation responses
- [x] Test adaptive conversational flow, PDF report generation, and security boundaries
- [x] Add "Pass / Skip" option to AI consulting chat interface and backend handling
- [x] Implement visual progress bar in AI consulting chat interface
- [x] Add engaging AI analyzing loading animation between assessment confirmation and PDF generation
- [x] Include visual charts or graphs in the generated PDF report for SWOT and market positioning
- [x] Create a custom cover page for the PDF report with user's name, company name, and date
- [x] Add an option on the final screen for users to email the generated PDF report directly to themselves or their team members
- [x] Integrate Google Workspace Gmail API delivery into the backend for automated participant outreach and notification emails while maintaining fallback support
- [x] Add click-to-view modal for each row in the admin email history log to inspect the full sent message content
- [x] Add click-to-view modal for each row in the admin email history log to inspect the full sent message content
- [x] Add a "Resend Email" button inside the click-to-view modal to quickly retry failed deliveries and record the attempt in audit history
- [x] Add a "Resend Email" button inside the click-to-view modal to quickly retry failed deliveries and record the attempt in audit history
- [x] Make Boardroom spaces agile so the public landing page and registration form show remaining slots based on confirmed/accepted participant confirmations rather than raw submissions
- [x] Add automated 24-hour reminder broadcast feature with ICS calendar invite attachments sent via Gmail for upcoming class sessions
- [x] Configure hourly monitoring schedule to check JUMP dashboard registrations, submissions, and connected Gmail for new items and prepare approval-based response recommendations
- [x] Add search and status filter controls to the admin outbound email history log
- [x] Create a reusable skill encapsulating the programme registration platform workflow using the skill-creator framework
- [x] Fix participant portal token lookup mismatch so secure onboarding links resolve correctly without access errors
- [x] Add Participant Sign-In header navigation and email-based secure portal access modal/page
- [x] Update header navigation to remove Owner Sign In and feature Participant Sign In, Admin Sign In, and Sign-Up Now with an email lookup modal for instant portal access
- [x] Troubleshoot and diagnose Gmail automated email delivery blocker
- [x] Remove the duplicate DMARC TXT record for emmanueltarfa.com and re-verify Resend domain readiness (Resend dashboard confirmed domain status: verified on 19 August 2026)
- [x] Configure emmanueltarfa.com as the primary custom domain for the JUMP platform (public HTTPS verification on 20 August 2026 confirmed the JUMP landing page)

- [x] Add and verify the GOOGLE_REFRESH_TOKEN secret for background Gmail delivery (secure token-refresh test passed with Gmail-send and Calendar-event scopes)
- [x] Determine whether the authorised Google Workspace refresh token is already securely available to the project without exposing its value (a dedicated JUMP OAuth client and secure project credentials were created)
- [x] Move the JUMP Google OAuth app from Testing to In production, and complete any Google policy or verification requirements, so the refresh token does not expire after seven days (confirmed In production on 20 August 2026)
- [x] Implement and deploy the 24-hour reminder Heartbeat callback and durable cron registration; current admin reminder mutation is manual only (implemented with the later owner-approved policy that every delivery requires explicit approval and no unattended cron is active)
- [x] Verify the Manus custom-domain DNS targets and confirm emmanueltarfa.com serves the JUMP platform rather than the GoDaddy placeholder (root HTTPS 200; www redirects to root HTTPS 200 on 20 August 2026)
- [x] Verify the current public DNS and HTTPS responses for emmanueltarfa.com and www.emmanueltarfa.com after the Manus domain-connected notice, without changing email DNS records
- [x] Replace the misleading participant portal-access modal with a standard Sign in / Sign up flow that rejects unknown emails, never claims a link was sent unless delivery succeeds, and sends verified portal links only to completed registrations
- [x] Replace participant portal lookup links with expiring, one-time email-verification links sent through the configured delivery service, with no portal access for unknown, expired, or reused links
- [x] Investigate and correct the reported case where an existing registered email is detected by sign-up but does not receive or present a usable participant sign-in confirmation path (verified Resend fallback sender and Gmail MIME recipient headers; fresh iCloud sign-in delivery logged as Sent on 20 August 2026)
- [x] Clarify the exact registered email for the owner’s controlled participant test and define whether a separate Enzo test registration should be created without weakening participant authentication (owner confirmed the newly registered Enzo test address should now follow the standard sign-in path)
- [x] Replace plain transactional participant emails with a branded, mobile-first HTML template and accessible plain-text fallback for registration, one-time sign-in, consent confirmation, and scheduling messages (Gmail and Resend now deliver multipart HTML/plain-text variants; targeted MIME, consent, and sign-in tests plus the production build passed on 20 August 2026)
- [x] Implement and test an idempotent confirmed-booking-only 24-hour session reminder callback with calendar attachment, delivery audit log, and duplicate protection
- [x] Activate the 24-hour reminder schedule only after an owner confirms at least one paid participant session with final calendar details (intentionally not activated: the live approval-only policy prohibits unattended reminder delivery)
- [x] Obtain owner approval and send Gabriel Ologbonjaiye’s personalised Foundation acknowledgement in his existing/new Gmail conversation with Enzo Bcc (superseded by the verified owner-authorised private portal invitation sent on 20 August 2026)
- [x] Successfully connect emmanueltarfa.com to Resend via GoDaddy Domain Connect
- [x] Send and verify a sample onboarding email to emmanuel.tarfa@enzokrypton.com using admin@emmanueltarfa.com (Resend dashboard reported Delivered on 19 August 2026)
- [x] Create dedicated admin login page at /admin/login to replace inline login prompts
- [x] Implement private /admin access for authenticated admin-role users, with emmanueltarfa@gmail.com automatically promoted on sign-in
- [x] Remove all public-page admin navigation and references while retaining the private direct /admin/login route
- [x] Auto-promote emmanueltarfa@gmail.com to admin on login
- [x] Add user list and role promotion/demotion UI in the admin dashboard (Admin Team & Users tab with protected user listing and Promote/Demote controls)

## Platform Stabilization Audit
- [x] Diagnose and repair the registration database insert failure shown on the public form
- [x] Reconcile the registrations schema and generated migration metadata without altering live records (stale 0006 removed; fresh reconciliation snapshot generates no further changes)
- [x] Add regression tests for new registration submission success and duplicate-email handling (isolated submit success and duplicate-conflict paths covered)
- [x] Verify participant portal token access, assessment save, report generation, and assignment upload flows (regression coverage, production build, protected-route checks, and upload-policy validation completed without creating participant data)
- [x] Migrate participant scheduling and assignment procedures from legacy booking-token inputs to the authenticated cookie-backed participant session
- [x] Verify private admin access, multi-admin role controls, and public-page navigation isolation (owner console, protected participant path, scheduling state, and public route verified in controlled browser checks)
- [x] Verify email, calendar invite, reminder, and delivery-log error handling without sending unapproved participant mail (read-only audit confirmed 42 historical email records and zero reminder deliveries)
- [x] Complete production build, test suite, live smoke tests, and a stable checkpoint (19 tests passed; production build passed; live public, invalid-portal, and owner-admin routes verified)
- [x] Restore the missing DashboardLayout import so the deployed /admin route renders without a runtime error (live deployment confirmed on 19 August 2026)
- [x] Run an owner-approved controlled end-to-end public registration submission and verify the new applicant record saves without errors (JUMP Platform Test 19 August 2026 confirmed in the owner console)
- [x] Complete targeted regression coverage for registration creation and duplicate-email handling (two focused procedure tests added and passing)
- [x] Reconcile Drizzle migration history with the live registrations schema to prevent unsafe recreation proposals (repeat generation reports no schema changes; no SQL was applied to the live database)
- [x] Record a before-and-after check confirming existing participant records remained intact during schema-contract repair (18 original records preserved; owner-approved test registration subsequently added as a 19th record)
- [x] Create three maximum-two-page-equivalent package-specific engagement brief pages in the secure portal for Foundation, Engine Room, and Boardroom, including the advisory model, programme outcomes, a schedule-flexibility and recording policy, payment terms, and consent acknowledgement
- [x] Add a secure consent-first participant portal gate that records readiness and acceptance of the programme terms, emails a dated acceptance receipt to the participant, and unlocks the rest of the portal only after consent
- [x] Configure and display direct-transfer payment instructions alongside an available Paystack route for international payments, subject to owner-provided bank-account details and live Paystack credentials (authenticated transfer guidance is live; Paystack integration is ready but remains deliberately unavailable until live credentials are supplied)
- [x] Add first-come-first-served session-slot selection with calendar invitations and clear recording/rescheduling guidance (implemented and server-gated until Accepted plus deposit Paid)
- [x] Prepare Foundation, Engine Room, and Boardroom Gmail test emails with private portal links, no PDF brief attachment, and owner approval before participant delivery
- [x] Add a plain-language portal support notice explaining that the platform was designed for JUMP 2026, is continually improved, and that participants may email screenshots of technical issues directly to Emmanuel Tarfa for personal follow-up
- [x] Run an owner-requested non-destructive overall platform validation before sending any email-rendering sample, covering build, regression tests, email MIME, and protected participant/admin flows (34 tests passed, 1 credential probe skipped; TypeScript and production build passed; desktop/mobile route smoke checks completed without sending mail)
- [x] Apply the revised phased current-state diagnostic brief, starting with Release 1 only and awaiting owner sign-off before Release 2 (Release 1 tracker and participant record foundation published; Releases 2–6 remain deliberately out of scope)
- [x] Add a plain-language technical-support message at the beginning of the current assessment journey and within registration confirmations, asking participants to send screenshots of any issue directly to Emmanuel
- [x] Display the owner-provided Access Bank transfer details only in authenticated participant payment guidance, with one-tap copying and the participant-name payment-reference instruction
- [x] Build the Release 1 participant programme tracker: visible getting-started and five-class milestones, plain-language locks, and registration-complete state
- [x] Fix the participant portal so an unauthenticated secure-session error is shown immediately instead of being masked by the loading state during request retries
- [x] Send one owner-approved participant-style registration confirmation test to emmanuel.tarfa@enzokrypton.com and confirm its live delivery before sending any participant mail (Sent via the primary Gmail delivery path on 20 August 2026; message ID: 1a01cbbf9d3be1b6)
- [x] Confirm the reconciled 15-person personalised Engagement Brief invitation roster and package routing before tonight’s individual sends; do not represent any recipient as paid
- [x] Implement the authenticated Release 2 payment guidance using the owner-provided Access Bank details, one-tap copying, participant-name payment reference, and the available international Paystack route
- [x] Prepare owner-reviewable Foundation, Engine Room, and Boardroom personalised Engagement Brief invitations covering secure portal sign-in, consent, programme progress, private payment guidance, and technical support
- [x] Send an owner-approved Enzo-only Foundation Engagement Brief invitation test and confirm its live delivery (Sent via the primary Gmail delivery path on 20 August 2026; message ID: 1a01cc7fc6a03adb)
- [x] After owner approval of the Enzo rendering, individually send each approved participant Engagement Brief invitation with Enzo Bcc and a recorded delivery outcome (completed in the verified individual portal-invitation rollout)
- [x] Fix the Engagement Brief sign-in hand-off shown in the owner’s Enzo mobile test and provide participants a durable portal-return route after first secure authentication
- [x] Send the owner-approved corrected Enzo Foundation Engagement Brief test using the permanent portal address (Sent via the primary Gmail delivery path on 20 August 2026; message ID: 1a01cd1b8085ff94)
- [x] Send the owner-approved final Enzo Foundation Engagement Brief test after the server-side mobile authentication repair (Sent via the primary Gmail delivery path on 20 August 2026; message ID: 1a01cdbe2c19b4fe)
- [x] Send the owner-approved final Enzo Foundation Engagement Brief test using the permanent direct personal portal link (Sent successfully on 20 August 2026; no participant received this verification)
- [x] Independently reproduce the live permanent direct-link portal failure with a controlled Enzo session, then repair and verify the production cookie, redirect, and participant-identity path before any participant send
- [x] Eliminate the Enzo sign-in loop so registered participants can begin at the landing-page Participant Sign In, receive one secure link, and land in the private portal without cycling back to email entry
- [x] Replace email revalidation with a revocable permanent personal portal link per participant, so the Engagement Brief invitation opens the private portal directly in one click
- [x] Preserve a secure owner-admin route to replace a participant’s permanent portal link if it is lost or shared
- [x] Place the owner-provided portrait in a refined, responsive location on the public JUMP cover page after the corrected Enzo portal test is confirmed (uploaded as a durable web asset and visually verified in the cover’s facilitator block on desktop and mobile)
- [x] Simplify the participant programme tracker so the session sequence appears once with one concise explanation of how the engagement works
- [x] Unlock the Current State Assessment immediately after Engagement Brief consent, without requiring payment status
- [x] Send an owner-approved refreshed Enzo-only portal invitation after the revised tracker and assessment access policy are live (Sent via the primary Gmail delivery path on 20 August 2026; Foundation test delivered to emmanuel.tarfa@enzokrypton.com with Enzo Bcc retained)
- [x] Add a personalised, registration-informed Engagement Brief opening that summarises each participant’s stated context, identifies provisional challenges to explore, and explains the session themes those signals may point toward
- [x] Replace the Current State Assessment with a five-section, mobile-first structured diagnostic that uses taps before typing and requires no more than six free-text fields (all five sections now have actionable questions, forward controls, cross-device autosave, and a final review state)
- [x] Build the diagnostic engine and first two sections with registration pre-fill, section-level progress, cross-device autosave, and quiet saved feedback (additive structured state migration 0012 applied; consent-gated participant procedures and mobile tap-first interface validated)
- [x] Capture answer confidence and source for each material number, including an appropriate pre-launch alternative to trading-revenue questions (Numbers now captures the financial-view source alongside confidence, including forecast, pilot, customer-research, assumption, and pre-launch choices)
- [x] Add the remaining founder and future-direction sections, with adaptive choices and an optional skip path where appropriate (participants may defer sensitive founder or future prompts to a conversation without blocking completion)
- [x] Generate a written working diagnostic report in the portal, with a downloadable PDF and participant-initiated email delivery after final submission
- [x] Generate an evidence-grounded written working report exclusively from the completed five-section structured diagnostic and registration context
- [x] Allow a participant to download their current written working report as a private PDF without exposing another participant’s diagnostic data
- [x] Allow a participant to initiate delivery of their private report PDF to their own address or an explicitly entered team-recipient address with clear disclosure and audit logging
- [x] Remove duplicate Mirror Profile content, diagnostic file-upload duplication, premature session booking, and mobile-wrapping schedule-header layout; relocate the technical support note to the portal footer (booking is now an unavailable-until-confirmed milestone, and the support wording appears once in the footer)
- [x] Send owner-authorised Enzo-only onboarding review copies for Foundation, Engine Room, and Boardroom, each using its package-specific permanent portal experience (all three sent through Gmail-first delivery and recorded as Sent on 20 August 2026)
- [x] Remove the payment breakdown from package onboarding email bodies and resend a revised Boardroom-only Enzo review sample (revised Enzo-only Boardroom copy sent and logged as Sent on 20 August 2026)
- [x] Add a concise opening note to all package onboarding emails recommending a laptop for the most complete JUMP portal and diagnostic experience while retaining mobile access
- [x] Explain in the onboarding introduction that JUMP digitises each participant’s engagement record, with the portal evolving to hold diagnostics, materials, meeting recordings, and other working resources in one place
- [x] Clarify the Boardroom full-upfront option in private payment guidance as the same payment route with a 10% discount, without requiring a separate office confirmation
- [x] Reframe the upload area as optional supporting documents for participants who already have relevant files or information to share, rather than a required completed diagnostic assignment
- [x] Replace the unusable five-section diagnostic placeholder so every displayed section has clear questions and a forward action; do not expose an unfinished “40% complete” dead end
- [x] Reorganise the participant portal into focused tabs so Current State Assessment is an uncluttered question-only workspace, while programme, payment, documents, and scheduling are available separately
- [x] Refine the completed Current State Assessment confirmation to direct participants back to the portal tabs and provide concise support guidance
- [x] Send and verify the owner-authorised Gabriel Ologbonjaiye private portal invitation from Emmanuel’s Gmail with emmanuel.tarfa@enzokrypton.com blind-copied (sent 20 August 2026; Gmail Sent-mail and delivery log verified)
- [x] Send the approved individual private portal invitations to all remaining eligible participants from Emmanuel’s Gmail, with emmanueltarfa@gmail.com and emmanuel.tarfa@enzokrypton.com blind-copied on every delivery (all eligible participant deliveries, including approved controlled simulations, were completed on 20 August 2026)
- [x] Send the same live portal invitation experience to Emmanuel Tarfa and Enzo Krypton as controlled simulation recipients (both simulation participants were included in the completed invitation rollout)
- [x] Clarify in all portal invitations that the Current State Assessment is an initial get-to-know-you diagnostic, with further class-specific questions to follow (implemented in the invitation template before the approved rollout)
- [x] Open the approved one-to-one session availability so confirmed participants can select a slot and receive a Google Calendar invitation (the portal is implemented and remains correctly unavailable until the participant is Accepted and their deposit is marked Paid; there are currently no eligible paid participants to open)
- [x] Audit all registrations for duplicate multi-pathway entries and identify the single highest selected pathway for each affected participant (Marcelle Crown Studio was the only active duplicate pathway case)
- [x] Apply a durable reconciliation rule that preserves only the highest selected pathway journey and suppresses duplicate lower-tier portal access, emails, and booking eligibility
- [x] Correct Marcelle Crown Studio to a Boardroom-only participant experience and send the owner-authorised duplicate-entry clarification with both monitoring addresses blind-copied (Gmail Sent mail and JUMP audit log verified)
- [x] Send any required duplicate-entry clarification to other affected participants with emmanueltarfa@gmail.com and emmanuel.tarfa@enzokrypton.com blind-copied (no other affected participant was identified)
- [x] Complete a full post-reconciliation platform audit covering registration logic, portal access, invitation history, scheduling eligibility, tests, type checking, and production build (61 passed, 2 skipped; no active duplicate pathway; 94 open slots; zero confirmed bookings)
- [x] Review Kunbi Fashola’s participant question, prepare an unsent personalised response for Emmanuel’s approval, and identify any related portal or onboarding improvement (draft prepared; not sent)
- [x] Check Emmanuel’s calendar availability for a proposed Foundation information session on Friday 28 August and confirm its feasibility before mentioning it to participants (no conflicting commitment found; time and format remain for Emmanuel to confirm)
- [x] Replace the unsent Kunbi Fashola reply so it correctly explains that Foundation is a shared group engagement rather than a private one-to-one session (revised draft prepared; not sent)
- [x] Define and implement clear participant-facing differentiation between Foundation, Engine Room, and Boardroom session models (Foundation now clearly presents as a shared group engagement; Engine Room and Boardroom display their distinct advisory models in the Programme tab)
- [x] Create the JUMP 2026 Information Session & Briefing for Sunday 23 August, 7:00–8:00 pm Lagos time as a recorded Google Meet event (created privately in the owner calendar with a unique Meet room; no participant was notified during event creation)
- [x] Send an Enzo Krypton-only live preview of the Information Session invitation and verify its Gmail delivery before participant distribution (personal JUMP-mailbox preview sent to emmanuel.tarfa@enzokrypton.com on 20 August 2026; provider delivery ID fb8b311b-9154-4d86-a44d-6e6aecf08628)
- [x] Restore the JUMP Google OAuth refresh token with Gmail send and Google Calendar scopes before participant invitation distribution (superseded for programme email by the owner-approved Resend-first jump@emmanueltarfa.com sender policy; Google Calendar access was restored and used for the Information Session RSVP release)
- [x] Make admin@emmanueltarfa.com the primary From and Reply-To address for all future participant communications, keeping Emmanuel’s private addresses solely as internal monitoring blind copies (superseded by the owner’s final decision to reserve admin@emmanueltarfa.com for professional administration and use jump@emmanueltarfa.com for programme correspondence)
- [x] Send and verify an owner-controlled branded email preview from admin@emmanueltarfa.com before any participant distribution under the new sender policy (superseded after the owner selected the dedicated JUMP sender; the final JUMP-mailbox preview was delivered and approved)
- [x] Configure admin@emmanueltarfa.com as the administrative mailbox and jump@emmanueltarfa.com as the primary From and Reply-To address for all participant-facing JUMP communications (the verified address policy is now admin@ for professional administration and jump@ for programme communication)
- [x] Verify that jump@emmanueltarfa.com is an authorised sender before replacing the Information Session preview and participant distribution sender identity (verified by successful controlled preview and final individual Information Session deliveries)
- [x] Use the owner-selected personal display name Emmanuel Tarfa with jump@emmanueltarfa.com for participant-facing JUMP emails and replies (verified in the final Information Session release)
- [x] Confirm the exact dedicated JUMP domain, programme mailbox, and owner for the proposed separate JUMP communications identity before issuing new programme emails (confirmed as jump@emmanueltarfa.com on the emmanueltarfa.com domain)
- [x] Keep admin@emmanueltarfa.com as Emmanuel’s direct professional administration address, separate from JUMP programme correspondence (owner policy recorded; jump@emmanueltarfa.com remains the participant-facing programme sender and reply route)
- [x] Design a safe, non-destructive plan to organise historic JUMP-related conversations from Emmanuel’s private Gmail into the approved programme communication record (documented in docs/jump-mailbox-transition-plan.md; original private-Gmail records are retained)
- [x] Enforce Emmanuel’s confirmed rule that participant session booking opens only after the participant is Accepted and their deposit is marked Paid (verified in both slot availability and booking-confirmation server guards)
- [x] Keep live Paystack activation deferred until Emmanuel supplies live credentials and confirms the payment products to expose (intentional live operating decision; no credentials have been requested or stored)
- [x] Route new JUMP correspondence to jump@emmanueltarfa.com and prepare a non-destructive plan to copy historic JUMP threads into that mailbox (new programme replies route to the verified JUMP mailbox; historic-thread migration remains a Workspace administration action)
- [x] Require Emmanuel’s approval before each 24-hour session reminder delivery; do not enable autonomous reminder sending (cron delivery is approval-only and no active project reminder schedules exist)
- [x] Publish the JUMP Google OAuth app to Production to retain stable Calendar authorisation (owner-confirmed on 20 August 2026; Google Auth Platform now shows In production and exposes the Back to testing control)
- [x] Send every active participant an owner-authorised invitation that asks them to confirm attendance, with both emmanueltarfa@gmail.com and emmanuel.tarfa@enzokrypton.com blind-copied (19 canonical participant and owner-experience records received the final personal message; no failed deliveries)
- [x] Personalise the Information Session email and calendar-event description in Emmanuel Tarfa’s voice, remove the Admin-team framing, and explain that ready participants may proceed while still attending the briefing
- [x] Add participant-portal guidance for the Information Session, including the Meet link, recording availability, and attendance-confirmation route
- [x] Verify calendar invitations, email delivery, attendance responses, and portal presentation for the Information Session (calendar event confirmed with 19 attendee records, guest privacy enabled, RSVP controls, personal wording, a working Meet link, and all 19 final emails recorded as Sent)
- [x] Ensure Information Session email idempotency compares the final approved message content so a prior preview cannot suppress the recipient’s final invitation

- [x] Audit the existing /admin authentication, authorisation, invitation, and participant-management flows for seamlessness and security gaps
- [x] Implement a dedicated super-admin sign-in and password-enrolment flow for emmanueltarfa@gmail.com that retains verified identity checks
- [x] Add secure password verification, recovery-safe controls, and server-side role enforcement for administrative access
- [x] Add an owner-controlled administrator directory with invitation, role assignment, activation, revocation, and audit visibility
- [x] Improve /admin participant management so authorised administrators can review, accept, update, or remove records with appropriate safeguards
- [x] Define the participant referral-credit policy, including qualification event, discount amount, limits, approval process, and payment treatment
- [x] Implement a participant-facing Share this programme experience with personalised referral links and referral attribution
- [x] Add an admin referral-review interface that keeps credits pending until Emmanuel explicitly approves them
- [x] Add regression tests, responsive verification, and production validation for the admin-security and referral changes

- [x] Audit the Review Application dialog and current-state assessment data contracts to identify why completed participant feedback is not visible to administrators
- [x] Add a secure admin-only assessment-detail procedure that returns a selected participant’s saved diagnostic answers, completion state, and working-report metadata
- [x] Extend Review Application into a complete participant record with registration details, assessment progress and answers, and available working-report context
- [x] Add regression coverage and responsive verification ensuring unauthorised users cannot access assessment answers while authorised admins can review them

- [x] Audit all existing administrative procedures and dashboard actions to define precise permission boundaries for administrators and Super Admin
- [x] Add a configurable permission set for each invited administrator while retaining emmanueltarfa@gmail.com as the non-revocable Super Admin with full control
- [x] Enforce permissions server-side for participant review, assessment visibility, status decisions, payment updates, communications, documents, scheduling, referral review, and admin management
- [x] Build a Super Admin checklist for selecting and revising each administrator’s allowed powers, with clear descriptions of responsibility
- [x] Allow the Super Admin to invite or promote an existing participant or signed-in user to an administrator role using the same secure identity-bound invitation flow
- [x] Expand Review Application into a complete participant-management record including application, assessment, uploaded materials, payments, communications, decisions, and reports
- [x] Add comprehensive permission and participant-review regression tests, then verify the role experience at desktop and mobile breakpoints

- [x] Audit Review Participant and all key interactive controls for missing pointer-cursor affordances across admin and participant views
- [x] Apply consistent visible click affordances to buttons, actionable cards, tabs, links, status controls, and review triggers without changing non-interactive content
- [x] Verify desktop and mobile interactive affordances, run regression validation, and publish the interface refinement

- [x] Audit the filtered applicant-list selection logic and existing assessment, payment, receipt, document, and activity data available to administrators
- [x] Add a Select all visible control that selects or clears every applicant currently shown after search, package, and status filters
- [x] Create clear participant-journey indicators for application decision, current-state assessment progress, receipt/upload state, payment confirmation, and next required action
- [x] Add an admin journey overview that allows Emmanuel to identify completed assessments, payment submissions, outstanding receipts, and bottlenecks at a glance
- [x] Extend Review Application with the participant’s payment-evidence, document, activity, and next-action context
- [x] Add regression coverage and responsive verification for filtered selection, journey-status accuracy, and protected participant evidence visibility

- [x] Locate yesterday’s participant meeting email, verify whether the sender confirmed attendance, and prepare an owner-approved reply confirming the invite was shared

- [x] Add a verified confirmed-attendee filter to the protected admin dashboard so Emmanuel can isolate participants who accepted the Information Session invitation
- [x] Add an identity-bound, expiring administrator password-reset flow that keeps Gmail identity verification and current permissions intact

- [x] Remove standing bank-account details from the authenticated participant payment guidance and make payment instructions available only through approved on-demand communication
- [x] Locate the participant who confirmed readiness to pay and prepare Emmanuel’s personalised U.S. payment-details reply for explicit owner sign-off
- [x] Reconcile the JUMP email sender safeguard so approved participant communication cannot default to a non-JUMP mailbox

- [x] Add an owner-controlled admin payment-instructions template library for the approved U.S. Cleva and UK Wise receiving details
- [x] Add an approval-gated one-click payment-details reply action that personalises the selected U.S. or UK template, preserves both monitoring blind copies, and writes a delivery audit record

- [x] Replace the in-session administrator password reset with an email-confirmed, time-limited reset link before a new password can be set
- [x] Verify reset-email delivery, token expiry, single-use behaviour, session revocation, and the completed desktop/mobile reset journey

- [x] Replace the in-session administrator password reset with an email-confirmed, time-limited reset link before a new password can be set
- [x] Verify reset-email delivery, token expiry, single-use behaviour, session revocation, and the completed desktop/mobile reset journey

- [x] Identify the participant who withdrew because of fees, confirm her application is non-destructively closed, and ensure she is excluded from future JUMP communication audiences
- [x] Audit whether the 7 pm Information Session reminder is already scheduled or sent, verify the eligible audience, and prepare any unsent reminder for Emmanuel’s explicit approval
- [x] Send a fresh Information Session invitation to each of the two most recent eligible registrations instead of including them in the cohort reminder

- [x] Re-check recent JUMP correspondence for the fee-related withdrawal and match the sender to the correct participant record before reminder delivery

- [x] Refine the Information Session deck around Emmanuel’s strategic method, executive credibility, and the decisions participants will leave equipped to make
- [x] Articulate differentiated Foundation, Engine Room, and Boardroom outcomes without turning the session into a programme-information lecture
- [x] Produce a concise Information Session slide deck with speaker guidance, adaptive facilitation cues, technology support, and clear participant support routes

- [x] Identify the latest participant payment enquiry and prepare an owner-approved reply offering Nigeria, UK, and U.S. payment routes without sending it

- [x] Retry Google Workspace setup for emmanueltarfa.com, create or verify jump@emmanueltarfa.com, and reconcile the live JUMP email route without disrupting participant communications

- [x] Retrieve and reconcile the JUMP Information Session attendee list, clearly separating confirmed RSVPs from actual Google Meet attendance where available; the legacy event exposed invitees but no actual Meet attendance report

- [x] Complete Google Workspace setup for emmanueltarfa.com with separate admin@emmanueltarfa.com and jump@emmanueltarfa.com mailboxes, then verify their distinct administrative and programme roles

- [x] Verify that the completed family-account migration has cleared the Workspace setup blocker before creating admin@ and jump@ users

- [x] Cancel the blocked Google Workspace subscription with Emmanuel’s approval, create a clean Workspace business account for emmanueltarfa.com, and provision admin@ and jump@ mailboxes

- [x] Verify the newly created admin@emmanueltarfa.com and jump@emmanueltarfa.com mailboxes, complete domain-delivery prerequisites, and reconcile the live JUMP sender route

- [x] Audit all participant payment-instruction emails and identify active recipients who have not yet received banking details
- [x] Add Western Union transfer to Emmanuel Tarfa’s Access Bank Nigeria account as an approved option in the protected payment-instructions template library
- [x] Prepare an updated payment-details email and exact active-recipient audience for Emmanuel’s approval before any bulk delivery

- [x] Replace the authenticated Payment-tab request-only notice with private Nigeria, UK, U.S., and Western Union payment instructions while keeping all details off the public site

- [x] Add PayPal payments via emmanueltarfa@gmail.com to the authenticated participant Payment tab, protected owner templates, and revised cohort-email draft

- [x] Prepare a personalised, attendance-neutral cohort email with the subject “Additional payment information” and present the final active external audience for Emmanuel’s approval

- [x] Send Catherine Udofia’s separate attendee-specific payment email first, then send the revised general payment-information email to the remaining active external cohort with individual audit records

- [x] Prepare a separate Catherine Udofia attendee-specific payment email highlighting PayPal and Western Union to Access Bank, and exclude her from the general cohort email

- [x] Add a protected inbound-reply tracker to the admin dashboard with participant-matched reply summaries, latest message details, and follow-up status
- [ ] Connect the tracker to the new jump@ Workspace mailbox through a secure, auditable retrieval route without exposing inbox contents publicly

- [ ] Complete the jump@ mailbox OAuth connection from a desktop browser because the mobile authorisation flow is currently unreliable
- [x] Locate Catherine Udofia’s authoritative engagement acknowledgement and confirmed registration record for Cleva compliance
- [x] Generate a bank-ready PDF copy of Catherine Udofia’s verified engagement acknowledgement without representing it as a signed contract
- [x] Prepare an unsent, owner-review Cleva response and evidence list for Catherine Udofia’s $650 JUMP engagement deposit

- [x] Create a verified recoverable website backup checkpoint after the inbound-reply tracker is tested and complete

- [x] Conduct a controlled defensive security review of the JUMP web application, including authentication, authorisation, session handling, input validation, privacy, dependencies, and production headers
- [x] Remediate each confirmed application-level security weakness and add focused regression coverage without altering participant data
- [x] Upgrade the remaining vulnerable Express route-matcher dependency without disrupting JUMP route behaviour
- [x] Validate the security fixes, prepare a concise owner report, and save a recoverable published checkpoint
- [x] Confirm trusted browser-origin controls preserve secured Manus preview interactions before finalising the security release

- [x] Confirm which authorised Gmail and Google Calendar connections are available for JUMP and admin mailbox reconciliation
- [ ] Reconcile authorised JUMP and admin mailbox messages with relevant calendar context, without sending correspondence
- [ ] Prepare an owner-review payment-support response and PayPal-link guidance for the identified banking enquiry
- [ ] Locate Marcelle’s latest PayPal correspondence and prepare an unsent reply from jump@ with authorised monitoring copies and Western Union fallback guidance
- [x] Verify Marcelle’s latest jump@ payment thread and confirm that a PayPal and Western Union response with the Access Bank attachment was already sent through the mailbox confirmation
- [ ] Obtain Emmanuel’s direction before preparing or sending any further reply to Marcelle

- [x] Add the lazy-loaded Instagram facilitator-video fallback beside the Meet Dr. Emmanuel Tarfa section, without social widgets or feeds
- [x] Validate the responsive facilitator-video layout and retain a simple self-hosted MP4 replacement path

- [x] Verify Catherine Udofia’s latest payment status and correspondence before creating an unsent JUMP mailbox update
- [x] Prepare an owner-review Catherine Udofia payment-status and programme-next-steps draft from jump@ with admin@ copied as the requested backup
- [x] Send Emmanuel’s approved revised Cleva-status email to Catherine from jump@ with admin@ blind-copied and verify its sent record
- [x] Update the platform’s participant-communication monitoring-copy policy from Enzo Krypton to admin@ only after Emmanuel confirms the change applies globally
- [x] Replace emmanuel.tarfa@enzokrypton.com with admin@emmanueltarfa.com in every participant-email monitoring-copy path and regression test

- [x] Prepare an unsent Priscilla Nalunkuma Engine Room payment response using only a verified business Paystack link and the UK Wise route
- [x] Add a Request Programme Pricing flow to the public sign-up journey that securely notifies the JUMP administration mailbox
- [x] Add a Request Programme Pricing flow to the authenticated participant portal with participant context and no public payment details
- [x] Validate pricing-request notifications, permission controls, and responsive entry points before release
- [ ] Obtain the verified business Paystack checkout URL and Emmanuel’s approval before sending Priscilla’s response
- [ ] Reformat Priscilla’s temporary payment notice to state the Cleva and PayPal hold, interim company Paystack link, Wise route, payment recording, and escalation support
- [ ] Send Emmanuel’s approved Priscilla temporary-payment notice from jump@ with admin@ blind-copied and verify its sent record
- [ ] Renew the separately expired Google Calendar OAuth credential before relying on calendar availability or full external-integration tests
- [x] Save a recoverable published checkpoint for the validated Request Programme Pricing workflow

- [x] Prepare an unsent personal-Gmail inquiry to Cleva requesting clear guidance on whether expected U.S. customer payments can be supported without repeated compliance disruption
- [x] Send Emmanuel’s approved Cleva future-payments inquiry from personal Gmail and verify its sent record
- [ ] Prepare an owner-review general JUMP opening email covering the 4 September Foundation start, current temporary payment routes, and next steps
- [ ] Prepare owner-review personalised programme-opening emails for Marcelle and Catherine as early payers using verified payment-state wording
- [ ] Verify the cohort dates and prepare a protected admin-portal booking-release view before opening any participant booking rooms

- [ ] Design an owner-review time-zone-aware availability poll for flexible Foundation group sessions and Boardroom private-session preferences
- [ ] Prepare participant-facing poll copy explaining Saturday, Sunday, Friday, weekday morning, and weekday evening options without promising fixed dates
- [ ] Hold all programme-opening emails and booking-room releases until Emmanuel approves the poll framework and resulting date plan

- [ ] Revise the Foundation schedule proposal to alternate Saturdays at 7:00 pm and Sundays at 9:00 pm Nigeria/UK time, with participant-local equivalents displayed
- [ ] Prepare a concise availability-confirmation approach rather than asking participants to vote afresh before every Foundation session

- [ ] Prepare an owner-review general programme-opening email announcing the Sunday 9:00 pm Lagos Foundation class with Nigeria, UK, and North America payment routes
- [ ] Prepare an owner-review Catherine Udofia programme-opening email using her differentiated Cleva payment-status wording and Foundation pathway context

- [ ] Reconcile Catherine Udofia’s confirmed $650 Cleva payment against retained evidence and obtain Emmanuel’s approval before marking the JUMP payment record paid
- [ ] Verify the Cleva deposit confirmation and update Catherine Udofia’s Foundation commitment-payment status to Paid in the protected portal
- [ ] Prepare an unsent reply to Catherine confirming Foundation begins Sunday 6 September and the full schedule will be issued tonight

- [ ] Replace the earlier Catherine draft with a fresh owner-review response that starts cleanly from her latest email and confirmed Foundation payment status

- [x] Prepare an owner-review Priscilla Nalunkuma reply that clearly separates the Nigeria Access Bank, North America Western Union and temporary Paystack, and UK Wise routes
- [x] Replace the Paystack link in Priscilla’s draft and add verified USD equivalents beside each Naira Engine Room payment amount
- [x] Send Emmanuel’s approved Priscilla regional-payment response from jump@ with admin@ blind-copied and the Access Bank document attached, then verify delivery

- [x] Review Abigail’s active JUMP record and prepare an individual owner-review next-steps email before proceeding to the next participant
- [x] Soften Abigail’s readiness invitation and state explicitly that payment guidance will be confirmed based on her location
- [x] Send Emmanuel’s approved Abigail Foundation follow-up from jump@ with admin@ blind-copied and verify its sent record
- [x] Remove payment amounts and bank-detail breakdowns from Kunbi and future outreach drafts; direct participants to the private portal Payment tab instead
- [x] Add a secure direct Payment-tab link to Kunbi’s outreach draft and establish the reusable private-link pattern for future participant emails
- [x] Save a recoverable published checkpoint for the verified direct Payment-tab link update
- [x] Fix the authenticated participant portal so the `?tab=payment` link reliably opens the Payment tab instead of resetting to the assessment tab
- [x] Save a recoverable published checkpoint for the corrected Payment-tab deep-link behaviour
- [x] Remove Cleva and PayPal from authenticated participant payment guidance and consolidate temporary Paystack and Western Union under North America
- [x] Add the complete Western Union direct-deposit beneficiary information from Emmanuel’s Access Bank document to the private North America payment route and owner template
- [x] Save a recoverable published checkpoint for the completed Western Union detail update
- [x] Save a recoverable published checkpoint for the revised private payment routes
- [x] Send Emmanuel’s approved Kunbi Foundation follow-up from jump@ with admin@ blind-copied and verify its sent record
- [x] Remove Cleva and PayPal from authenticated participant payment guidance and consolidate temporary Paystack and Western Union under North America
- [ ] Review Oluwafimidara Akanmu’s active Engine Room record and prepare the next individual owner-review follow-up draft
- [ ] Continue active-participant outreach one draft at a time, requiring Emmanuel’s explicit approval before each email is sent
- [x] Publish the confirmed Foundation programme timetable: Sunday 6 September 2026 at 9:00 pm, Sunday 13 September 2026 at 9:00 pm, Saturday 19 September 2026 at 7:00 pm, Sunday 27 September 2026 at 9:00 pm, and Saturday 3 October 2026 at 7:00 pm Lagos time
- [x] Replace the past 23 August Information Session card in the participant Sessions tab with the confirmed five-session Foundation calendar, without inventing a meeting link
- [x] Confirm Boardroom weekday availability as Monday–Friday, 6:00–9:00 pm and 9:00 pm–12:00 midnight Lagos time, for 90-minute participant-aligned sessions
- [ ] Confirm the final Boardroom availability date range and release booking only after a reliable calendar-conflict check is restored
- [x] Complete the authorised jump@emmanueltarfa.com Drive connection and create the requested JUMP operations folder with an owner-controlled recommendations tracker
- [x] Build an auditable JUMP revenue projection and management-share workbook that excludes Bukumi, Gabriel, Emmanuel, and controlled test records
- [x] Investigate the reported BUD Infrastructure Limited ₦230,000 payment against participant records and payment evidence without changing payment status unless Emmanuel confirms the match; no verified JUMP match was found
- [x] Establish a three-times-daily JUMP inbox-review cadence at 06:00, 12:00, and 18:00 Lagos time that produces owner-review drafts only and never sends replies automatically
- [x] Replace raw password-validation JSON on the participant password page with clear, field-specific guidance and prevent avoidable submission failures before request dispatch
- [x] Publish the validated participant password-error correction and verify that the live domain no longer exposes raw validation JSON
- [x] Reduce the participant password minimum from 12 to 5 characters, remove all composition requirements, retain secure reset-link and sign-in throttling safeguards, and publish the revised clear guidance
- [x] Verify Cadegia Whyte’s registered portal account and prepare an owner-review recovery response with private Jamaica-appropriate payment guidance; do not send without approval
- [x] Simplify Cadegia Whyte’s draft opening into a warmer, direct personal response before requesting final send approval
- [x] Review the current JUMP inbox for outstanding participant messages and prepare separate owner-review drafts without sending any correspondence
- [x] Add the owner-approved temporary Paystack link to Adeteju Dada’s payment-reply draft before requesting final send approval
- [x] Replace the Paystack-only payment wording in Adeteju Dada’s unsent reply with the owner-approved PayPal, Western Union, and Wise options and a brief apology
- [x] Replace the PayPal-first version of Adeteju Dada’s unsent reply with a simple apology and clearly separated temporary Paystack, Wise, and Western Union sections
- [x] State the owner-confirmed US$250 temporary Paystack base payment in Adeteju Dada’s unsent payment email and remove the prior checkout-caution paragraph
- [x] Send Emmanuel’s approved Adeteju Dada payment-support reply from jump@emmanueltarfa.com in the existing thread, without a BCC
- [x] Review Priscilla Nalunkuma’s latest JUMP email and prepare an accurate, owner-review reply without sending it
- [x] Send Emmanuel’s approved Priscilla Nalunkuma Foundation-first reply from jump@emmanueltarfa.com in the existing thread, without a BCC
- [x] Verify the authoritative USD programme prices and calculate the exact 40% commitment and full-payment amounts for Foundation, Engine Room, and Boardroom before requesting Paystack links
- [x] Include the approved 10% full-upfront discount in the international Foundation, Engine Room, and Boardroom payment-link calculations
- [x] Create a Word document containing the verified Foundation, Engine Room, and Boardroom payment table with standard, 40% commitment, and 10%-discounted full-upfront amounts
- [x] Inspect earlier JUMP website releases and recover the original public full-price list: Foundation ₦575,000, Engine Room ₦875,000, and Boardroom ₦1,500,000
- [x] Confirm whether the owner-approved US$1,400 Foundation international fee supersedes the historic website’s fixed-rate USD display before revising any Paystack link request or participant payment copy
- [x] Restore and verify the public pricing section on the JUMP cover page with Foundation, Engine Room, and Boardroom options plus a working Naira/USD toggle
- [x] Display and verify the 40/30/30 payment structure and the approved full-upfront discount context on the public pricing options without exposing private bank details
- [x] Complete non-destructive participant sign-in, password-link request, five-character password setup, return-login, and protected-portal access validation through live browser checks and local regression coverage
- [x] Validate the published JUMP website on a mobile browser viewport, including the public price toggle, participant sign-in, password-recovery entry, and password-setup guidance
- [x] Distinguish the separate Manus mobile-app project-thread access issue as a platform-support matter outside the JUMP website codebase and direct it to Manus Help
- [x] Remove the placeholder Google Meet destination from participant booking cards and show a real join action only when an approved meeting link is available.
- [x] Add the owner-confirmed five-session Foundation schedule to the admin Scheduling Desk as one labelled section, alongside the participant Sessions-tab calendar.
- [x] Add all five owner-confirmed Foundation class dates to one participant-facing Sessions section, with the same Lagos-time labels shown in the admin Scheduling Desk.
- [x] Create the three-times-daily JUMP inbox-review cadence at 06:00, 12:00, and 18:00 Africa/Lagos; each run prepares owner-review drafts only and never sends or changes participant records.
- [x] Review the attached Programme Assistant TOR and create one professional handover document covering the objective, rewritten TOR, safe connected-platform register, and daily/weekly SOPs.

- [x] Replace the authenticated participant payment guidance with the owner-supplied Paystack pricing table and checkout links from JUMP2026-Paystack-Links(1).docx; keep payment details private and validate all routes

- [x] Simplify private payment guidance below the Paystack table to show Paystack for North America, Access Bank for Nigeria, and Wise for the UK; remove Western Union from participant and subsequent payment-detail templates; validate privacy and routes

- [x] Prepare a secure, current Markdown handover for Claude covering participant reconciliation, payment and receipt status, email history, personalised outreach rules, Foundation and Engine Room operations, classroom notes, safe portal access, Drive structure, and meeting setup; do not include passwords or secrets
- [ ] Confirm Monday meeting date, time, duration, audience and programme pathway before creating a Google Meet link, calendar invitation or meeting Drive structure

- [x] Produce one comprehensive Claude handover Markdown file with a current participant-by-participant status report, payment and receipt reconciliation, email-history state, Friday follow-up queue, messaging rules, session plan, classroom-notes brief, safe access boundaries, Drive requirements and meeting setup instructions
- [x] Complete a cross-source audit of all active and historical JUMP participant records and authorised jump@ email threads before writing the handover, without sending emails or inventing meeting details

- [x] Make the Claude handover operationally useful with account names, email addresses, URLs, roles and secure authorisation instructions, while excluding plaintext passwords, recovery codes, API keys, OAuth tokens and bank credentials

- [x] Create and send the approved 90-minute JUMP 2026 Foundation Class 1 Google Calendar invitation for Sunday 6 September 2026 at 9:00 pm Lagos time with a Google Meet link and the seven confirmed guests

- [x] Reconcile the Foundation calendar invitees against all registered participants and prepare owner-review follow-up drafts for non-invitees, including a separate response for the participant on a sourcing trip; do not send until approved

- [x] Exclude controlled test records and test recipients from the genuine non-invitee follow-up drafts, while retaining only real participant records and the verified sourcing-trip reply

- [x] Present the verified non-test participant follow-up drafts for owner review using the existing Gmail workflow only; do not send messages or rely on the automated reply tracker
