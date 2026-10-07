/**
 * Single source of truth for programme and organisation identity.
 *
 * Every participant-facing name, sender identity and facilitator reference in the
 * client, server and email templates reads from here, so a rebrand is a change to
 * this file (plus matching test expectations) rather than a codebase-wide edit.
 *
 * The organisation identity and palette are IP Factory's. Programme names, facilitator and
 * mailbox values still describe JUMP 2026 until the product name and desk mailbox are set
 * (see docs/ipf-factory/MIGRATION_CHECKLIST.md, decisions D1–D4).
 *
 * Not covered here, by design:
 * - Stored identifiers (database enum values, cookie names, storage keys), which
 *   need a data migration to change.
 * - Payment beneficiary details, which belong to the payments workstream.
 * - Deployment origins and the Super Admin identity, which are environment configuration.
 */
const programmeShortName = "JUMP";
const programmeName = "JUMP 2026";
const programmeTrack = "Strategy & Innovation Genius Track";
const facilitatorName = "Emmanuel Tarfa";

export const BRAND = {
  /** The organisation that owns and runs the programme. */
  organisationName: "IP Factory",
  organisationLegalName: "Intellectual Property Factory",
  /**
   * The business-support offer's public name ([NAME] in the concept note's site copy), chosen
   * 7 October 2026. Written out in full with its maker as productEndorsement.
   */
  productName: "The Shift",
  productEndorsement: "The Shift, by IP Factory",
  productTagline: "Support for business owners",
  /** External page for the free business check, if it runs elsewhere. Empty: the on-site form opens. */
  applyUrl: "",
  /**
   * Booking page for the free 20-minute discovery call (Calendly or similar). Empty: the business
   * check records the request and the office books the call by email or WhatsApp.
   */
  discoveryCallUrl: "",
  /**
   * Logo files in client/public/brand (ipf-gradient, the Option 1 stacked logo). Use as supplied:
   * never recolour or stretch. The white version goes on dark panels only.
   */
  logoUrl: "/brand/ipf-gradient-logo.webp",
  logoOnDarkUrl: "/brand/ipf-gradient-logo-white.webp",
  markUrl: "/brand/ipf-gradient-mark.webp",

  /** Short programme name used in compounds such as "JUMP portal" or "JUMP administrator". */
  programmeShortName,
  /** Programme name with edition, e.g. in email subjects and headings. */
  programmeName,
  /** Descriptive track name. */
  programmeTrack,
  /** Full formal programme title. */
  programmeFullName: `${programmeName} ${programmeTrack}`,

  /** Facilitator references used in programme copy. */
  facilitatorFirstName: "Emmanuel",
  facilitatorName,
  facilitatorFormalName: `Dr. ${facilitatorName}`,
  facilitatorPortraitUrl: "/manus-storage/jump-emmanuel-tarfa-portrait_a3b21e44.jpeg",
  facilitatorInstagramReelUrl: "https://www.instagram.com/reel/DbIe9w9s_1L/",

  /** Outbound email identity. Participant mail is always sent from and replied to the programme mailbox. */
  senderDisplayName: `${facilitatorName} | ${programmeName}`,
  programmeMailbox: "jump@emmanueltarfa.com",
  /** Receives the monitoring copy of operational email and administrative notices. */
  administrationMailbox: "admin@emmanueltarfa.com",

  /**
   * Brand colours for email HTML and PDFs, which cannot read CSS variables.
   * Must match --color-brand / --color-brand-deep in client/src/index.css (enforced by brand.test.ts).
   */
  colorBrand: "#1C4E7E",
  colorBrandDeep: "#12324F",
} as const;

export type Brand = typeof BRAND;
