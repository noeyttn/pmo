<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Input } from '#lib/components/ui/input/index.js';

	type Opt = { id: number; name: string };
	let {
		people,
		projects,
		showStatus = true
	}: { people: Opt[]; projects: Opt[]; showStatus?: boolean } = $props();

	const q = $derived(page.url.searchParams);

	function set(key: string, value: string) {
		const params = new URLSearchParams(page.url.searchParams.toString());
		if (value) params.set(key, value);
		else params.delete(key);
		goto(`?${params}`, { reset: false, replace: true });
	}
</script>

<div class="mb-4 grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
	<Input
		class="lg:w-64"
		placeholder="ค้นหาชื่องาน / รหัส…"
		value={q.get('q') ?? ''}
		oninput={(e) => set('q', e.currentTarget.value)}
	/>
	<select class="select lg:w-48" value={q.get('project') ?? ''} onchange={(e) => set('project', e.currentTarget.value)}>
		<option value="">ทุกโปรเจกต์</option>
		{#each projects as p (p.id)}<option value={String(p.id)}>{p.name}</option>{/each}
	</select>
	<select class="select lg:w-44" value={q.get('assignee') ?? ''} onchange={(e) => set('assignee', e.currentTarget.value)}>
		<option value="">ทุกคน</option>
		<option value="me">งานของฉัน</option>
		{#each people as u (u.id)}<option value={String(u.id)}>{u.name}</option>{/each}
	</select>
	{#if showStatus}
		<select class="select lg:w-40" value={q.get('status') ?? ''} onchange={(e) => set('status', e.currentTarget.value)}>
			<option value="">ทุกสถานะ</option>
			<option value="todo">To do</option>
			<option value="doing">Doing</option>
			<option value="done">Done</option>
			<option value="overdue">เกินกำหนด</option>
			<option value="soon">ใกล้ครบกำหนด</option>
		</select>
	{/if}
</div>
