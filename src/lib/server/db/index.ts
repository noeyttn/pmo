import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { env } from 'cloudflare:workers';
import { dev } from '$app/env';
import * as schema from './schema';

/** Async SQLite database — same API for local libSQL and Cloudflare D1. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DB = BaseSQLiteDatabase<'async', any, typeof schema>;

let local: DB | undefined;

/**
 * On Cloudflare use the D1 binding `DB` (adapter-cloudflare exposes bindings via
 * `cloudflare:workers`, not `event.platform`); otherwise fall back to the local
 * SQLite file through libSQL. Swapping to D1 needs no query changes.
 * `npm run dev` always uses local.db — the adapter's dev proxy would otherwise
 * hand us an empty emulated D1 from wrangler.toml.
 */
export async function getDb(): Promise<DB> {
	if (!dev && env.DB) return drizzleD1(env.DB, { schema }) as unknown as DB;
	if (!local) {
		const { createLocalDb } = await import('./local');
		local = createLocalDb();
	}
	return local;
}

export { schema };
