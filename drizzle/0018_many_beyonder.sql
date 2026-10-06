CREATE TABLE `participant_payment_receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`paymentMilestone` enum('deposit','instalment_1','instalment_2','full_upfront') NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`participantNote` text,
	`status` enum('Submitted','Confirmed','Declined') NOT NULL DEFAULT 'Submitted',
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `participant_payment_receipts_id` PRIMARY KEY(`id`)
);
