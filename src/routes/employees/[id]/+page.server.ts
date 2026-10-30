import { error, fail, redirect } from '@sveltejs/kit';
import { and, count, eq, ne } from 'drizzle-orm';
import { activityLog, sessions, tasks, users } from '#lib/server/db/schema.js';
import { requireAdmin } from '#lib/server/auth.js';
import { hashPassword } from '#lib/server/password.js';
import { diff, logActivity } from '#lib/server/activity.js';
import { parseEmployeeForm } from '#lib/server/employees.js';
import type { Actions, PageServerLoad } from './$types';

async function getEmployee(event: { locals: App.Locals; params: { id: string } }) {
	const [u] = await event.locals.db.select().from(users).where(eq(users.id, Number(event.params.id)));
	if (!u) error(404, 'ไม่พบพนักงาน');
	return u;
}

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const { passwordHash: _, ...employee } = await getEmployee(event);
	const [{ n }] = await event.locals.db.select({ n: count() }).from(tasks).where(eq(tasks.assigneeId, employee.id));
	return { employee, taskCount: n };
};

export const actions: Actions = {
	update: async (event) => {
		const me = requireAdmin(event);
		const u = await getEmployee(event);
		const parsed = parseEmployeeForm(await event.request.formData());
		if (parsed.error) return parsed.error;
		const db = event.locals.db;
		const [dup] = await db
			.select({ id: users.id })
			.from(users)
			.where(and(eq(users.email, parsed.values.email), ne(users.id, u.id)));
		if (dup) return fail(400, { message: 'อีเมลนี้มีผู้ใช้อื่นแล้ว', values: parsed.values });
		if (u.id === me.id && parsed.values.role !== 'admin')
			return fail(400, { message: 'ไม่สามารถลดสิทธิ์ Admin ของตัวเองได้', values: parsed.values });
		const changes = diff(u, parsed.values);
		if (Object.keys(changes).length) {
			await db.update(users).set(parsed.values).where(eq(users.id, u.id));
			await logActivity(db, { userId: me.id, entity: 'user', entityId: u.id, entityLabel: parsed.values.name, action: 'update', changes });
		}
		return { saved: true };
	},
	resetPassword: async (event) => {
		const me = requireAdmin(event);
		const u = await getEmployee(event);
		const password = String((await event.request.formData()).get('password') ?? '');
		if (password.length < 8) return fail(400, { pwMessage: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });
		const db = event.locals.db;
		await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, u.id));
		await db.delete(sessions).where(eq(sessions.userId, u.id));
		await logActivity(db, {
			userId: me.id, entity: 'user', entityId: u.id, entityLabel: u.name, action: 'update',
			changes: { password: ['••••', 'รีเซ็ตโดย Admin'] }
		});
		return { pwSaved: true };
	},
	toggleActive: async (event) => {
		const me = requireAdmin(event);
		const u = await getEmployee(event);
		if (u.id === me.id) return fail(400, { message: 'ไม่สามารถปิดการใช้งานบัญชีตัวเองได้' });
		const db = event.locals.db;
		await db.update(users).set({ active: !u.active }).where(eq(users.id, u.id));
		if (u.active) await db.delete(sessions).where(eq(sessions.userId, u.id));
		await logActivity(db, {
			userId: me.id, entity: 'user', entityId: u.id, entityLabel: u.name, action: 'update',
			changes: { active: [u.active ? 'ใช้งาน' : 'ปิดใช้งาน', u.active ? 'ปิดใช้งาน' : 'ใช้งาน'] }
		});
	},
	delete: async (event) => {
		const me = requireAdmin(event);
		const u = await getEmployee(event);
		const db = event.locals.db;
		if (u.id === me.id) return fail(400, { message: 'ไม่สามารถลบบัญชีตัวเองได้' });
		const [{ t }] = await db.select({ t: count() }).from(tasks).where(eq(tasks.assigneeId, u.id));
		const [{ a }] = await db.select({ a: count() }).from(activityLog).where(eq(activityLog.userId, u.id));
		if (t > 0 || a > 0)
			return fail(400, {
				message: 'พนักงานคนนี้มีงานหรือประวัติการแก้ไขอยู่ ให้ใช้ "ปิดการใช้งาน" แทนเพื่อเก็บประวัติไว้'
			});
		await db.delete(users).where(eq(users.id, u.id));
		await logActivity(db, {
			userId: me.id, entity: 'user', entityId: u.id, entityLabel: u.name, action: 'delete',
			changes: { name: [u.name, null], email: [u.email, null] }
		});
		redirect(303, '/employees');
	}
};
