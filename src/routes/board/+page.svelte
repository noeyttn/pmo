<script lang="ts">
	import { page } from '$app/state';
	import { deserialize } from '$app/forms';
	import { invalidateAll, goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import TaskFilters from '#lib/components/TaskFilters.svelte';
	import DueBadge from '#lib/components/DueBadge.svelte';
	import { filterTasks } from '#lib/filter.js';
	import { PRIORITY_CLASS, PRIORITY_LABEL, STATUS_LABEL, formatDate } from '#lib/tasks.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const me = $derived(data.user!);
	const isAdmin = $derived(me.role === 'admin');

	// Members land on their own tasks by default.
	onMount(() => {
		if (!isAdmin && !page.url.searchParams.has('assignee')) goto('?assignee=me', { replaceState: true });
	});

	// Optimistic status overrides while the server round-trip is in flight.
	let pending = $state<Record<number, 'todo' | 'doing' | 'done'>>({});
	let errorMsg = $state('');
	let dragId = $state<number | null>(null);
	let overCol = $state<string | null>(null);
	// Phone: one column at a time, picked with the segmented tabs.
	let mobileCol = $state<'todo' | 'doing' | 'done'>('doing');

	const shown = $derived(
		filterTasks(data.tasks, page.url.searchParams, me.id).map((t) => ({ ...t, status: pending[t.id] ?? t.status }))
	);
	const columns = ['todo', 'doing', 'done'] as const;
	const COL_STYLE = { todo: 'border-t-todo', doing: 'border-t-doing', done: 'border-t-done' };
	const canMove = (t: { assigneeId: number | null }) => isAdmin || t.assigneeId === me.id;

	async function move(id: number, status: (typeof columns)[number]) {
		const task = data.tasks.find((t) => t.id === id);
		if (!task || (pending[id] ?? task.status) === status) return;
		errorMsg = '';
		pending[id] = status;
		const body = new FormData();
		body.set('id', String(id));
		body.set('status', status);
		const res = await fetch('?/move', { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } });
		const result = deserialize(await res.text());
		if (result.type !== 'success') {
			errorMsg = result.type === 'error' ? (result.error?.message ?? 'อัปเดตไม่สำเร็จ') : 'อัปเดตไม่สำเร็จ';
		}
		await invalidateAll();
		delete pending[id];
	}
</script>

<div class="mb-4 flex flex-wrap items-end justify-between gap-3">
	<div>
		<h1 class="text-2xl font-semibold">Kanban Board</h1>
		<p class="text-sm text-muted-foreground">
			<span class="hidden md:inline">ลากการ์ดเพื่อเปลี่ยนสถานะ</span><span class="md:hidden">แตะปุ่มบนการ์ดเพื่อย้ายสถานะ</span>
			{isAdmin ? '' : '(ย้ายได้เฉพาะงานของคุณ)'} — ทุกการเปลี่ยนแปลงถูกบันทึกในประวัติ
		</p>
	</div>
</div>

<TaskFilters people={data.people.filter((p) => p.active)} projects={data.projects.filter((p) => !p.archived)} showStatus={false} />

{#if errorMsg}<p class="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMsg}</p>{/if}

<!-- Phone: segmented tabs choose the visible column -->
<div class="sticky top-[57px] z-20 -mx-4 mb-3 bg-background/85 px-4 py-2 backdrop-blur md:hidden" role="tablist" aria-label="สถานะ">
	<div class="grid grid-cols-3 gap-1 rounded-2xl bg-secondary p-1">
		{#each columns as col (col)}
			<button
				role="tab"
				aria-selected={mobileCol === col}
				class="flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium transition-colors {mobileCol === col
					? 'bg-card text-foreground shadow-sm'
					: 'text-muted-foreground'}"
				onclick={() => (mobileCol = col)}
			>
				<span class="size-2 rounded-full" style="background: var(--series-{col})"></span>
				{STATUS_LABEL[col]}
				<span class="text-xs tabular-nums text-muted-foreground">{shown.filter((t) => t.status === col).length}</span>
			</button>
		{/each}
	</div>
</div>

<div class="grid gap-4 md:grid-cols-3">
	{#each columns as col (col)}
		{@const items = shown.filter((t) => t.status === col)}
		<section
			class="flex-col rounded-3xl border border-t-4 bg-muted/50 md:flex md:min-h-[60vh] {mobileCol === col
				? 'flex'
				: 'hidden'} {COL_STYLE[col]} {overCol === col ? 'ring-2 ring-ring' : ''}"
			aria-label={STATUS_LABEL[col]}
			ondragover={(e) => {
				e.preventDefault();
				overCol = col;
			}}
			ondragleave={() => (overCol = null)}
			ondrop={(e) => {
				e.preventDefault();
				overCol = null;
				if (dragId !== null) move(dragId, col);
				dragId = null;
			}}
		>
			<header class="flex items-center justify-between px-3 py-2.5">
				<h2 class="font-semibold">{STATUS_LABEL[col]}</h2>
				<span class="rounded-full bg-background px-2 text-sm tabular-nums text-muted-foreground">{items.length}</span>
			</header>
			<div class="flex flex-1 flex-col gap-2 px-2 pb-2">
				{#each items as t (t.id)}
					<article
						class="rounded-2xl border bg-card p-3 shadow-xs transition-opacity {canMove(t) ? 'cursor-grab active:cursor-grabbing' : ''} {pending[t.id] ? 'opacity-60' : ''} {dragId === t.id ? 'opacity-40' : ''}"
						draggable={canMove(t)}
						ondragstart={(e) => {
							dragId = t.id;
							e.dataTransfer?.setData('text/plain', String(t.id));
						}}
						ondragend={() => (dragId = null)}
					>
						<div class="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
							<span class="font-mono">{t.code}</span>
							<span class="truncate">{t.projectName}</span>
						</div>
						<a href="/tasks/{t.id}" class="block text-sm leading-snug font-medium hover:underline">{t.title}</a>
						<div class="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
							<span class="rounded-full px-2 py-0.5 {PRIORITY_CLASS[t.priority]}">{PRIORITY_LABEL[t.priority]}</span>
							<DueBadge task={t} />
							{#if t.note?.startsWith('[')}
								<span class="rounded-full bg-purple-100 px-2 py-0.5 text-purple-700">{t.note.slice(1, t.note.indexOf(']'))}</span>
							{/if}
						</div>
						<div class="mt-2 flex items-center justify-between text-xs text-muted-foreground">
							<span class="font-medium text-foreground">{t.assigneeName ?? '—'}</span>
							<span>{formatDate(t.dueDate)} · {t.progress}%</span>
						</div>
						{#if canMove(t)}
							<!-- Touch screens can't drag: tap a target status instead -->
							<div class="mt-3 flex gap-1.5 border-t pt-2.5 md:hidden">
								{#each columns.filter((c) => c !== t.status) as c (c)}
									<button
										class="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-secondary py-2 text-xs font-medium active:bg-accent"
										onclick={() => move(t.id, c)}
									>
										<span class="size-2 rounded-full" style="background: var(--series-{c})"></span> ย้ายไป {STATUS_LABEL[c]}
									</button>
								{/each}
							</div>
						{/if}
					</article>
				{:else}
					<p class="py-6 text-center text-sm text-muted-foreground">ไม่มีงาน</p>
				{/each}
			</div>
		</section>
	{/each}
</div>
