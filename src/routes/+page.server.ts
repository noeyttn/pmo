import { activityRows } from '#lib/server/activity.js';
import { lookups, taskRows } from '#lib/server/queries.js';
import { daysLeft, timeState, today } from '#lib/tasks.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [tasks, lk, recent] = await Promise.all([
		taskRows(locals.db),
		lookups(locals.db),
		activityRows(locals.db, { limit: 8 })
	]);
	const ref = today();
	const withState = tasks.map((t) => ({ ...t, time: timeState(t, ref), daysLeft: daysLeft(t.dueDate, ref) }));

	const summarize = (list: typeof withState) => {
		const total = list.length;
		const done = list.filter((t) => t.status === 'done').length;
		return {
			total,
			todo: list.filter((t) => t.status === 'todo').length,
			doing: list.filter((t) => t.status === 'doing').length,
			done,
			overdue: list.filter((t) => t.time === 'overdue').length,
			soon: list.filter((t) => t.time === 'soon').length,
			estHours: list.reduce((s, t) => s + t.estHours, 0),
			actualHours: list.reduce((s, t) => s + t.actualHours, 0),
			doneRate: total ? done / total : 0,
			avgProgress: total ? Math.round(list.reduce((s, t) => s + t.progress, 0) / total) : 0
		};
	};

	const byPerson = lk.people
		.map((p) => ({ id: p.id, name: p.name, position: p.position, active: p.active, ...summarize(withState.filter((t) => t.assigneeId === p.id)) }))
		.filter((p) => p.active || p.total > 0);
	const byProject = lk.projects
		.filter((p) => !p.archived)
		.map((p) => ({ id: p.id, name: p.name, ...summarize(withState.filter((t) => t.projectId === p.id)) }));

	return {
		today: ref,
		totals: summarize(withState),
		byPerson,
		byProject,
		overdue: withState.filter((t) => t.time === 'overdue').sort((a, b) => a.daysLeft! - b.daysLeft!),
		soon: withState.filter((t) => t.time === 'soon').sort((a, b) => a.daysLeft! - b.daysLeft!),
		recent,
		...lk
	};
};
