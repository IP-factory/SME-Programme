CREATE TYPE "public"."business_checks_pipeline_stage" AS ENUM('lead', 'qualified_lead', 'call_booked', 'opportunity', 'won', 'lost', 'nurture', 'referred');--> statement-breakpoint
ALTER TABLE "business_checks" ALTER COLUMN "route" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "business_checks" ALTER COLUMN "readiness" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "business_checks" ALTER COLUMN "resultJson" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "business_checks" ALTER COLUMN "summaryJson" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "business_checks" ALTER COLUMN "summarySource" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "business_checks" ADD COLUMN "pipelineStage" "business_checks_pipeline_stage" DEFAULT 'lead' NOT NULL;--> statement-breakpoint
ALTER TABLE "business_checks" ADD COLUMN "heardFrom" varchar(64);--> statement-breakpoint
ALTER TABLE "business_checks" ADD COLUMN "completedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "business_checks" ADD COLUMN "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
-- Checks saved before this migration were all finished: mark them as such.
UPDATE "business_checks" SET "pipelineStage" = CASE WHEN "callRequestedAt" IS NOT NULL THEN 'call_booked'::"business_checks_pipeline_stage" ELSE 'qualified_lead'::"business_checks_pipeline_stage" END, "completedAt" = "createdAt", "updatedAt" = "createdAt" WHERE "resultJson" IS NOT NULL;