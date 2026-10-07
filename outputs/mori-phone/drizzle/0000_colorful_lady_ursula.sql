CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `phone_states` (
	`user_id` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rate_windows` (
	`user_id` text PRIMARY KEY NOT NULL,
	`window` integer NOT NULL,
	`count` integer NOT NULL
);
