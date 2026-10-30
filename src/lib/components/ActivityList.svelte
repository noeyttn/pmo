<script lang="ts">
	import { enhance } from '$app/forms';
	import { FIELD_LABEL, PRIORITY_LABEL, STATUS_LABEL, formatDate, formatDateTime } from '#lib/tasks.js';
	import Undo2 from '@lucide/svelte/icons/undo-2';

	type Entry = {
		id: number;
		entity: string;
		entityId: number;
		entityLabel: string;
		action: string;
		changes: Record<string, [unknown, unknown]> | null;
		createdAt: Date;
		userName: string | null;
	};
	let {
		entries,
		people,
		projects,
		showEntity = true,
		canRevert = false,
		revertAction = '/activity?/revert'
	}: {
		entries: Entry[];
		people: { id: number; name: string }[];
		projects: { id: number; name: string }[];
		showEntity?: boolean;
		canRevert?: boolean;
		revertAction?: string;
	} = $props();

	const personName = $derived(new Map(people.map((p) => [p.id, p.name])));
	const projectName = $derived(new Map(projects.map((p) => [p.id, p.name])));

	const ACTION = {
		create: { label: 'สร้าง', cls: 'bg-emerald-100 text-emerald-800' },
		update: { label: 'แก้ไข', cls: 'bg-violet-100 text-violet-800' },
		delete: { label: 'ลบ', cls: 'bg-red-100 text-red-700' },
		revert: { label: 'ย้อนกลับ', cls: 'bg-fuchsia-100 text-fuchsia-800' }
	} as Record<string, { label: string; cls: string }>;
	const ENTITY: Record<string, string> = { task: 'งาน', project: 'โปรเจกต์', user: 'พนักงาน' };

	function show(field: string, v: unknown): string {
		if (v === null || v === undefined || v === '') return '—';
		if (field === 'status') return STATUS_LABEL[v as keyof typeof STATUS_LABEL] ?? String(v);
		if (field === 'priority') return PRIORITY_LABEL[v as keyof typeof PRIORITY_LABEL] ?? String(v);
		if (field === 'assigneeId') return personName.get(Number(v)) ?? `#${v}`;
		if (field === 'projectId') return projectName.get(Number(v)) ?? `#${v}`;
		if (field === 'progress') return `${v}%`;
		if (field === 'archived') return v ? 'ใช่' : 'ไม่';
		if (field === 'role') return v === 'admin' ? 'Admin' : 'พนักงาน';
		if (/Date$/.test(field) && typeof v === 'string') return formatDate(v);
		return String(v);
	}
	const href = (e: Entry) =>
		e.action === 'delete' ? null : e.entity === 'task' ? `/tasks/${e.entityId}` : e.entity === 'project' ? `/projects/${e.entityId}` : null;
</script>

<ol class="relative space-y-4 border-l pl-6">
	{#each entries as e (e.id)}
		<li class="relative">
			<span class="absolute top-1.5 -left-[1.82rem] size-3 rounded-full border-2 border-background bg-primary/60"></span>
			<div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
				<span class="font-medium">{e.userName ?? 'ระบบ'}</span>
				<span class="rounded-full px-2 py-0.5 text-xs {ACTION[e.action]?.cls}">{ACTION[e.action]?.label ?? e.action}</span>
				{#if showEntity}
					<span class="text-muted-foreground">{ENTITY[e.entity]}</span>
					{#if href(e)}
						<a href={href(e)} class="font-medium hover:underline">{e.entityLabel}</a>
					{:else}
						<span class="font-medium">{e.entityLabel}</span>
					{/if}
				{/if}
				<span class="ml-auto text-xs text-muted-foreground">{formatDateTime(e.createdAt)}</span>
			</div>
			{#if e.changes && Object.keys(e.changes).length}
				<ul class="mt-1.5 space-y-0.5 rounded-lg bg-muted/60 px-3 py-2 text-xs">
					{#each Object.entries(e.changes) as [field, [before, after]] (field)}
						<li>
							<span class="text-muted-foreground">{FIELD_LABEL[field] ?? field}:</span>
							{#if e.action !== 'create'}
								<span class="line-through decoration-red-400">{show(field, before)}</span> →
							{/if}
							<span class="font-medium">{show(field, after)}</span>
						</li>
					{/each}
				</ul>
			{/if}
			{#if canRevert && e.entity === 'task' && (e.action === 'update' || e.action === 'revert')}
				<form
					method="POST"
					action={revertAction}
					class="mt-1"
					use:enhance={({ cancel }) => {
						if (!confirm('ย้อนค่ากลับเป็นค่าก่อนการแก้ไขนี้?')) cancel();
					}}
				>
					<input type="hidden" name="activityId" value={e.id} />
					<button class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
						<Undo2 class="size-3" /> ย้อนกลับการแก้ไขนี้
					</button>
				</form>
			{/if}
		</li>
	{:else}
		<li class="text-sm text-muted-foreground">ยังไม่มีประวัติ</li>
	{/each}
</ol>
