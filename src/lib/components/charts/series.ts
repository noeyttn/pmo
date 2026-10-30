// Chart series roles — CSS vars defined in routes/layout.css (palette validated for CVD separation).
export const STATUS_SERIES = [
	{ key: 'done', label: 'Done', color: 'var(--series-done)' },
	{ key: 'doing', label: 'Doing', color: 'var(--series-doing)' },
	{ key: 'todo', label: 'To do', color: 'var(--series-todo)' }
] as const;

export type StatusCounts = { done: number; doing: number; todo: number };

/** Round an axis max up to a clean tick step. */
export function niceTicks(max: number, count = 4): number[] {
	if (max <= 0) return [0, 1];
	const raw = max / count;
	const mag = 10 ** Math.floor(Math.log10(raw));
	const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
	const ticks: number[] = [];
	for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(Math.round(v * 100) / 100);
	if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
	return ticks;
}
