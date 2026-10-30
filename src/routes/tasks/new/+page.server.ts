import { fail, redirect } from '@sveltejs/kit';
import { tasks } from '#lib/server/db/schema.js';
import { requireAdmin } from '#lib/server/auth.js';
import { logActivity } from '#lib/server/activity.js';
import { lookups } from '#lib/server/queries.js';
import { nextTaskCode, parseTaskForm } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return lookups(event.locals.db);
};

export const actions: Actions = {
	default: async (event) => {
		const me = requireAdmin(event);
		const db = event.locals.db;
		const patch = parseTaskForm(await event.request.formData());
		if (!patch.title || !patch.projectId) return fail(400, { message: 'กรุณาระบุชื่องานและโครงการ' });
		if (patch.status === 'done') patch.progress = 100;
		const code = await nextTaskCode(db);
		const [t] = await db
			.insert(tasks)
			.values({ ...patch, code, title: patch.title, projectId: patch.projectId })
			.returning();
		const changes = Object.fromEntries(
			Object.entries(patch).filter(([, v]) => v !== null && v !== '' && v !== 0).map(([k, v]) => [k, [null, v]])
		) as Record<string, [unknown, unknown]>;
		await logActivity(db, { userId: me.id, entity: 'task', entityId: t.id, entityLabel: `${code} ${t.title}`, action: 'create', changes });
		redirect(303, `/tasks/${t.id}`);
	}
};
