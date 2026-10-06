CREATE TYPE "public"."admin_invitations_delivery_status" AS ENUM('Sent', 'Failed', 'Simulated');--> statement-breakpoint
CREATE TYPE "public"."admin_invitations_status" AS ENUM('Pending', 'Accepted', 'Revoked', 'Expired');--> statement-breakpoint
CREATE TYPE "public"."admin_password_reset_tokens_delivery_status" AS ENUM('Sent', 'Failed', 'Simulated');--> statement-breakpoint
CREATE TYPE "public"."business_checks_notification_status" AS ENUM('Sent', 'Failed', 'Simulated');--> statement-breakpoint
CREATE TYPE "public"."business_checks_readiness" AS ENUM('advanced', 'intermediate', 'nascent');--> statement-breakpoint
CREATE TYPE "public"."business_checks_route" AS ENUM('advisory', 'programme', 'foundation', 'idea');--> statement-breakpoint
CREATE TYPE "public"."business_checks_summary_source" AS ENUM('AI', 'Rules');--> statement-breakpoint
CREATE TYPE "public"."consulting_chat_messages_sender" AS ENUM('ai', 'participant');--> statement-breakpoint
CREATE TYPE "public"."consulting_reports_status" AS ENUM('Draft', 'Ready');--> statement-breakpoint
CREATE TYPE "public"."current_status_assessments_status" AS ENUM('Draft', 'Submitted');--> statement-breakpoint
CREATE TYPE "public"."email_logs_status" AS ENUM('Sent', 'Failed', 'Simulated');--> statement-breakpoint
CREATE TYPE "public"."inbound_email_replies_status" AS ENUM('New', 'Reviewed', 'Follow-up', 'Closed');--> statement-breakpoint
CREATE TYPE "public"."participant_auth_tokens_purpose" AS ENUM('magic_link', 'session');--> statement-breakpoint
CREATE TYPE "public"."participant_engagement_consents_confirmation_email_status" AS ENUM('Sent', 'Failed', 'Simulated');--> statement-breakpoint
CREATE TYPE "public"."participant_engagement_consents_package_name" AS ENUM('Foundation', 'Engine Room', 'Boardroom');--> statement-breakpoint
CREATE TYPE "public"."participant_password_tokens_delivery_status" AS ENUM('Sent', 'Failed', 'Simulated');--> statement-breakpoint
CREATE TYPE "public"."participant_password_tokens_purpose" AS ENUM('setup', 'reset');--> statement-breakpoint
CREATE TYPE "public"."participant_payment_receipts_payment_milestone" AS ENUM('deposit', 'instalment_1', 'instalment_2', 'full_upfront');--> statement-breakpoint
CREATE TYPE "public"."participant_payment_receipts_status" AS ENUM('Submitted', 'Confirmed', 'Declined');--> statement-breakpoint
CREATE TYPE "public"."participant_programme_milestone_events_source" AS ENUM('system', 'participant', 'admin');--> statement-breakpoint
CREATE TYPE "public"."participant_programme_milestone_events_status" AS ENUM('locked', 'available', 'in_progress', 'complete');--> statement-breakpoint
CREATE TYPE "public"."participant_programme_records_payment_method" AS ENUM('bank_transfer', 'paystack', 'wants_to_discuss');--> statement-breakpoint
CREATE TYPE "public"."participant_programme_records_payment_status" AS ENUM('awaiting', 'partial', 'complete');--> statement-breakpoint
CREATE TYPE "public"."participant_programme_records_payment_structure" AS ENUM('instalments_40_30_30', 'full_upfront_10pc_discount');--> statement-breakpoint
CREATE TYPE "public"."participant_referrals_status" AS ENUM('Registered', 'Qualified', 'Approved', 'Declined');--> statement-breakpoint
CREATE TYPE "public"."pricing_requests_notification_status" AS ENUM('Sent', 'Failed', 'Simulated');--> statement-breakpoint
CREATE TYPE "public"."pricing_requests_source" AS ENUM('Public', 'ParticipantPortal');--> statement-breakpoint
CREATE TYPE "public"."registrations_business_model" AS ENUM('Maker', 'Trader', 'Expert');--> statement-breakpoint
CREATE TYPE "public"."registrations_cohort_group" AS ENUM('Unassigned', 'Makers', 'Traders', 'Experts');--> statement-breakpoint
CREATE TYPE "public"."registrations_deposit_paid" AS ENUM('Pending', 'Paid');--> statement-breakpoint
CREATE TYPE "public"."registrations_instalment1" AS ENUM('Pending', 'Paid');--> statement-breakpoint
CREATE TYPE "public"."registrations_instalment2" AS ENUM('Pending', 'Paid');--> statement-breakpoint
CREATE TYPE "public"."registrations_package" AS ENUM('Foundation', 'Engine Room', 'Boardroom');--> statement-breakpoint
CREATE TYPE "public"."registrations_status" AS ENUM('Pending', 'Accepted', 'Rejected', 'Waitlisted');--> statement-breakpoint
CREATE TYPE "public"."schedule_bookings_calendar_status" AS ENUM('Created', 'Pending', 'Failed', 'NotConfigured');--> statement-breakpoint
CREATE TYPE "public"."schedule_bookings_kind" AS ENUM('Decide', 'Learn', 'Apply');--> statement-breakpoint
CREATE TYPE "public"."schedule_bookings_status" AS ENUM('Confirmed', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."schedule_slots_kind" AS ENUM('Decide', 'Learn', 'Apply');--> statement-breakpoint
CREATE TYPE "public"."schedule_slots_status" AS ENUM('Open', 'Booked', 'Blocked');--> statement-breakpoint
CREATE TYPE "public"."scheduled_reminder_deliveries_reminder_type" AS ENUM('24h');--> statement-breakpoint
CREATE TYPE "public"."scheduled_reminder_deliveries_status" AS ENUM('Pending', 'Sent', 'Failed');--> statement-breakpoint
CREATE TYPE "public"."users_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "admin_access_audit_events" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "admin_access_audit_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"actorUserId" integer,
	"action" varchar(128) NOT NULL,
	"targetEmail" varchar(320),
	"details" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_access_sessions" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "admin_access_sessions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"tokenHash" varchar(64) NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"revokedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_access_sessions_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
CREATE TABLE "admin_credentials" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "admin_credentials_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"passwordHash" varchar(512) NOT NULL,
	"failedAttempts" integer DEFAULT 0 NOT NULL,
	"lockedUntil" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_credentials_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "admin_invitations" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "admin_invitations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" varchar(320) NOT NULL,
	"inviteeName" varchar(255),
	"tokenHash" varchar(64) NOT NULL,
	"status" "admin_invitations_status" DEFAULT 'Pending' NOT NULL,
	"createdByUserId" integer NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"acceptedByUserId" integer,
	"acceptedAt" timestamp with time zone,
	"deliveryStatus" "admin_invitations_delivery_status" DEFAULT 'Simulated' NOT NULL,
	"deliveryMessageId" varchar(255),
	"proposedPermissionsJson" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_invitations_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
CREATE TABLE "admin_password_reset_tokens" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "admin_password_reset_tokens_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"tokenHash" varchar(64) NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"consumedAt" timestamp with time zone,
	"revokedAt" timestamp with time zone,
	"deliveryStatus" "admin_password_reset_tokens_delivery_status" DEFAULT 'Simulated' NOT NULL,
	"deliveryMessageId" varchar(255),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_password_reset_tokens_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
CREATE TABLE "admin_permission_profiles" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "admin_permission_profiles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"permissionsJson" text NOT NULL,
	"updatedByUserId" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_permission_profiles_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "business_checks" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "business_checks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"publicToken" varchar(64) NOT NULL,
	"fullName" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"whatsapp" varchar(32),
	"businessName" varchar(255),
	"description" varchar(500),
	"stage" varchar(16) NOT NULL,
	"route" "business_checks_route" NOT NULL,
	"readiness" "business_checks_readiness" NOT NULL,
	"primaryArea" integer,
	"answersJson" text NOT NULL,
	"resultJson" text NOT NULL,
	"summaryJson" text NOT NULL,
	"summarySource" "business_checks_summary_source" NOT NULL,
	"notificationStatus" "business_checks_notification_status" DEFAULT 'Simulated' NOT NULL,
	"callRequestedAt" timestamp with time zone,
	"reportRequestedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_checks_publicToken_unique" UNIQUE("publicToken")
);
--> statement-breakpoint
CREATE TABLE "consulting_chat_messages" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "consulting_chat_messages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"registrationId" integer NOT NULL,
	"sender" "consulting_chat_messages_sender" NOT NULL,
	"content" text NOT NULL,
	"topicTag" varchar(100),
	"structuredData" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consulting_reports" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "consulting_reports_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"registrationId" integer NOT NULL,
	"summaryJson" text NOT NULL,
	"status" "consulting_reports_status" DEFAULT 'Ready' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "current_status_assessments" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "current_status_assessments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"registrationId" integer NOT NULL,
	"businessModelSummary" text,
	"currentRevenueStage" varchar(100),
	"primaryBottleNeck" text,
	"teamAndOperations" text,
	"financialVisibility" text,
	"desiredSixMonthOutcome" text,
	"additionalNotes" text,
	"structuredDiagnostic" text,
	"diagnosticVersion" integer DEFAULT 1 NOT NULL,
	"activeSection" varchar(32),
	"status" "current_status_assessments_status" DEFAULT 'Draft' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "email_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"registrationId" integer NOT NULL,
	"recipientEmail" varchar(320) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"status" "email_logs_status" DEFAULT 'Sent' NOT NULL,
	"sentAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inbound_email_replies" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "inbound_email_replies_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"registrationId" integer NOT NULL,
	"mailboxMessageId" varchar(255) NOT NULL,
	"mailboxThreadId" varchar(255),
	"senderEmail" varchar(320) NOT NULL,
	"senderName" varchar(255),
	"subject" varchar(255) NOT NULL,
	"preview" text NOT NULL,
	"body" text NOT NULL,
	"receivedAt" timestamp with time zone NOT NULL,
	"status" "inbound_email_replies_status" DEFAULT 'New' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inbound_email_replies_mailboxMessageId_unique" UNIQUE("mailboxMessageId")
);
--> statement-breakpoint
CREATE TABLE "participant_assignments" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "participant_assignments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"registrationId" integer NOT NULL,
	"fileName" varchar(255) NOT NULL,
	"fileUrl" text NOT NULL,
	"fileKey" varchar(255) NOT NULL,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participant_auth_tokens" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "participant_auth_tokens_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"registrationId" integer NOT NULL,
	"tokenHash" varchar(64) NOT NULL,
	"purpose" "participant_auth_tokens_purpose" NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"usedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "participant_auth_tokens_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
