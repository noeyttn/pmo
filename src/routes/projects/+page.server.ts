import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { projects } from '#lib/server/db/schema.js';
import { requireAdmin } from '#lib/server/auth.js';
import { logActivity } from '#lib/server/activity.js';
import { taskRows } from '#lib/server/queries.js';
import { timeState } from '#lib/tasks.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [list, rows] = await Promise.all([locals.db.select().from(projects), taskRows(locals.db)]);
	return {
		projects: list.map((p) => {
			const ts = rows.filter((t) => t.projectId === p.id);
			const done = ts.filter((t) => t.status === 'done').length;
			return {
				...p,
				total: ts.length,
				done,
				doing: ts.filter((t) => t.status === 'doing').length,
				overdue: ts.filter((t) => timeState(t) === 'overdue').length,
				avgProgress: ts.length ? Math.round(ts.reduce((s, t) => s + t.progress, 0) / ts.length) : 0,
				nextDue: ts
					.filter((t) => t.status !== 'done' && t.dueDate)
					.map((t) => t.dueDate!)
					.sort()[0]
			};
		})
	};
};

export const actions: Actions = {
	create: async (event) => {
		const me = requireAdmin(event);
		const form = await event.request.formData();
		const name = String(form.get('name') ?? '').trim();
		const description = String(form.get('description') ?? '').trim() || null;
		if (!name) return fail(400, { message: 'กรุณาระบุชื่อโปรเจกต์' });
		const db = event.locals.db;
		const [dup] = await db.select().from(projects).where(eq(projects.name, name));
		if (dup) return fail(400, { message: 'มีโปรเจกต์ชื่อนี้แล้ว' });
		const [p] = await db.insert(projects).values({ name, description }).returning();
		await logActivity(db, {
			userId: me.id, entity: 'project', entityId: p.id, entityLabel: p.name, action: 'create',
			changes: { name: [null, name], description: [null, description] }
		});
		return { created: true };
	}
};
