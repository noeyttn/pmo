import { timeState } from './tasks';

type Filterable = {
	code: string;
	title: string;
	status: string;
	dueDate: string | null;
	projectId: number;
	assigneeId: number | null;
};

/** Apply the TaskFilters query-string params to a task list. */
export function filterTasks<T extends Filterable>(
	tasks: T[],
	params: Pick<URLSearchParams, 'get'>,
	meId?: number
): T[] {
	const q = params.get('q')?.toLowerCase().trim();
	const project = params.get('project');
	const assignee = params.get('assignee');
	const status = params.get('status');
	return tasks.filter((t) => {
		if (q && !`${t.code} ${t.title}`.toLowerCase().includes(q)) return false;
		if (project && t.projectId !== Number(project)) return false;
		if (assignee && t.assigneeId !== (assignee === 'me' ? meId : Number(assignee))) return false;
		if (status === 'overdue' || status === 'soon') return timeState(t) === status;
		if (status && t.status !== status) return false;
		return true;
	});
}