CREATE TABLE "participant_briefs" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "participant_briefs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"registrationId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"fileUrl" text NOT NULL,
	"fileKey" varchar(255) NOT NULL,
	"fileType" varchar(64) DEFAULT 'pdf' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participant_credentials" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "participant_credentials_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"registrationId" integer NOT NULL,
	"passwordHash" varchar(512) NOT NULL,
	"failedAttempts" integer DEFAULT 0 NOT NULL,
	"lockedUntil" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "participant_credentials_registrationId_unique" UNIQUE("registrationId")
);
--> statement-breakpoint
CREATE TABLE "participant_engagement_consents" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "participant_engagement_consents_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"registrationId" integer NOT NULL,
	"briefVersion" varchar(32) NOT NULL,
	"packageName" "participant_engagement_consents_package_name" NOT NULL,
	"consentStatement" text NOT NULL,
	"acknowledgedAt" timestamp with time zone NOT NULL,
	"confirmationEmailStatus" "participant_engagement_consents_confirmation_email_status" DEFAULT 'Simulated' NOT NULL,
	"confirmationEmailMessageId" varchar(255),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participant_password_tokens" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "participant_password_tokens_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"registrationId" integer NOT NULL,
	"tokenHash" varchar(64) NOT NULL,
	"purpose" "participant_password_tokens_purpose" NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"consumedAt" timestamp with time zone,
	"revokedAt" timestamp with time zone,
	"deliveryStatus" "participant_password_tokens_delivery_status" DEFAULT 'Simulated' NOT NULL,
	"deliveryMessageId" varchar(255),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "participant_password_tokens_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
