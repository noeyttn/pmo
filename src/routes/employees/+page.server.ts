import { fail } from '@sveltejs/kit';
import { asc, count, eq, ne } from 'drizzle-orm';
import { tasks, users } from '#lib/server/db/schema.js';
import { requireAdmin } from '#lib/server/auth.js';
import { hashPassword } from '#lib/server/password.js';
import { logActivity } from '#lib/server/activity.js';
import { parseEmployeeForm } from '#lib/server/employees.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const db = event.locals.db;
	const [rows, open] = await Promise.all([
		db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				role: users.role,
				position: users.position,
				level: users.level,
				active: users.active
			})
			.from(users)
			.orderBy(asc(users.id)),
		db
			.select({ assigneeId: tasks.assigneeId, n: count() })
			.from(tasks)
			.where(ne(tasks.status, 'done'))
			.groupBy(tasks.assigneeId)
	]);
	const openBy = new Map(open.map((o) => [o.assigneeId, o.n]));
	return { employees: rows.map((r) => ({ ...r, openTasks: openBy.get(r.id) ?? 0 })) };
};

export const actions: Actions = {
	create: async (event) => {
		const me = requireAdmin(event);
		const form = await event.request.formData();
		const parsed = parseEmployeeForm(form);
		if (parsed.error) return parsed.error;
		const password = String(form.get('password') ?? '');
		if (password.length < 8)
			return fail(400, { message: 'รหัสผ่านเริ่มต้นต้องมีอย่างน้อย 8 ตัวอักษร', values: parsed.values });
		const db = event.locals.db;
		const [dup] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.values.email));
		if (dup) return fail(400, { message: 'อีเมลนี้มีอยู่แล้ว', values: parsed.values });
		const [u] = await db
			.insert(users)
			.values({ ...parsed.values, passwordHash: await hashPassword(password) })
			.returning();
		await logActivity(db, {
			userId: me.id, entity: 'user', entityId: u.id, entityLabel: u.name, action: 'create',
			changes: { name: [null, u.name], email: [null, u.email], role: [null, u.role], position: [null, u.position] }
		});
		return { created: u.name };
	}
};
