CREATE TABLE `admin_access_audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int,
	`action` varchar(128) NOT NULL,
	`targetEmail` varchar(320),
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_access_audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_access_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_access_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_access_sessions_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `admin_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`passwordHash` varchar(512) NOT NULL,
	`failedAttempts` int NOT NULL DEFAULT 0,
	`lockedUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_credentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_credentials_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `admin_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`inviteeName` varchar(255),
	`tokenHash` varchar(64) NOT NULL,
	`status` enum('Pending','Accepted','Revoked','Expired') NOT NULL DEFAULT 'Pending',
	`createdByUserId` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`acceptedByUserId` int,
	`acceptedAt` timestamp,
	`deliveryStatus` enum('Sent','Failed','Simulated') NOT NULL DEFAULT 'Simulated',
	`deliveryMessageId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_invitations_tokenHash_unique` UNIQUE(`tokenHash`)
);
