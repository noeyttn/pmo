import { error, redirect, type Cookies, type RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { DB } from './db';
import { sessions, users } from './db/schema';

export const SESSION_COOKIE = 'pm_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export type SessionUser = { id: number; name: string; email: string; role: 'admin' | 'member' };

function newSessionId() {
	return [...crypto.getRandomValues(new Uint8Array(24))].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createSession(db: DB, cookies: Cookies, userId: number, secure: boolean) {
	const id = newSessionId();
	const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
	await db.insert(sessions).values({ id, userId, expiresAt });
	cookies.set(SESSION_COOKIE, id, { path: '/', httpOnly: true, sameSite: 'lax', secure, expires: expiresAt });
}

export async function validateSession(db: DB, id: string): Promise<SessionUser | null> {
	const [row] = await db
		.select({
			expiresAt: sessions.expiresAt,
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			active: users.active
		})
		.from(sessions)
		.innerJoin(users, eq(users.id, sessions.userId))
		.where(eq(sessions.id, id));
	if (!row || !row.active || row.expiresAt.getTime() < Date.now()) {
		if (row) await db.delete(sessions).where(eq(sessions.id, id));
		return null;
	}
	return { id: row.id, name: row.name, email: row.email, role: row.role };
}

export async function destroySession(db: DB, cookies: Cookies) {
	const id = cookies.get(SESSION_COOKIE);
	if (id) await db.delete(sessions).where(eq(sessions.id, id));
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function requireUser(event: Pick<RequestEvent, 'locals' | 'url'>): SessionUser {
	if (!event.locals.user) redirect(303, `/login?next=${encodeURIComponent(event.url.pathname)}`);
	return event.locals.user;
}

export function requireAdmin(event: Pick<RequestEvent, 'locals' | 'url'>): SessionUser {
	const user = requireUser(event);
	if (user.role !== 'admin') error(403, 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น');
	return user;
}
