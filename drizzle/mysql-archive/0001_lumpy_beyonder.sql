CREATE TABLE `email_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`status` enum('Sent','Failed','Simulated') NOT NULL DEFAULT 'Sent',
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`businessDescription` text NOT NULL,
	`businessModel` enum('Maker','Trader','Expert') NOT NULL,
	`package` enum('Foundation','Engine Room','Boardroom') NOT NULL,
	`question` text,
	`status` enum('Pending','Accepted','Rejected','Waitlisted') NOT NULL DEFAULT 'Pending',
	`cohortGroup` enum('Unassigned','Makers','Traders','Experts') NOT NULL DEFAULT 'Unassigned',
	`depositPaid` enum('Pending','Paid') NOT NULL DEFAULT 'Pending',
	`instalment1` enum('Pending','Paid') NOT NULL DEFAULT 'Pending',
	`instalment2` enum('Pending','Paid') NOT NULL DEFAULT 'Pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `registrations_id` PRIMARY KEY(`id`)
);
