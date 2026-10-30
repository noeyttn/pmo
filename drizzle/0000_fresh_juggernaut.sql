CREATE TABLE `activity_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`entity` text NOT NULL,
	`entity_id` integer NOT NULL,
	`entity_label` text NOT NULL,
	`action` text NOT NULL,
	`changes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `activity_entity_idx` ON `activity_log` (`entity`,`entity_id`);--> statement-breakpoint
CREATE INDEX `activity_created_idx` ON `activity_log` (`created_at`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_name_unique` ON `projects` (`name`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`project_id` integer NOT NULL,
	`title` text NOT NULL,
	`assignee_id` integer,
	`priority` text DEFAULT 'medium' NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`start_date` text,
	`due_date` text,
	`est_hours` real DEFAULT 0 NOT NULL,
	`actual_hours` real DEFAULT 0 NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tasks_code_unique` ON `tasks` (`code`);--> statement-breakpoint
CREATE INDEX `tasks_assignee_idx` ON `tasks` (`assignee_id`);--> statement-breakpoint
CREATE INDEX `tasks_project_idx` ON `tasks` (`project_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`position` text,
	`duties` text,
	`level` text,
	`start_date` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);