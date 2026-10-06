import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Users provisioned through Manus OAuth. The live database is authoritative;
 * this model mirrors it exactly so role-gated admin access remains reliable.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** A second, JUMP-specific password factor for an already verified administrator identity. */
export const adminCredentials = mysqlTable("admin_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 512 }).notNull(),
  failedAttempts: int("failedAttempts").default(0).notNull(),
  lockedUntil: timestamp("lockedUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminCredential = typeof adminCredentials.$inferSelect;

/** Owner-selected capabilities for a verified administrator. The Super Admin is intentionally not represented here. */
export const adminPermissionProfiles = mysqlTable("admin_permission_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  permissionsJson: text("permissionsJson").notNull(),
  updatedByUserId: int("updatedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminPermissionProfile = typeof adminPermissionProfiles.$inferSelect;

/** Short-lived, revocable server-side sessions created after the JUMP admin password is verified. */
export const adminAccessSessions = mysqlTable("admin_access_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminAccessSession = typeof adminAccessSessions.$inferSelect;

/** Single-use password-reset credentials. Only a token hash is retained; reset links themselves are never stored. */
export const adminPasswordResetTokens = mysqlTable("admin_password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  consumedAt: timestamp("consumedAt"),
  revokedAt: timestamp("revokedAt"),
  deliveryStatus: mysqlEnum("deliveryStatus", ["Sent", "Failed", "Simulated"]).default("Simulated").notNull(),
  deliveryMessageId: varchar("deliveryMessageId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminPasswordResetToken = typeof adminPasswordResetTokens.$inferSelect;

/** Email-bound, expiring invitations for additional JUMP administrators. */
export const adminInvitations = mysqlTable("admin_invitations", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  inviteeName: varchar("inviteeName", { length: 255 }),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["Pending", "Accepted", "Revoked", "Expired"]).default("Pending").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedByUserId: int("acceptedByUserId"),
  acceptedAt: timestamp("acceptedAt"),
  deliveryStatus: mysqlEnum("deliveryStatus", ["Sent", "Failed", "Simulated"]).default("Simulated").notNull(),
  deliveryMessageId: varchar("deliveryMessageId", { length: 255 }),
  /** Immutable proposed capability set selected by Emmanuel when the invitation is issued. */
  proposedPermissionsJson: text("proposedPermissionsJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminInvitation = typeof adminInvitations.$inferSelect;

/** Append-only access-management audit events for invitations, role changes, and password enrolment. */
export const adminAccessAuditEvents = mysqlTable("admin_access_audit_events", {
  id: int("id").autoincrement().primaryKey(),
  actorUserId: int("actorUserId"),
  action: varchar("action", { length: 128 }).notNull(),
  targetEmail: varchar("targetEmail", { length: 320 }),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminAccessAuditEvent = typeof adminAccessAuditEvents.$inferSelect;

/** Email audit log for automated and manually triggered communications. */
export const emailLogs = mysqlTable("email_logs", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["Sent", "Failed", "Simulated"]).default("Sent").notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

/** Participant replies retrieved from the dedicated JUMP mailbox; never exposed outside authorised administration. */
export const inboundEmailReplies = mysqlTable("inbound_email_replies", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(),
  mailboxMessageId: varchar("mailboxMessageId", { length: 255 }).notNull().unique(),
  mailboxThreadId: varchar("mailboxThreadId", { length: 255 }),
  senderEmail: varchar("senderEmail", { length: 320 }).notNull(),
  senderName: varchar("senderName", { length: 255 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  preview: text("preview").notNull(),
  body: text("body").notNull(),
  receivedAt: timestamp("receivedAt").notNull(),
  status: mysqlEnum("status", ["New", "Reviewed", "Follow-up", "Closed"]).default("New").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InboundEmailReply = typeof inboundEmailReplies.$inferSelect;

/** Pricing enquiries requested from public sign-up or an authenticated participant portal. */
export const pricingRequests = mysqlTable("pricing_requests", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId"),
  source: mysqlEnum("source", ["Public", "ParticipantPortal"]).notNull(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  businessName: varchar("businessName", { length: 255 }),
  preferredPackage: varchar("preferredPackage", { length: 64 }),
  note: text("note"),
  notificationStatus: mysqlEnum("notificationStatus", ["Sent", "Failed", "Simulated"]).default("Sent").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PricingRequest = typeof pricingRequests.$inferSelect;

/** Applicant registrations and their onboarding, payment, and diagnostic state. */
export const registrations = mysqlTable("registrations", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  businessName: varchar("businessName", { length: 255 }).notNull(),
  businessDescription: text("businessDescription").notNull(),
  businessModel: mysqlEnum("businessModel", ["Maker", "Trader", "Expert"]).notNull(),
  package: mysqlEnum("package", ["Foundation", "Engine Room", "Boardroom"]).notNull(),
  question: text("question"),
  status: mysqlEnum("status", ["Pending", "Accepted", "Rejected", "Waitlisted"]).default("Pending").notNull(),
  cohortGroup: mysqlEnum("cohortGroup", ["Unassigned", "Makers", "Traders", "Experts"]).default("Unassigned").notNull(),
  depositPaid: mysqlEnum("depositPaid", ["Pending", "Paid"]).default("Pending").notNull(),
  instalment1: mysqlEnum("instalment1", ["Pending", "Paid"]).default("Pending").notNull(),
  instalment2: mysqlEnum("instalment2", ["Pending", "Paid"]).default("Pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  bookingToken: varchar("bookingToken", { length: 64 }),
  diagnosticData: text("diagnosticData"),
  diagnosticStage: varchar("diagnosticStage", { length: 64 }),
  diagnosticEngineRoom: varchar("diagnosticEngineRoom", { length: 128 }),
  diagnosticClasses: varchar("diagnosticClasses", { length: 255 }),
  /** Points to the retained highest-pathway registration when an earlier pathway entry is superseded. */
  supersededByRegistrationId: int("supersededByRegistrationId"),
  /** Non-destructive removal from the active owner desk; the original engagement record remains intact. */
  archivedAt: timestamp("archivedAt"),
  archivedByUserId: int("archivedByUserId"),
});

export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = typeof registrations.$inferInsert;

/** One private, non-guessable share code per canonical JUMP participant. */
export const participantReferralProfiles = mysqlTable("participant_referral_profiles", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull().unique(),
  referralCode: varchar("referralCode", { length: 64 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ParticipantReferralProfile = typeof participantReferralProfiles.$inferSelect;

/** A referral attribution and owner-reviewed credit decision; programme balances are never changed automatically. */
export const participantReferrals = mysqlTable("participant_referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerRegistrationId: int("referrerRegistrationId").notNull(),
  referredRegistrationId: int("referredRegistrationId").notNull().unique(),
  referralCode: varchar("referralCode", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["Registered", "Qualified", "Approved", "Declined"]).default("Registered").notNull(),
  creditPercentage: int("creditPercentage").default(0).notNull(),
  reviewedByUserId: int("reviewedByUserId"),
  reviewedAt: timestamp("reviewedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ParticipantReferral = typeof participantReferrals.$inferSelect;

/**
 * Programme-level record derived from a registration. The original registration is preserved
 * as a JSON snapshot so future diagnostic phases can pre-fill rather than re-ask it.
 */
export const participantProgrammeRecords = mysqlTable("participant_programme_records", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull().unique(),
  registrationSnapshot: text("registrationSnapshot").notNull(),
  paymentStructure: mysqlEnum("paymentStructure", ["instalments_40_30_30", "full_upfront_10pc_discount"]),
  paymentMethod: mysqlEnum("paymentMethod", ["bank_transfer", "paystack", "wants_to_discuss"]),
  paymentStatus: mysqlEnum("paymentStatus", ["awaiting", "partial", "complete"]).default("awaiting").notNull(),
  currentPhase: int("currentPhase").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ParticipantProgrammeRecord = typeof participantProgrammeRecords.$inferSelect;
export type InsertParticipantProgrammeRecord = typeof participantProgrammeRecords.$inferInsert;

/** Immutable audit history for participant tracker states; records are appended, never replaced. */
export const participantProgrammeMilestoneEvents = mysqlTable("participant_programme_milestone_events", {
  id: int("id").autoincrement().primaryKey(),
  programmeRecordId: int("programmeRecordId").notNull(),
  phase: int("phase").notNull(),
  milestone: varchar("milestone", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["locked", "available", "in_progress", "complete"]).notNull(),
  source: mysqlEnum("source", ["system", "participant", "admin"]).default("system").notNull(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type ParticipantProgrammeMilestoneEvent = typeof participantProgrammeMilestoneEvents.$inferSelect;
export type InsertParticipantProgrammeMilestoneEvent = typeof participantProgrammeMilestoneEvents.$inferInsert;

/** Bookable programme session slots. */
export const scheduleSlots = mysqlTable("schedule_slots", {
  id: int("id").autoincrement().primaryKey(),
  kind: mysqlEnum("kind", ["Decide", "Learn", "Apply"]).notNull(),
  sessionNumber: int("sessionNumber").default(1).notNull(),
  startAt: timestamp("startAt").notNull(),
  endAt: timestamp("endAt").notNull(),
  timezone: varchar("timezone", { length: 64 }).default("Africa/Lagos").notNull(),
  capacity: int("capacity").default(1).notNull(),
  bookedCount: int("bookedCount").default(0).notNull(),
  status: mysqlEnum("status", ["Open", "Booked", "Blocked"]).default("Open").notNull(),
  googleCalendarEventId: varchar("googleCalendarEventId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduleSlot = typeof scheduleSlots.$inferSelect;
export type InsertScheduleSlot = typeof scheduleSlots.$inferInsert;

/** Participant reservations against programme session slots. */
export const scheduleBookings = mysqlTable("schedule_bookings", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(),
  slotId: int("slotId").notNull(),
  kind: mysqlEnum("kind", ["Decide", "Learn", "Apply"]).notNull(),
  status: mysqlEnum("status", ["Confirmed", "Cancelled"]).default("Confirmed").notNull(),
  calendarStatus: mysqlEnum("calendarStatus", ["Created", "Pending", "Failed", "NotConfigured"]).default("NotConfigured").notNull(),
  googleCalendarEventId: varchar("googleCalendarEventId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduleBooking = typeof scheduleBookings.$inferSelect;
export type InsertScheduleBooking = typeof scheduleBookings.$inferInsert;

/** Durable audit and deduplication record for automated session reminders. */
export const scheduledReminderDeliveries = mysqlTable("scheduled_reminder_deliveries", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  reminderType: mysqlEnum("reminderType", ["24h"]).notNull(),
  deliveryKey: varchar("deliveryKey", { length: 255 }).notNull().unique(),
  status: mysqlEnum("status", ["Pending", "Sent", "Failed"]).default("Pending").notNull(),
  emailLogId: int("emailLogId"),
  attemptedAt: timestamp("attemptedAt").defaultNow().notNull(),
  sentAt: timestamp("sentAt"),
  errorMessage: text("errorMessage"),
});

export type ScheduledReminderDelivery = typeof scheduledReminderDeliveries.$inferSelect;
export type InsertScheduledReminderDelivery = typeof scheduledReminderDeliveries.$inferInsert;

/** Engagement briefs uploaded by an administrator for an individual participant. */
export const participantBriefs = mysqlTable("participant_briefs", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 64 }).default("pdf").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ParticipantBrief = typeof participantBriefs.$inferSelect;
export type InsertParticipantBrief = typeof participantBriefs.$inferInsert;

/** Immutable participant acknowledgements of a versioned personalised portal brief. */
export const participantEngagementConsents = mysqlTable("participant_engagement_consents", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(),
  briefVersion: varchar("briefVersion", { length: 32 }).notNull(),
  packageName: mysqlEnum("packageName", ["Foundation", "Engine Room", "Boardroom"]).notNull(),
  consentStatement: text("consentStatement").notNull(),
  acknowledgedAt: timestamp("acknowledgedAt").notNull(),
  confirmationEmailStatus: mysqlEnum("confirmationEmailStatus", ["Sent", "Failed", "Simulated"]).default("Simulated").notNull(),
  confirmationEmailMessageId: varchar("confirmationEmailMessageId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ParticipantEngagementConsent = typeof participantEngagementConsents.$inferSelect;
export type InsertParticipantEngagementConsent = typeof participantEngagementConsents.$inferInsert;

/** Hashed single-use email-authentication tokens and participant browser sessions. */
export const participantAuthTokens = mysqlTable("participant_auth_tokens", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  purpose: mysqlEnum("purpose", ["magic_link", "session"]).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ParticipantAuthToken = typeof participantAuthTokens.$inferSelect;
export type InsertParticipantAuthToken = typeof participantAuthTokens.$inferInsert;

/** Password credentials for a JUMP participant. Plaintext passwords are never retained. */
export const participantCredentials = mysqlTable("participant_credentials", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 512 }).notNull(),
  failedAttempts: int("failedAttempts").default(0).notNull(),
  lockedUntil: timestamp("lockedUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ParticipantCredential = typeof participantCredentials.$inferSelect;

/** Short-lived, single-use links used only to set or reset a participant password. */
export const participantPasswordTokens = mysqlTable("participant_password_tokens", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  purpose: mysqlEnum("purpose", ["setup", "reset"]).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  consumedAt: timestamp("consumedAt"),
  revokedAt: timestamp("revokedAt"),
  deliveryStatus: mysqlEnum("deliveryStatus", ["Sent", "Failed", "Simulated"]).default("Simulated").notNull(),
  deliveryMessageId: varchar("deliveryMessageId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ParticipantPasswordToken = typeof participantPasswordTokens.$inferSelect;

/**
 * Durable personal portal URLs. Only a SHA-256 token hash is stored; replacing a
 * link revokes the previous bearer link and the participant's browser sessions.
 */
export const participantPortalLinks = mysqlTable("participant_portal_links", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull().unique(),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  revokedAt: timestamp("revokedAt"),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ParticipantPortalLink = typeof participantPortalLinks.$inferSelect;
export type InsertParticipantPortalLink = typeof participantPortalLinks.$inferInsert;

/** Participant-uploaded assignments and completed work. */
export const participantAssignments = mysqlTable("participant_assignments", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ParticipantAssignment = typeof participantAssignments.$inferSelect;
export type InsertParticipantAssignment = typeof participantAssignments.$inferInsert;

/** Participant-submitted proof of bank transfer. An owner decision is always required before payment is confirmed. */
export const participantPaymentReceipts = mysqlTable("participant_payment_receipts", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(),
  paymentMilestone: mysqlEnum("paymentMilestone", ["deposit", "instalment_1", "instalment_2", "full_upfront"]).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  participantNote: text("participantNote"),
  status: mysqlEnum("status", ["Submitted", "Confirmed", "Declined"]).default("Submitted").notNull(),
  reviewedByUserId: int("reviewedByUserId"),
  reviewedAt: timestamp("reviewedAt"),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ParticipantPaymentReceipt = typeof participantPaymentReceipts.$inferSelect;
export type InsertParticipantPaymentReceipt = typeof participantPaymentReceipts.$inferInsert;
/** Current State Assessment responses retained for each participant. */
export const currentStatusAssessments = mysqlTable("current_status_assessments", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(),
  businessModelSummary: text("businessModelSummary"),
  currentRevenueStage: varchar("currentRevenueStage", { length: 100 }),
  primaryBottleNeck: text("primaryBottleNeck"),
  teamAndOperations: text("teamAndOperations"),
  financialVisibility: text("financialVisibility"),
  desiredSixMonthOutcome: text("desiredSixMonthOutcome"),
  additionalNotes: text("additionalNotes"),
  /** Versioned JSON state for the staged, tap-first diagnostic. Legacy fields remain intact for existing records. */
  structuredDiagnostic: text("structuredDiagnostic"),
  diagnosticVersion: int("diagnosticVersion").default(1).notNull(),
  activeSection: varchar("activeSection", { length: 32 }),
  status: mysqlEnum("status", ["Draft", "Submitted"]).default("Draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CurrentStatusAssessment = typeof currentStatusAssessments.$inferSelect;
export type InsertCurrentStatusAssessment = typeof currentStatusAssessments.$inferInsert;

/** AI-guided assessment conversation history. */
export const consultingChatMessages = mysqlTable("consulting_chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(),
  sender: mysqlEnum("sender", ["ai", "participant"]).notNull(),
  content: text("content").notNull(),
  topicTag: varchar("topicTag", { length: 100 }),
  structuredData: text("structuredData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConsultingChatMessage = typeof consultingChatMessages.$inferSelect;
export type InsertConsultingChatMessage = typeof consultingChatMessages.$inferInsert;

/** AI-generated current-state assessment reports. */
export const consultingReports = mysqlTable("consulting_reports", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(),
  summaryJson: text("summaryJson").notNull(),
  status: mysqlEnum("status", ["Draft", "Ready"]).default("Ready").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ConsultingReport = typeof consultingReports.$inferSelect;
export type InsertConsultingReport = typeof consultingReports.$inferInsert;

/**
 * Completed business checks from the public site. Answers are stored as given (after cleaning);
 * the result is recomputed on the server so the outline can never be set by the browser.
 * publicToken lets the owner ask for the call or the full report without signing in.
 */
export const businessChecks = mysqlTable("business_checks", {
  id: int("id").autoincrement().primaryKey(),
  publicToken: varchar("publicToken", { length: 64 }).notNull().unique(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 32 }),
  businessName: varchar("businessName", { length: 255 }),
  description: varchar("description", { length: 500 }),
  stage: varchar("stage", { length: 16 }).notNull(),
  route: mysqlEnum("route", ["advisory", "programme", "foundation", "idea"]).notNull(),
  readiness: mysqlEnum("readiness", ["advanced", "intermediate", "nascent"]).notNull(),
  primaryArea: int("primaryArea"),
  answersJson: text("answersJson").notNull(),
  resultJson: text("resultJson").notNull(),
  summaryJson: text("summaryJson").notNull(),
  summarySource: mysqlEnum("summarySource", ["AI", "Rules"]).notNull(),
  notificationStatus: mysqlEnum("notificationStatus", ["Sent", "Failed", "Simulated"]).default("Simulated").notNull(),
  callRequestedAt: timestamp("callRequestedAt"),
  reportRequestedAt: timestamp("reportRequestedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BusinessCheck = typeof businessChecks.$inferSelect;
export type InsertBusinessCheck = typeof businessChecks.$inferInsert;
