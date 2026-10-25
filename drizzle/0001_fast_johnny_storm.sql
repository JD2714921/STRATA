CREATE TABLE `operation_locks` (
	`owner_id` text NOT NULL,
	`resource` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `operations_owner_lock` ON `operation_locks` (`owner_id`,`resource`);--> statement-breakpoint
CREATE TABLE `operation_outbox` (
	`owner_id` text NOT NULL,
	`record_key` text NOT NULL,
	`desired_hash` text NOT NULL,
	`payload` text NOT NULL,
	`state` text NOT NULL,
	`remote_id` text,
	`updated_at` text NOT NULL,
	`error` text,
	`claim_token` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `operations_notion_key` ON `operation_outbox` (`owner_id`,`record_key`);--> statement-breakpoint
CREATE TABLE `operation_records` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`kind` text NOT NULL,
	`record_key` text NOT NULL,
	`created_at` text NOT NULL,
	`payload` text NOT NULL,
	`content_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `operations_record_revision` ON `operation_records` (`owner_id`,`kind`,`record_key`,`content_hash`);--> statement-breakpoint
CREATE INDEX `operations_record_lookup` ON `operation_records` (`owner_id`,`kind`,`record_key`,`created_at`);--> statement-breakpoint
CREATE TABLE `operation_runs` (
	`owner_id` text NOT NULL,
	`run_id` text NOT NULL,
	`phase` text NOT NULL,
	`input_hash` text NOT NULL,
	`state` text NOT NULL,
	`attempts` integer NOT NULL,
	`updated_at` text NOT NULL,
	`payload` text,
	`error` text,
	`retry_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `operations_occurrence_phase` ON `operation_runs` (`owner_id`,`run_id`,`phase`);