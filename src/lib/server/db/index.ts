import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import * as schema from './schema';

/** Async SQLite database — same API for local libSQL and Cloudflare D1. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DB = BaseSQLiteDatabase<'async', any, typeof schema>;

let local: DB | undefined;

/**
 * On Cloudflare (D1 binding `DB` present) use D1; otherwise fall back to the
 * local SQLite file through libSQL. Swapping to D1 needs no query changes.
 */
export async function getDb(platform?: App.Platform): Promise<DB> {
	const d1 = platform?.env?.DB;
	if (d1) return drizzleD1(d1, { schema }) as unknown as DB;
	if (!local) {
		const { createLocalDb } = await import('./local');
		local = createLocalDb();
	}
	return local;
}

export { schema };
