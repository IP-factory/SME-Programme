CREATE TABLE `participant_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `participant_assignments_id` PRIMARY KEY(`id`)
);
