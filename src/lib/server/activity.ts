import { and, desc, eq, type SQL } from 'drizzle-orm';
import type { DB } from './db';
import { activityLog, users } from './db/schema';

type Entity = 'task' | 'project' | 'user';
type Action = 'create' | 'update' | 'delete' | 'revert';

/** Returns { field: [before, after] } for fields that actually changed. */
export function diff<T extends Record<string, unknown>>(before: T, after: Partial<T>) {
	const changes: Record<string, [unknown, unknown]> = {};
	for (const [k, v] of Object.entries(after)) {
		if (v === undefined) continue;
		const prev = before[k] ?? null;
		if (String(prev ?? '') !== String(v ?? '')) changes[k] = [prev, v];
	}
	return changes;
}

export async function logActivity(
	db: DB,
	entry: {
		userId: number | null;
		entity: Entity;
		entityId: number;
		entityLabel: string;
		action: Action;
		changes?: Record<string, [unknown, unknown]> | null;
	}
) {
	await db.insert(activityLog).values({ ...entry, changes: entry.changes ?? null });
}

export function activityRows(
	db: DB,
	opts: { entity?: Entity; entityId?: number; userId?: number; limit?: number; offset?: number } = {}
) {
	const where: SQL[] = [];
	if (opts.entity) where.push(eq(activityLog.entity, opts.entity));
	if (opts.entityId) where.push(eq(activityLog.entityId, opts.entityId));
	if (opts.userId) where.push(eq(activityLog.userId, opts.userId));
	return db
		.select({
			id: activityLog.id,
			entity: activityLog.entity,
			entityId: activityLog.entityId,
			entityLabel: activityLog.entityLabel,
			action: activityLog.action,
			changes: activityLog.changes,
			createdAt: activityLog.createdAt,
			userName: users.name
		})
		.from(activityLog)
		.leftJoin(users, eq(users.id, activityLog.userId))
		.where(where.length ? and(...where) : undefined)
		.orderBy(desc(activityLog.createdAt), desc(activityLog.id))
		.limit(opts.limit ?? 50)
		.offset(opts.offset ?? 0);
}
