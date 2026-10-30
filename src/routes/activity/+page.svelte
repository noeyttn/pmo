<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import ActivityList from '#lib/components/ActivityList.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const q = $derived(page.url.searchParams);

	function set(key: string, value: string) {
		const params = new URLSearchParams(page.url.searchParams.toString());
		if (value) params.set(key, value);
		else params.delete(key);
		params.delete('page');
		if (key === 'entity') params.delete('id');
		goto(`?${params}`, { reset: false });
	}
	const pageHref = (n: number) => {
		const params = new URLSearchParams(page.url.searchParams.toString());
		params.set('page', String(n));
		return `?${params}`;
	};
</script>

<div class="mb-6">
	<h1 class="text-2xl font-semibold">ประวัติการแก้ไข (Activity Log)</h1>
	<p class="text-sm text-muted-foreground">
		บันทึกทุกการสร้าง / แก้ไข / ลบ ว่าใครทำอะไรเมื่อไร{data.user?.role === 'admin' ? ' · Admin กดย้อนกลับการแก้ไขงานได้' : ''}
	</p>
</div>

<div class="mb-4 flex flex-wrap gap-2">
	<select class="select w-44" value={q.get('entity') ?? ''} onchange={(e) => set('entity', e.currentTarget.value)}>
		<option value="">ทุกประเภท</option>
		<option value="task">งาน</option>
		<option value="project">โปรเจกต์</option>
		<option value="user">พนักงาน</option>
	</select>
	<select class="select w-44" value={q.get('user') ?? ''} onchange={(e) => set('user', e.currentTarget.value)}>
		<option value="">ทุกคนที่แก้ไข</option>
		{#each data.people as u (u.id)}<option value={String(u.id)}>{u.name}</option>{/each}
	</select>
	{#if q.get('id')}
		<Button variant="ghost" size="sm" onclick={() => set('id', '')}>ล้างตัวกรองรายการ #{q.get('id')}</Button>
	{/if}
</div>

{#if form?.reverted}<p class="mb-4 rounded-lg bg-purple-50 p-3 text-sm text-purple-800">ย้อนกลับเรียบร้อย (บันทึกเป็นรายการใหม่)</p>{/if}

<Card.Root>
	<Card.Content>
		<ActivityList
			entries={data.entries}
			people={data.people}
			projects={data.projects}
			canRevert={data.user?.role === 'admin'}
			revertAction="?/revert"
		/>
	</Card.Content>
</Card.Root>

<div class="mt-4 flex justify-between">
	{#if data.pageNo > 1}<Button variant="outline" href={pageHref(data.pageNo - 1)}>← ใหม่กว่า</Button>{:else}<span></span>{/if}
	{#if data.hasMore}<Button variant="outline" href={pageHref(data.pageNo + 1)}>เก่ากว่า →</Button>{/if}
</div>
