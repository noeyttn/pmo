import { asc, eq } from 'drizzle-orm';
import type { DB } from './db';
import { projects, tasks, users } from './db/schema';

export async function lookups(db: DB) {
	const [people, projectList] = await Promise.all([
		db
			.select({ id: users.id, name: users.name, active: users.active, position: users.position })
			.from(users)
			.orderBy(asc(users.id)),
		db
			.select({ id: projects.id, name: projects.name, archived: projects.archived })
			.from(projects)
			.orderBy(asc(projects.id))
	]);
	return { people, projects: projectList };
}

/** All tasks joined with project + assignee names (small team → aggregate in JS). */
export function taskRows(db: DB) {
	return db
		.select({
			id: tasks.id,
			code: tasks.code,
			title: tasks.title,
			status: tasks.status,
			priority: tasks.priority,
			startDate: tasks.startDate,
			dueDate: tasks.dueDate,
			estHours: tasks.estHours,
			actualHours: tasks.actualHours,
			progress: tasks.progress,
			note: tasks.note,
			updatedAt: tasks.updatedAt,
			projectId: tasks.projectId,
			projectName: projects.name,
			assigneeId: tasks.assigneeId,
			assigneeName: users.name
		})
		.from(tasks)
		.innerJoin(projects, eq(projects.id, tasks.projectId))
		.leftJoin(users, eq(users.id, tasks.assigneeId))
		.orderBy(asc(tasks.code));
}
export type TaskRow = Awaited<ReturnType<typeof taskRows>>[number];
