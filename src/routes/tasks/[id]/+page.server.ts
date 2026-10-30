import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { tasks } from '#lib/server/db/schema.js';
import { requireAdmin, requireUser } from '#lib/server/auth.js';
import { activityRows, logActivity } from '#lib/server/activity.js';
import { lookups, taskRows } from '#lib/server/queries.js';
import { canEditTask, parseTaskForm, revertTaskActivity, updateTask } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const id = Number(params.id);
	const [all, lk, history] = await Promise.all([
		taskRows(locals.db),
		lookups(locals.db),
		activityRows(locals.db, { entity: 'task', entityId: id, limit: 200 })
	]);
	const task = all.find((t) => t.id === id);
	if (!task) error(404, 'ไม่พบงาน');
	return { task, history, canEdit: canEditTask(locals.user!, task), ...lk };
};

export const actions: Actions = {
	update: async (event) => {
		const me = requireUser(event);
		await updateTask(event.locals.db, me, Number(event.params.id), parseTaskForm(await event.request.formData()));
		return { saved: true };
	},
	revert: async (event) => {
		const me = requireUser(event);
		const form = await event.request.formData();
		await revertTaskActivity(event.locals.db, me, Number(form.get('activityId')));
		return { reverted: true };
	},
	delete: async (event) => {
		const me = requireAdmin(event);
		const db = event.locals.db;
		const id = Number(event.params.id);
		const [t] = await db.select().from(tasks).where(eq(tasks.id, id));
		if (!t) error(404);
		await db.delete(tasks).where(eq(tasks.id, id));
		const { id: _id, createdAt: _c, updatedAt: _u, ...snapshot } = t;
		await logActivity(db, {
			userId: me.id, entity: 'task', entityId: id, entityLabel: `${t.code} ${t.title}`, action: 'delete',
			changes: Object.fromEntries(Object.entries(snapshot).map(([k, v]) => [k, [v, null]]))
		});
		redirect(303, '/tasks');
	}
};
