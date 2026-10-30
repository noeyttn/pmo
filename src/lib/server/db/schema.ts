import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const now = sql`(unixepoch() * 1000)`;

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: text('role', { enum: ['admin', 'member'] }).notNull().default('member'),
	position: text('position'),
	duties: text('duties'),
	level: text('level'),
	startDate: text('start_date'), // YYYY-MM-DD
	active: integer('active', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(now)
});

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull()
});

export const projects = sqliteTable('projects', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull().unique(),
	description: text('description'),
	archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(now)
});

export const TASK_STATUSES = ['todo', 'doing', 'done'] as const;
export const TASK_PRIORITIES = ['high', 'medium', 'low'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const tasks = sqliteTable(
	'tasks',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		code: text('code').notNull().unique(),
		projectId: integer('project_id')
			.notNull()
			.references(() => projects.id),
		title: text('title').notNull(),
		assigneeId: integer('assignee_id').references(() => users.id),
		priority: text('priority', { enum: TASK_PRIORITIES }).notNull().default('medium'),
		status: text('status', { enum: TASK_STATUSES }).notNull().default('todo'),
		startDate: text('start_date'),
		dueDate: text('due_date'),
		estHours: real('est_hours').notNull().default(0),
		actualHours: real('actual_hours').notNull().default(0),
		progress: integer('progress').notNull().default(0), // 0-100
		note: text('note'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(now),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(now)
	},
	(t) => [index('tasks_assignee_idx').on(t.assigneeId), index('tasks_project_idx').on(t.projectId)]
);

/**
 * Append-only audit trail. `changes` holds { field: [before, after] } so any
 * update can be inspected and reverted later.
 */
export const activityLog = sqliteTable(
	'activity_log',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		userId: integer('user_id').references(() => users.id),
		entity: text('entity', { enum: ['task', 'project', 'user'] }).notNull(),
		entityId: integer('entity_id').notNull(),
		entityLabel: text('entity_label').notNull(),
		action: text('action', { enum: ['create', 'update', 'delete', 'revert'] }).notNull(),
		changes: text('changes', { mode: 'json' }).$type<Record<string, [unknown, unknown]>>(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(now)
	},
	(t) => [index('activity_entity_idx').on(t.entity, t.entityId), index('activity_created_idx').on(t.createdAt)]
);

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Activity = typeof activityLog.$inferSelect;
