CREATE TABLE `participant_engagement_consents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`briefVersion` varchar(32) NOT NULL,
	`packageName` enum('Foundation','Engine Room','Boardroom') NOT NULL,
	`consentStatement` text NOT NULL,
	`acknowledgedAt` timestamp NOT NULL,
	`confirmationEmailStatus` enum('Sent','Failed','Simulated') NOT NULL DEFAULT 'Simulated',
	`confirmationEmailMessageId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `participant_engagement_consents_id` PRIMARY KEY(`id`)
);
