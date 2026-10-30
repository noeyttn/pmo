import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { users } from '#lib/server/db/schema.js';
import { requireUser } from '#lib/server/auth.js';
import { hashPassword, verifyPassword } from '#lib/server/password.js';
import { logActivity } from '#lib/server/activity.js';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event) => {
		const me = requireUser(event);
		const form = await event.request.formData();
		const current = String(form.get('current') ?? '');
		const next = String(form.get('next') ?? '');
		if (next.length < 8) return fail(400, { message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' });
		const db = event.locals.db;
		const [u] = await db.select().from(users).where(eq(users.id, me.id));
		if (!(await verifyPassword(current, u.passwordHash))) return fail(400, { message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
		await db.update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, me.id));
		await logActivity(db, {
			userId: me.id, entity: 'user', entityId: me.id, entityLabel: me.name, action: 'update',
			changes: { password: ['••••', 'เปลี่ยนรหัสผ่าน'] }
		});
		return { ok: true };
	}
};
