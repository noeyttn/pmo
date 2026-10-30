// Shared (client + server) labels and date helpers for tasks.

export const STATUS_LABEL = { todo: 'To do', doing: 'Doing', done: 'Done' } as const;
export const STATUS_TH = { todo: 'ยังไม่เริ่ม', doing: 'กำลังทำ', done: 'เสร็จแล้ว' } as const;
export const PRIORITY_LABEL = { high: 'สูง', medium: 'กลาง', low: 'ต่ำ' } as const;
export const PRIORITY_CLASS = {
	high: 'bg-red-100 text-red-700',
	medium: 'bg-amber-100 text-amber-800',
	low: 'bg-secondary text-secondary-foreground'
} as const;
export const STATUS_CLASS = {
	todo: 'bg-fuchsia-100 text-fuchsia-800',
	doing: 'bg-violet-100 text-violet-800',
	done: 'bg-emerald-100 text-emerald-800'
} as const;

export const FIELD_LABEL: Record<string, string> = {
	title: 'ชื่องาน',
	status: 'สถานะ',
	priority: 'ความสำคัญ',
	assigneeId: 'ผู้รับผิดชอบ',
	projectId: 'โครงการ',
	startDate: 'วันเริ่ม',
	dueDate: 'กำหนดส่ง',
	estHours: 'ชม.ประเมิน',
	actualHours: 'ชม.จริง',
	progress: '% ความคืบหน้า',
	note: 'หมายเหตุ',
	name: 'ชื่อ',
	email: 'อีเมล',
	role: 'สิทธิ์',
	position: 'ตำแหน่ง',
	duties: 'หน้าที่',
	level: 'ระดับ',
	active: 'สถานะการใช้งาน',
	description: 'รายละเอียด',
	archived: 'เก็บถาวร',
	password: 'รหัสผ่าน',
	source: 'ที่มา'
};

/** Today's date (YYYY-MM-DD) in Thailand time. */
export function today(): string {
	return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
}

export function daysLeft(due: string | null, ref = today()): number | null {
	if (!due) return null;
	return Math.round((Date.parse(due) - Date.parse(ref)) / 86_400_000);
}

export type TimeState = 'done' | 'overdue' | 'soon' | 'ok' | 'none';

/** Same rule as the Excel sheet: overdue = not done and past due; soon = ≤ 3 days left. */
export function timeState(t: { status: string; dueDate: string | null }, ref = today()): TimeState {
	if (t.status === 'done') return 'done';
	const d = daysLeft(t.dueDate, ref);
	if (d === null) return 'none';
	if (d < 0) return 'overdue';
	if (d <= 3) return 'soon';
	return 'ok';
}

export const TIME_LABEL: Record<TimeState, string> = {
	done: 'เสร็จแล้ว',
	overdue: 'เกินกำหนด',
	soon: 'ใกล้ครบกำหนด',
	ok: 'ปกติ',
	none: '-'
};

export function formatDate(d: string | null | undefined): string {
	if (!d) return '-';
	return new Date(d + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

export function formatDateTime(d: Date | number | string): string {
	return new Date(d).toLocaleString('th-TH', {
		day: 'numeric',
		month: 'short',
		year: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		timeZone: 'Asia/Bangkok'
	});
}
