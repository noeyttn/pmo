import { requireUser } from '#lib/server/auth.js';
import { lookups, taskRows } from '#lib/server/queries.js';
import { parseTaskForm, updateTask } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [tasks, lk] = await Promise.all([taskRows(locals.db), lookups(locals.db)]);
	return { tasks, ...lk };
};

export const actions: Actions = {
	move: async (event) => {
		const me = requireUser(event);
		const form = await event.request.formData();
		await updateTask(event.locals.db, me, Number(form.get('id')), parseTaskForm(form));
		return { ok: true };
	}
};
