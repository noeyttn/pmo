import { requireUser } from '#lib/server/auth.js';
import { activityRows } from '#lib/server/activity.js';
import { lookups } from '#lib/server/queries.js';
import { revertTaskActivity } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad } from './$types';

const PAGE_SIZE = 50;
const ENTITIES = ['task', 'project', 'user'] as const;

export const load: PageServerLoad = async ({ locals, url }) => {
	const entityParam = url.searchParams.get('entity');
	const entity = ENTITIES.find((e) => e === entityParam);
	const entityId = Number(url.searchParams.get('id')) || undefined;
	const userId = Number(url.searchParams.get('user')) || undefined;
	const pageNo = Math.max(1, Number(url.searchParams.get('page')) || 1);
	const [rows, lk] = await Promise.all([
		activityRows(locals.db, { entity, entityId, userId, limit: PAGE_SIZE + 1, offset: (pageNo - 1) * PAGE_SIZE }),
		lookups(locals.db)
	]);
	return { entries: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE, pageNo, ...lk };
};

export const actions: Actions = {
	revert: async (event) => {
		const me = requireUser(event);
		const form = await event.request.formData();
		await revertTaskActivity(event.locals.db, me, Number(form.get('activityId')));
		return { reverted: true };
	}
};
