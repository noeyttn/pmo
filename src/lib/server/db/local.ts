import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import type { DB } from './index';

export function createLocalDb(): DB {
	const client = createClient({ url: process.env.DATABASE_URL ?? 'file:local.db' });
	return drizzle(client, { schema }) as unknown as DB;
}
