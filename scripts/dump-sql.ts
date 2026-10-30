/**
 * Dump the rows of a local SQLite DB as INSERT statements (for loading into Cloudflare D1).
 *   DATABASE_URL=file:seed.db npx tsx scripts/dump-sql.ts > seed.sql
 *   npx wrangler d1 execute pm-app --remote --file=seed.sql
 */
import { createClient } from '@libsql/client';

// Parents before children so foreign keys are satisfied.
const TABLES = ['users', 'projects', 'tasks', 'activity_log'];

const client = createClient({ url: process.env.DATABASE_URL ?? 'file:local.db' });

const lit = (v: unknown) =>
	v === null || v === undefined
		? 'NULL'
		: typeof v === 'number' || typeof v === 'bigint'
			? String(v)
			: `'${String(v).replaceAll("'", "''")}'`;

for (const table of TABLES) {
	const { rows, columns } = await client.execute(`SELECT * FROM ${table} ORDER BY id`);
	for (const row of rows) {
		const values = columns.map((c) => lit(row[c]));
		console.log(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});`);
	}
}
client.close();
