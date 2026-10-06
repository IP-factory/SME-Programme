CREATE TABLE `consulting_chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`sender` enum('ai','participant') NOT NULL,
	`content` text NOT NULL,
	`topicTag` varchar(100),
	`structuredData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consulting_chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consulting_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`summaryJson` text NOT NULL,
	`status` enum('Draft','Ready') NOT NULL DEFAULT 'Ready',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consulting_reports_id` PRIMARY KEY(`id`)
);
