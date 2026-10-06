ALTER TABLE `current_status_assessments` ADD `structuredDiagnostic` text;--> statement-breakpoint
ALTER TABLE `current_status_assessments` ADD `structuredDiagnostic` text;--> statement-breakpoint
ALTER TABLE `current_status_assessments` ADD `diagnosticVersion` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `current_status_assessments` ADD `activeSection` varchar(32);
