<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '#lib/components/ui/button/index.js';
	import TaskTable from '#lib/components/TaskTable.svelte';
	import TaskFilters from '#lib/components/TaskFilters.svelte';
	import { filterTasks } from '#lib/filter.js';
	import Plus from '@lucide/svelte/icons/plus';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const shown = $derived(filterTasks(data.tasks, page.url.searchParams, data.user?.id));
</script>

<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="text-2xl font-semibold">งานทั้งหมด</h1>
		<p class="text-sm text-muted-foreground">แสดง {shown.length} จาก {data.tasks.length} งาน</p>
	</div>
	{#if data.user?.role === 'admin'}
		<Button href="/tasks/new"><Plus /> เพิ่มงาน</Button>
	{/if}
</div>

<TaskFilters people={data.people.filter((p) => p.active)} projects={data.projects.filter((p) => !p.archived)} />
<TaskTable tasks={shown} />
