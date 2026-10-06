CREATE TABLE `participant_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`passwordHash` varchar(512) NOT NULL,
	`failedAttempts` int NOT NULL DEFAULT 0,
	`lockedUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `participant_credentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `participant_credentials_registrationId_unique` UNIQUE(`registrationId`)
);
--> statement-breakpoint
CREATE TABLE `participant_password_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`purpose` enum('setup','reset') NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`consumedAt` timestamp,
	`revokedAt` timestamp,
	`deliveryStatus` enum('Sent','Failed','Simulated') NOT NULL DEFAULT 'Simulated',
	`deliveryMessageId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `participant_password_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `participant_password_tokens_tokenHash_unique` UNIQUE(`tokenHash`)
);
