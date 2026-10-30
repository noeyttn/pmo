import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { getDb } from '#lib/server/db/index.js';
import { SESSION_COOKIE, validateSession } from '#lib/server/auth.js';

const PUBLIC_PATHS = ['/login'];

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.db = await getDb(event.platform);
	const sid = event.cookies.get(SESSION_COOKIE);
	event.locals.user = sid ? await validateSession(event.locals.db, sid) : null;
	if (sid && !event.locals.user) event.cookies.delete(SESSION_COOKIE, { path: '/' });

	if (!event.locals.user && !PUBLIC_PATHS.includes(event.url.pathname)) {
		redirect(303, `/login?next=${encodeURIComponent(event.url.pathname)}`);
	}
	return resolve(event);
};
