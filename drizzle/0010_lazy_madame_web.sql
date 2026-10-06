CREATE TABLE `participant_programme_milestone_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`programmeRecordId` int NOT NULL,
	`phase` int NOT NULL,
	`milestone` varchar(128) NOT NULL,
	`status` enum('locked','available','in_progress','complete') NOT NULL,
	`source` enum('system','participant','admin') NOT NULL DEFAULT 'system',
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `participant_programme_milestone_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `participant_programme_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`registrationSnapshot` text NOT NULL,
	`paymentStructure` enum('instalments_40_30_30','full_upfront_10pc_discount'),
	`paymentMethod` enum('bank_transfer','paystack','wants_to_discuss'),
	`paymentStatus` enum('awaiting','partial','complete') NOT NULL DEFAULT 'awaiting',
	`currentPhase` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `participant_programme_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `participant_programme_records_registrationId_unique` UNIQUE(`registrationId`)
);
