<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import TaskTable from '#lib/components/TaskTable.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const p = $derived(data.project);
	let editing = $state(false);
</script>

<a href="/projects" class="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
	<ArrowLeft class="size-4" /> โปรเจกต์ทั้งหมด
</a>
<div class="mb-6 flex flex-wrap items-center gap-3">
	<h1 class="text-2xl font-semibold">{p.name}</h1>
	{#if p.archived}<span class="rounded-full bg-zinc-200 px-2 py-0.5 text-xs">เก็บถาวร</span>{/if}
	<div class="ml-auto flex gap-2">
		<Button variant="outline" size="sm" href="/board?project={p.id}">ดูบน Kanban</Button>
		<Button variant="outline" size="sm" href="/activity?entity=project&id={p.id}">ประวัติ</Button>
		{#if data.user?.role === 'admin'}
			<Button size="sm" variant="outline" onclick={() => (editing = !editing)}>แก้ไข</Button>
			<Button size="sm" href="/tasks/new?project={p.id}">+ เพิ่มงาน</Button>
		{/if}
	</div>
</div>
{#if p.description}<p class="mb-6 text-muted-foreground">{p.description}</p>{/if}

{#if editing || form?.message}
	<Card.Root class="mb-6">
		<Card.Content>
			<form
				method="POST"
				action="?/update"
				class="grid gap-4 sm:grid-cols-[1fr_2fr]"
				use:enhance={() => async ({ update, result }) => {
					await update({ reset: false });
					if (result.type === 'success') editing = false;
				}}
			>
				<div class="space-y-2">
					<Label for="name">ชื่อ</Label>
					<Input id="name" name="name" value={p.name} required />
				</div>
				<div class="space-y-2">
					<Label for="description">รายละเอียด</Label>
					<Input id="description" name="description" value={p.description ?? ''} />
				</div>
				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" name="archived" checked={p.archived} /> เก็บถาวร (ซ่อนจากหน้ารวม)
				</label>
				<div class="flex gap-2 sm:justify-end"><Button type="submit">บันทึก</Button></div>
				{#if form?.message}<p class="text-sm text-destructive">{form.message}</p>{/if}
			</form>
		</Card.Content>
	</Card.Root>
{/if}

<TaskTable tasks={data.tasks} showProject={false} />
