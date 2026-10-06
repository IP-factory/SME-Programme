CREATE TABLE `participant_auth_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`purpose` enum('magic_link','session') NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `participant_auth_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `participant_auth_tokens_tokenHash_unique` UNIQUE(`tokenHash`)
);
