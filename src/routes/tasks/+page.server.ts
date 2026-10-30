import { lookups, taskRows } from '#lib/server/queries.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [tasks, lk] = await Promise.all([taskRows(locals.db), lookups(locals.db)]);
	return { tasks, ...lk };
};
