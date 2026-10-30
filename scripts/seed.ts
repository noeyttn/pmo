/**
 * Import the sample Excel workbook as initial data.
 *   npm run db:seed -- [path/to/project_tracking_sample.xlsx]
 *
 * Sheets used:
 *   "ทีมงาน"      → users   (row 4 = header, data from row 5)
 *   "งานทั้งหมด"  → projects (distinct "ลูกค้า / โครงการ") + tasks
 *   "ภาพรวม"      → not imported; it is all formulas, the Dashboard recomputes it live.
 */
import ExcelJS from 'exceljs';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../src/lib/server/db/schema';
import { hashPassword } from '../src/lib/server/password';

const file = process.argv[2] ?? 'data/project_tracking_sample.xlsx';
// Test-only default password for every imported account (see README).
const password = process.env.SEED_PASSWORD ?? 'demo1234';

const client = createClient({ url: process.env.DATABASE_URL ?? 'file:local.db' });
const db = drizzle(client, { schema });

const STATUS: Record<string, { status: schema.TaskStatus; tag?: string }> = {
	ยังไม่เริ่ม: { status: 'todo' },
	กำลังดำเนินการ: { status: 'doing' },
	รอตรวจ: { status: 'doing', tag: 'รอตรวจ' },
	ระงับ: { status: 'todo', tag: 'ระงับ' },
	เสร็จแล้ว: { status: 'done' }
};
const PRIORITY: Record<string, schema.TaskPriority> = { สูง: 'high', กลาง: 'medium', ต่ำ: 'low' };

function val(cell: ExcelJS.Cell): unknown {
	const v = cell.value as unknown;
	if (v && typeof v === 'object') {
		if ('result' in v) return (v as { result: unknown }).result;
		if ('richText' in v) return (v as { richText: { text: string }[] }).richText.map((r) => r.text).join('');
		if ('text' in v) return (v as { text: string }).text;
	}
	return v;
}
const str = (c: ExcelJS.Cell) => {
	const v = val(c);
	return v == null || v === '' ? null : String(v).trim();
};
const num = (c: ExcelJS.Cell) => Number(val(c) ?? 0) || 0;
const date = (c: ExcelJS.Cell) => {
	const v = val(c);
	return v instanceof Date ? v.toISOString().slice(0, 10) : null;
};

async function main() {
	const wb = new ExcelJS.Workbook();
	await wb.xlsx.readFile(file);
	const team = wb.getWorksheet('ทีมงาน');
	const work = wb.getWorksheet('งานทั้งหมด');
	if (!team || !work) throw new Error('ไม่พบชีต "ทีมงาน" หรือ "งานทั้งหมด"');

	// Reset (children first)
	for (const t of [schema.activityLog, schema.sessions, schema.tasks, schema.projects, schema.users]) {
		await db.delete(t);
	}

	const pw = await hashPassword(password);
	const userIdByName = new Map<string, number>();
	for (let r = 5; r <= team.rowCount; r++) {
		const row = team.getRow(r);
		const name = str(row.getCell(2));
		if (!name) continue;
		const position = str(row.getCell(3));
		const [u] = await db
			.insert(schema.users)
			.values({
				name,
				position,
				duties: str(row.getCell(4)),
				email: str(row.getCell(5))!.toLowerCase(),
				startDate: date(row.getCell(6)),
				level: str(row.getCell(7)),
				role: position?.includes('หัวหน้า') ? 'admin' : 'member',
				passwordHash: pw
			})
			.returning();
		userIdByName.set(name, u.id);
		await db.insert(schema.activityLog).values({
			userId: null, entity: 'user', entityId: u.id, entityLabel: name, action: 'create',
			changes: { source: [null, 'นำเข้าจาก Excel'] }
		});
	}

	const projectIdByName = new Map<string, number>();
	let taskCount = 0;
	for (let r = 5; r <= work.rowCount; r++) {
		const row = work.getRow(r);
		const code = str(row.getCell(1));
		if (!code) continue;
		const projectName = str(row.getCell(2)) ?? 'ไม่ระบุโครงการ';
		if (!projectIdByName.has(projectName)) {
			const [p] = await db.insert(schema.projects).values({ name: projectName }).returning();
			projectIdByName.set(projectName, p.id);
			await db.insert(schema.activityLog).values({
				userId: null, entity: 'project', entityId: p.id, entityLabel: projectName, action: 'create',
				changes: { source: [null, 'นำเข้าจาก Excel'] }
			});
		}
		const rawStatus = str(row.getCell(6)) ?? 'ยังไม่เริ่ม';
		const mapped = STATUS[rawStatus] ?? { status: 'todo', tag: rawStatus };
		const note = [mapped.tag && `[${mapped.tag}]`, str(row.getCell(14))].filter(Boolean).join(' ') || null;
		const assignee = str(row.getCell(4));

		const [t] = await db
			.insert(schema.tasks)
			.values({
				code,
				projectId: projectIdByName.get(projectName)!,
				title: str(row.getCell(3)) ?? code,
				assigneeId: assignee ? (userIdByName.get(assignee) ?? null) : null,
				priority: PRIORITY[str(row.getCell(5)) ?? ''] ?? 'medium',
				status: mapped.status,
				startDate: date(row.getCell(7)),
				dueDate: date(row.getCell(8)),
				estHours: num(row.getCell(9)),
				actualHours: num(row.getCell(10)),
				progress: Math.round(num(row.getCell(11)) * 100),
				note
			})
			.returning();
		await db.insert(schema.activityLog).values({
			userId: null, entity: 'task', entityId: t.id, entityLabel: `${code} ${t.title}`, action: 'create',
			changes: { source: [null, 'นำเข้าจาก Excel'], status: [null, rawStatus] }
		});
		taskCount++;
	}

	console.log(`Imported ${userIdByName.size} users, ${projectIdByName.size} projects, ${taskCount} tasks from ${file}`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => client.close());
