import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { users } from '#lib/server/db/schema.js';
import { createSession } from '#lib/server/auth.js';
import { verifyPassword } from '#lib/server/password.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ request, locals, cookies, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const password = String(form.get('password') ?? '');
		const [user] = await locals.db.select().from(users).where(eq(users.email, email));
		if (!user || !user.active || !(await verifyPassword(password, user.passwordHash))) {
			return fail(400, { email, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
		}
		await createSession(locals.db, cookies, user.id, url.protocol === 'https:');
		const next = url.searchParams.get('next');
		redirect(303, next?.startsWith('/') && !next.startsWith('//') ? next : '/');
	}
};
