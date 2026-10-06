CREATE TABLE `current_status_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`businessModelSummary` text,
	`currentRevenueStage` varchar(100),
	`primaryBottleNeck` text,
	`teamAndOperations` text,
	`financialVisibility` text,
	`desiredSixMonthOutcome` text,
	`additionalNotes` text,
	`status` enum('Draft','Submitted') NOT NULL DEFAULT 'Draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `current_status_assessments_id` PRIMARY KEY(`id`)
);
