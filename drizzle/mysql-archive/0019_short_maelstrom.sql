CREATE TABLE `admin_password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`consumedAt` timestamp,
	`revokedAt` timestamp,
	`deliveryStatus` enum('Sent','Failed','Simulated') NOT NULL DEFAULT 'Simulated',
	`deliveryMessageId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_password_reset_tokens_tokenHash_unique` UNIQUE(`tokenHash`)
);
