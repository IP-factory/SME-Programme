CREATE TABLE `pricing_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int,
	`source` enum('Public','ParticipantPortal') NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`businessName` varchar(255),
	`preferredPackage` varchar(64),
	`note` text,
	`notificationStatus` enum('Sent','Failed','Simulated') NOT NULL DEFAULT 'Sent',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pricing_requests_id` PRIMARY KEY(`id`)
);