CREATE TABLE "participant_payment_receipts" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "participant_payment_receipts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"registrationId" integer NOT NULL,
	"paymentMilestone" "participant_payment_receipts_payment_milestone" NOT NULL,
	"fileName" varchar(255) NOT NULL,
	"fileUrl" text NOT NULL,
	"fileKey" varchar(255) NOT NULL,
	"participantNote" text,
	"status" "participant_payment_receipts_status" DEFAULT 'Submitted' NOT NULL,
	"reviewedByUserId" integer,
	"reviewedAt" timestamp with time zone,
	"reviewNote" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participant_portal_links" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "participant_portal_links_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"registrationId" integer NOT NULL,
	"tokenHash" varchar(64) NOT NULL,
	"revokedAt" timestamp with time zone,
	"lastUsedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "participant_portal_links_registrationId_unique" UNIQUE("registrationId"),
	CONSTRAINT "participant_portal_links_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
CREATE TABLE "participant_programme_milestone_events" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "participant_programme_milestone_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"programmeRecordId" integer NOT NULL,
	"phase" integer NOT NULL,
	"milestone" varchar(128) NOT NULL,
	"status" "participant_programme_milestone_events_status" NOT NULL,
	"source" "participant_programme_milestone_events_source" DEFAULT 'system' NOT NULL,
	"recordedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participant_programme_records" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "participant_programme_records_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"registrationId" integer NOT NULL,
	"registrationSnapshot" text NOT NULL,
	"paymentStructure" "participant_programme_records_payment_structure",
	"paymentMethod" "participant_programme_records_payment_method",
	"paymentStatus" "participant_programme_records_payment_status" DEFAULT 'awaiting' NOT NULL,
	"currentPhase" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "participant_programme_records_registrationId_unique" UNIQUE("registrationId")
);
--> statement-breakpoint
CREATE TABLE "participant_referral_profiles" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "participant_referral_profiles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"registrationId" integer NOT NULL,
	"referralCode" varchar(64) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "participant_referral_profiles_registrationId_unique" UNIQUE("registrationId"),
	CONSTRAINT "participant_referral_profiles_referralCode_unique" UNIQUE("referralCode")
);
--> statement-breakpoint
CREATE TABLE "participant_referrals" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "participant_referrals_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"referrerRegistrationId" integer NOT NULL,
	"referredRegistrationId" integer NOT NULL,
	"referralCode" varchar(64) NOT NULL,
	"status" "participant_referrals_status" DEFAULT 'Registered' NOT NULL,
	"creditPercentage" integer DEFAULT 0 NOT NULL,
	"reviewedByUserId" integer,
	"reviewedAt" timestamp with time zone,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "participant_referrals_referredRegistrationId_unique" UNIQUE("referredRegistrationId")
);
--> statement-breakpoint
CREATE TABLE "pricing_requests" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "pricing_requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"registrationId" integer,
	"source" "pricing_requests_source" NOT NULL,
	"fullName" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"businessName" varchar(255),
	"preferredPackage" varchar(64),
	"note" text,
	"notificationStatus" "pricing_requests_notification_status" DEFAULT 'Sent' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "registrations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"fullName" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"businessName" varchar(255) NOT NULL,
	"businessDescription" text NOT NULL,
	"businessModel" "registrations_business_model" NOT NULL,
	"package" "registrations_package" NOT NULL,
	"question" text,
	"status" "registrations_status" DEFAULT 'Pending' NOT NULL,
	"cohortGroup" "registrations_cohort_group" DEFAULT 'Unassigned' NOT NULL,
	"depositPaid" "registrations_deposit_paid" DEFAULT 'Pending' NOT NULL,
	"instalment1" "registrations_instalment1" DEFAULT 'Pending' NOT NULL,
	"instalment2" "registrations_instalment2" DEFAULT 'Pending' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"bookingToken" varchar(64),
	"diagnosticData" text,
	"diagnosticStage" varchar(64),
	"diagnosticEngineRoom" varchar(128),
	"diagnosticClasses" varchar(255),
	"supersededByRegistrationId" integer,
	"archivedAt" timestamp with time zone,
	"archivedByUserId" integer
);
--> statement-breakpoint
CREATE TABLE "schedule_bookings" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "schedule_bookings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"registrationId" integer NOT NULL,
	"slotId" integer NOT NULL,
	"kind" "schedule_bookings_kind" NOT NULL,
	"status" "schedule_bookings_status" DEFAULT 'Confirmed' NOT NULL,
	"calendarStatus" "schedule_bookings_calendar_status" DEFAULT 'NotConfigured' NOT NULL,
	"googleCalendarEventId" varchar(255),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_slots" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "schedule_slots_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"kind" "schedule_slots_kind" NOT NULL,
	"sessionNumber" integer DEFAULT 1 NOT NULL,
	"startAt" timestamp with time zone NOT NULL,
	"endAt" timestamp with time zone NOT NULL,
	"timezone" varchar(64) DEFAULT 'Africa/Lagos' NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"bookedCount" integer DEFAULT 0 NOT NULL,
	"status" "schedule_slots_status" DEFAULT 'Open' NOT NULL,
	"googleCalendarEventId" varchar(255),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_reminder_deliveries" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "scheduled_reminder_deliveries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"bookingId" integer NOT NULL,
	"reminderType" "scheduled_reminder_deliveries_reminder_type" NOT NULL,
	"deliveryKey" varchar(255) NOT NULL,
	"status" "scheduled_reminder_deliveries_status" DEFAULT 'Pending' NOT NULL,
	"emailLogId" integer,
	"attemptedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"sentAt" timestamp with time zone,
	"errorMessage" text,
	CONSTRAINT "scheduled_reminder_deliveries_deliveryKey_unique" UNIQUE("deliveryKey")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "users_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
