CREATE TABLE `participant_referral_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`referralCode` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `participant_referral_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `participant_referral_profiles_registrationId_unique` UNIQUE(`registrationId`),
	CONSTRAINT `participant_referral_profiles_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `participant_referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerRegistrationId` int NOT NULL,
	`referredRegistrationId` int NOT NULL,
	`referralCode` varchar(64) NOT NULL,
	`status` enum('Registered','Qualified','Approved','Declined') NOT NULL DEFAULT 'Registered',
	`creditPercentage` int NOT NULL DEFAULT 0,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `participant_referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `participant_referrals_referredRegistrationId_unique` UNIQUE(`referredRegistrationId`)
);
