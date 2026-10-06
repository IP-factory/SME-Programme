CREATE TABLE `schedule_bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`slotId` int NOT NULL,
	`kind` enum('Decide','Learn','Apply') NOT NULL,
	`status` enum('Confirmed','Cancelled') NOT NULL DEFAULT 'Confirmed',
	`calendarStatus` enum('Created','Pending','Failed','NotConfigured') NOT NULL DEFAULT 'NotConfigured',
	`googleCalendarEventId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schedule_bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schedule_slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` enum('Decide','Learn','Apply') NOT NULL,
	`sessionNumber` int NOT NULL DEFAULT 1,
	`startAt` timestamp NOT NULL,
	`endAt` timestamp NOT NULL,
	`timezone` varchar(64) NOT NULL DEFAULT 'Africa/Lagos',
	`capacity` int NOT NULL DEFAULT 1,
	`bookedCount` int NOT NULL DEFAULT 0,
	`status` enum('Open','Booked','Blocked') NOT NULL DEFAULT 'Open',
	`googleCalendarEventId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schedule_slots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `registrations` ADD `bookingToken` varchar(64);--> statement-breakpoint
ALTER TABLE `registrations` ADD `diagnosticData` text;--> statement-breakpoint
ALTER TABLE `registrations` ADD `diagnosticStage` varchar(64);--> statement-breakpoint
ALTER TABLE `registrations` ADD `diagnosticEngineRoom` varchar(128);--> statement-breakpoint
ALTER TABLE `registrations` ADD `diagnosticClasses` varchar(255);