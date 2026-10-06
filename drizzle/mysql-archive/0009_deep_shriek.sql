CREATE TABLE `scheduled_reminder_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`reminderType` enum('24h') NOT NULL,
	`deliveryKey` varchar(255) NOT NULL,
	`status` enum('Pending','Sent','Failed') NOT NULL DEFAULT 'Pending',
	`emailLogId` int,
	`attemptedAt` timestamp NOT NULL DEFAULT (now()),
	`sentAt` timestamp,
	`errorMessage` text,
	CONSTRAINT `scheduled_reminder_deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `scheduled_reminder_deliveries_deliveryKey_unique` UNIQUE(`deliveryKey`)
);
