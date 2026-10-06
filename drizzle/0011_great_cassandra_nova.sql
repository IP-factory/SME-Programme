CREATE TABLE `participant_portal_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`revokedAt` timestamp,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `participant_portal_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `participant_portal_links_registrationId_unique` UNIQUE(`registrationId`),
	CONSTRAINT `participant_portal_links_tokenHash_unique` UNIQUE(`tokenHash`)
);
