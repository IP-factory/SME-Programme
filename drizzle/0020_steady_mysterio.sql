CREATE TABLE `inbound_email_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`mailboxMessageId` varchar(255) NOT NULL,
	`mailboxThreadId` varchar(255),
	`senderEmail` varchar(320) NOT NULL,
	`senderName` varchar(255),
	`subject` varchar(255) NOT NULL,
	`preview` text NOT NULL,
	`body` text NOT NULL,
	`receivedAt` timestamp NOT NULL,
	`status` enum('New','Reviewed','Follow-up','Closed') NOT NULL DEFAULT 'New',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inbound_email_replies_id` PRIMARY KEY(`id`),
	CONSTRAINT `inbound_email_replies_mailboxMessageId_unique` UNIQUE(`mailboxMessageId`)
);
