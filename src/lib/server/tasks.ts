import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { DB } from './db';
import { activityLog, tasks, TASK_PRIORITIES, TASK_STATUSES, type Task } from './db/schema';
import type { SessionUser } from './auth';
import { diff, logActivity } from './activity';

/** Fields an assignee may change on their own task; admins may change everything. */
const MEMBER_FIELDS = ['status', 'progress', 'actualHours', 'note'] as const;
const ADMIN_FIELDS = [
	...MEMBER_FIELDS,
	'title',
	'projectId',
	'assigneeId',
	'priority',
	'startDate',
	'dueDate',
	'estHours'
] as const;
export type TaskPatch = Partial<Pick<Task, (typeof ADMIN_FIELDS)[number]>>;

export function canEditTask(user: SessionUser, task: Pick<Task, 'assigneeId'>) {
	return user.role === 'admin' || task.assigneeId === user.id;
}

/** Parse a task form into a patch, ignoring fields that weren't submitted. */
export function parseTaskForm(form: FormData): TaskPatch {
	const patch: TaskPatch = {};
	const s = (k: string) => (form.has(k) ? String(form.get(k) ?? '').trim() : undefined);
	const n = (k: string) => (form.has(k) ? Number(form.get(k)) || 0 : undefined);

	const status = s('status');
	if (status !== undefined) {
		if (!TASK_STATUSES.includes(status as never)) error(400, 'สถานะไม่ถูกต้อง');
		patch.status = status as Task['status'];
	}
	const priority = s('priority');
	if (priority !== undefined) {
		if (!TASK_PRIORITIES.includes(priority as never)) error(400, 'ความสำคัญไม่ถูกต้อง');
		patch.priority = priority as Task['priority'];
	}
	const title = s('title');
	if (title !== undefined) {
		if (!title) error(400, 'กรุณาระบุชื่องาน');
		patch.title = title;
	}
	if (form.has('projectId')) patch.projectId = n('projectId');
	if (form.has('assigneeId')) patch.assigneeId = n('assigneeId') || null;
	if (form.has('startDate')) patch.startDate = s('startDate') || null;
	if (form.has('dueDate')) patch.dueDate = s('dueDate') || null;
	if (form.has('estHours')) patch.estHours = Math.max(0, n('estHours')!);
	if (form.has('actualHours')) patch.actualHours = Math.max(0, n('actualHours')!);
	if (form.has('progress')) patch.progress = Math.min(100, Math.max(0, Math.round(n('progress')!)));
	if (form.has('note')) patch.note = s('note') || null;
	return patch;
}

/** Apply a patch with permission checks, keep status/progress consistent, and log the diff. */
export async function updateTask(db: DB, user: SessionUser, id: number, patch: TaskPatch, action: 'update' | 'revert' = 'update') {
	const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
	if (!task) error(404, 'ไม่พบงาน');
	if (!canEditTask(user, task)) error(403, 'แก้ไขได้เฉพาะงานของตัวเอง');

	const allowed: readonly string[] = user.role === 'admin' ? ADMIN_FIELDS : MEMBER_FIELDS;
	const clean = Object.fromEntries(Object.entries(patch).filter(([k]) => allowed.includes(k))) as TaskPatch;

	if (action === 'update') {
		if (clean.status === 'done' && task.status !== 'done' && clean.progress === undefined) clean.progress = 100;
		if (clean.status && clean.status !== 'done' && task.status === 'done' && (clean.progress ?? task.progress) === 100)
			clean.progress = 90;
	}

	const changes = diff(task, clean);
	if (Object.keys(changes).length === 0) return task;

	const [updated] = await db
		.update(tasks)
		.set({ ...clean, updatedAt: new Date() })
		.where(eq(tasks.id, id))
		.returning();
	await logActivity(db, {
		userId: user.id,
		entity: 'task',
		entityId: id,
		entityLabel: `${updated.code} ${updated.title}`,
		action,
		changes
	});
	return updated;
}

/** Restore the "before" values recorded in a task activity entry (admin only). */
export async function revertTaskActivity(db: DB, user: SessionUser, activityId: number) {
	if (user.role !== 'admin') error(403, 'เฉพาะ Admin ที่ย้อนกลับได้');
	const [entry] = await db.select().from(activityLog).where(eq(activityLog.id, activityId));
	if (!entry || entry.entity !== 'task' || !entry.changes) error(404, 'ไม่พบรายการ');
	if (entry.action !== 'update' && entry.action !== 'revert') error(400, 'ย้อนกลับได้เฉพาะรายการแก้ไข');
	const patch = Object.fromEntries(
		Object.entries(entry.changes)
			.filter(([k]) => (ADMIN_FIELDS as readonly string[]).includes(k))
			.map(([k, [before]]) => [k, before])
	) as TaskPatch;
	return updateTask(db, user, entry.entityId, patch, 'revert');
}

export async function nextTaskCode(db: DB) {
	const rows = await db.select({ code: tasks.code }).from(tasks);
	const max = rows.reduce((m, r) => Math.max(m, Number(r.code.replace(/\D/g, '')) || 0), 0);
	return `T-${String(max + 1).padStart(3, '0')}`;
}
