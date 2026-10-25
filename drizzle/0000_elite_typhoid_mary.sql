CREATE TABLE `round1_records` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`kind` text NOT NULL,
	`version` text NOT NULL,
	`created_at` text NOT NULL,
	`payload` text NOT NULL,
	`content_hash` text NOT NULL,
	`request_id` text
);
--> statement-breakpoint
CREATE INDEX `round1_owner_kind_time_idx` ON `round1_records` (`owner_id`,`kind`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `round1_owner_request_idx` ON `round1_records` (`owner_id`,`request_id`);