import { error, fail } from '@sveltejs/kit';
import { and, eq, ne } from 'drizzle-orm';
import { projects } from '#lib/server/db/schema.js';
import { requireAdmin } from '#lib/server/auth.js';
import { diff, logActivity } from '#lib/server/activity.js';
import { taskRows } from '#lib/server/queries.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const id = Number(params.id);
	const [project] = await locals.db.select().from(projects).where(eq(projects.id, id));
	if (!project) error(404, 'ไม่พบโปรเจกต์');
	const tasks = (await taskRows(locals.db)).filter((t) => t.projectId === id);
	return { project, tasks };
};

export const actions: Actions = {
	update: async (event) => {
		const me = requireAdmin(event);
		const db = event.locals.db;
		const id = Number(event.params.id);
		const [p] = await db.select().from(projects).where(eq(projects.id, id));
		if (!p) error(404);
		const form = await event.request.formData();
		const values = {
			name: String(form.get('name') ?? '').trim(),
			description: String(form.get('description') ?? '').trim() || null,
			archived: form.get('archived') === 'on'
		};
		if (!values.name) return fail(400, { message: 'กรุณาระบุชื่อ' });
		const [dup] = await db.select().from(projects).where(and(eq(projects.name, values.name), ne(projects.id, id)));
		if (dup) return fail(400, { message: 'มีโปรเจกต์ชื่อนี้แล้ว' });
		const changes = diff(p, values);
		if (Object.keys(changes).length) {
			await db.update(projects).set(values).where(eq(projects.id, id));
			await logActivity(db, { userId: me.id, entity: 'project', entityId: id, entityLabel: values.name, action: 'update', changes });
		}
		return { saved: true };
	}
};
