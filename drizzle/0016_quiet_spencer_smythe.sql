ALTER TABLE `registrations` ADD `archivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `registrations` ADD `archivedAt` timestamp NULL;
ALTER TABLE `registrations` ADD `archivedByUserId` int;
